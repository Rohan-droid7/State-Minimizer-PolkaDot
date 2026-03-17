// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRustCompressor {
    function compress(bytes memory data) external returns (bytes memory);
    function decompress(bytes memory compressedData) external returns (bytes memory);
}

contract PolkaVMStorageHub {
    IRustCompressor public rustVM;
    address public admin;

    // Multi-user storage: Wallet Address -> File Name (Key) -> Compressed Bytes
    mapping(address => mapping(string => bytes)) private userStorage;

    // Global metric for the pitch deck
    uint256 public totalBytesSaved;

    // Events for a frontend to build a real-time analytics dashboard
    event DataStored(
        address indexed user, 
        string key, 
        uint256 originalSize, 
        uint256 compressedSize, 
        uint256 bytesSaved
    );
    event CompressorUpgraded(address newRustVM);

    constructor(address _rustContract) {
        rustVM = IRustCompressor(_rustContract);
        admin = msg.sender;
    }

    
    event DataDecompressed(bytes data);

    function retrieveFullData(address user, string memory key) public returns (bytes memory) {
    bytes memory compressed = userStorage[user][key];
    require(compressed.length > 0, "No data found");
    
    // Call Rust to decompress
    bytes memory decompressed = rustVM.decompress(compressed);
    
    // EMIT THE EVENT so the frontend can see the result
    emit DataDecompressed(decompressed);
    
    return decompressed;
}

    /// @dev Compresses and stores data under a specific key for the caller
    function storeData(string memory key, bytes memory rawData) public {
        uint256 originalSize = rawData.length;
        
        // 1. Cross-VM call to compress
        bytes memory compressed = rustVM.compress(rawData);
        uint256 compressedSize = compressed.length;

        // 2. Save the tiny payload to the EVM state
        userStorage[msg.sender][key] = compressed;

        // 3. Update global metrics
        uint256 saved = originalSize > compressedSize ? originalSize - compressedSize : 0;
        totalBytesSaved += saved;

        // 4. Fire the event for the frontend
        emit DataStored(msg.sender, key, originalSize, compressedSize, saved);
    }

    /// @dev Retrieves and fully inflates a specific file for a user
    function retrieveData(address user, string memory key) public returns (bytes memory) {
        bytes memory compressed = userStorage[user][key];
        require(compressed.length > 0, "No data found for this key");
        
        // Cross-VM call to decompress back to original form
        return rustVM.decompress(compressed);
    }

    /// @dev View function to check the raw compressed size on-chain
    function getCompressedSize(address user, string memory key) public view returns (uint256) {
        return userStorage[user][key].length;
    }

    /// @dev Allows the admin to upgrade the Rust compression engine (e.g., from RLE to LZ4)
    function upgradeCompressor(address _newRustVM) public {
        require(msg.sender == admin, "Only admin can upgrade");
        rustVM = IRustCompressor(_newRustVM);
        emit CompressorUpgraded(_newRustVM);
    }

    function getCompressedData(address user, string memory key) public view returns (bytes memory) {
        return userStorage[user][key];
    }
}