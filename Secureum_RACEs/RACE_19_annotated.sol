pragma solidity 0.8.20;


import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";


contract WalletFactory {
    using Address for address;


    address immutable implementation;


    constructor(address _implementation) {
        implementation = _implementation;
    }


    function deployAndLoad(uint256 salt) external payable returns (address addr) {
        addr = deploy(salt);
        payable(addr).send(msg.value);
    }


    function deploy(uint256 salt) public returns (address addr) {
        bytes memory code = implementation.code;
        assembly {
            addr := create2(0, add(code, 0x20), mload(code), salt)
        }
    }
}


contract Wallet {


    struct Transaction {
        address from;
        address to;
        uint256 value;
        bytes data;
    }


    uint256 nonce;


    receive() external payable {}
    fallback() external payable {}


    function execute(Transaction calldata transaction, bytes calldata signature) public payable {
        bytes32 hash = keccak256(abi.encode(address(this), nonce, transaction));


        bytes32 r = readBytes32(signature, 0);
        bytes32 s = readBytes32(signature, 32);
        uint8 v = uint8(signature[64]);
        address signer = ecrecover(hash, v, r, s); 


        if (signer == msg.sender || signer == transaction.from) { 
            address to = transaction.to;
            uint256 value = transaction.value;
            bytes memory data = transaction.data;


            assembly {
                let res := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
            }
            return;
        } 


        nonce++;
    }


    function executeMultiple(Transaction[] calldata transactions, bytes[] calldata signatures) external payable {
        for(uint256 i = 0; i < transactions.length; ++i) execute(transactions[i], signatures[i]);
    }


    function readBytes32(bytes memory b, uint256 index) internal pure returns (bytes32 result) {
        index += 32;
        require(b.length >= index);


        assembly {
            result := mload(add(b, index))
        }
    }


    function burnNFT(address owner, ERC721Burnable nftContract, uint256 id) external {
        require(msg.sender == owner, "Unauthorized");
        nftContract.burn(id);
    }


   function burnERC1155(ERC1155Burnable semiFungibleToken, uint256 id, uint256 amount) external {
        semiFungibleToken.burn(msg.sender, id, amount);
    }
}
