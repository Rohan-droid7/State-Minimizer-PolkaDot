#![no_main]
#![no_std]

use uapi::{HostFn, HostFnImpl as api, ReturnFlags};

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    unsafe {
        core::arch::asm!("unimp");
        core::hint::unreachable_unchecked();
    }
}

// ============================================================
// EVM ABI Encoding Helpers
// ============================================================

fn return_evm_bytes(data: &[u8]) {
    let len = data.len();
    let padded_len = ((len + 31) / 32) * 32;
    
    // REDUCED: 512 + 64 bytes for header is plenty for the demo
    let mut out = [0u8; 600]; 
    
    out[31] = 0x20; 
    out[60..64].copy_from_slice(&(len as u32).to_be_bytes());
    
    if len > 0 {
        out[64..64 + len].copy_from_slice(data);
    }
    
    api::return_value(ReturnFlags::empty(), &out[0..(64 + padded_len)]);
}

// ============================================================
// Compression Algorithms (Run-Length Encoding)
// ============================================================

fn compress_rle(input: &[u8], output: &mut [u8]) -> usize {
    if input.is_empty() { return 0; }
    let mut out_idx = 0;
    let mut i = 0;
    
    while i < input.len() {
        let mut count = 1;
        while i + count < input.len() && input[i] == input[i + count] && count < 255 {
            count += 1;
        }
        if out_idx + 2 > output.len() { break; } 
        
        output[out_idx] = count as u8;
        output[out_idx + 1] = input[i];
        out_idx += 2;
        i += count;
    }
    out_idx
}

fn decompress_rle(input: &[u8], output: &mut [u8]) -> usize {
    let mut out_idx = 0;
    let mut i = 0;
    
    while i + 1 < input.len() {
        let count = input[i] as usize;
        let val = input[i+1];
        
        for _ in 0..count {
            if out_idx < output.len() {
                output[out_idx] = val;
                out_idx += 1;
            }
        }
        i += 2;
    }
    out_idx
}

// ============================================================
// Entry Point
// ============================================================

#[no_mangle]
#[polkavm_derive::polkavm_export]
pub extern "C" fn deploy() {
    // Explicitly halt execution and return success (status 0)
    api::return_value(ReturnFlags::empty(), &[]);
}

#[no_mangle]
#[polkavm_derive::polkavm_export]
pub extern "C" fn call() {
    let len = api::call_data_size();
    if len < 4 {
        api::return_value(ReturnFlags::REVERT, b"Input too short");
    }

    let mut selector = [0u8; 4];
    api::call_data_copy(&mut selector, 0);

    if len < 68 {
        api::return_value(ReturnFlags::REVERT, b"Invalid calldata structure");
    }

    let mut header = [0u8; 68];
    api::call_data_copy(&mut header, 0);

    let mut len_bytes = [0u8; 4];
    len_bytes.copy_from_slice(&header[64..68]);
    let data_len = u32::from_be_bytes(len_bytes) as usize;

    if len < (68 + data_len) as u64 {
        api::return_value(ReturnFlags::REVERT, b"Calldata length mismatch");
    }

    // REDUCED STACK FOOTPRINT
    let mut payload = [0u8; 512]; 
    if data_len > 512 {
        api::return_value(ReturnFlags::REVERT, b"Payload exceeds demo limits");
    }
    api::call_data_copy(&mut payload, 68);
    let actual_data = &payload[0..data_len];

    // selector: compress(bytes) = 0x7e2224bd
    if selector == [0x7e, 0x22, 0x24, 0xbd] {
        let mut out_buf = [0u8; 512]; 
        let comp_len = compress_rle(actual_data, &mut out_buf);
        return_evm_bytes(&out_buf[0..comp_len]);
    }
    // selector: decompress(bytes) = 0x5cd3f3a1
    else if selector == [0x5c, 0xd3, 0xf3, 0xa1] {
        let mut out_buf = [0u8; 512]; 
        let decomp_len = decompress_rle(actual_data, &mut out_buf);
        return_evm_bytes(&out_buf[0..decomp_len]);
    } else {
        api::return_value(ReturnFlags::REVERT, b"Unknown selector");
    }
}