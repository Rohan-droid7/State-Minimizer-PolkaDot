TARGETS = all clean
.PHONY: $(TARGETS)
.SILENT: $(TARGETS)

TARGET = ~/.cache/.polkavm-linker/0.26.0/riscv64emac-unknown-none-polkavm.json

all:
	RUSTC_BOOTSTRAP=1 cargo build --release \
	--target $(TARGET)

	polkatool link --strip --output contract.polkavm \
	target/riscv64emac-unknown-none-polkavm/release/contract

clean:
	cargo clean