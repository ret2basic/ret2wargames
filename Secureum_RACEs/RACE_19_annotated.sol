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
        // @audit-issue Unchecked return value
        payable(addr).send(msg.value);
    }


    function deploy(uint256 salt) public returns (address addr) {
        // @audit-issue This is runtime code, should be creation code
        bytes memory code = implementation.code; // type(Wallet).creationCode
        assembly {
            // @audit-info Unchecked return value, deployment can fail
            addr := create2(0, add(code, 0x20), mload(code), salt) // addr can address(0)
            /* if iszero(addr){
                revert(0, 0)
            }
            */
        }
    }
}


contract Wallet {

    // @audit-issue Set up the owner role, owner = msg.sender in constructor

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
        // @audit-info Has nonce
        // @audit-issue No chainId, signature replay attack
        bytes32 hash = keccak256(abi.encode(address(this), nonce, /*chainId*/, transaction));


        bytes32 r = readBytes32(signature, 0); // 32 byte
        bytes32 s = readBytes32(signature, 32); // 32 byte
        uint8 v = uint8(signature[64]); // 1 byte
        address signer = ecrecover(hash, v, r, s); // @audit-issue signature malleability
        // signature 1: s
        // signature 2: -s = n - s, secp256k1 -> modulo n

        // signature: rrrrrrrrrr0ssssssssssssv
        // compact signature: rrrrrrrrrvssssssssss

        // @audit-issue should be &&
        if (signer == msg.sender || signer == transaction.from) { 
            address to = transaction.to;
            uint256 value = transaction.value;
            bytes memory data = transaction.data;


            assembly {
                // @audit-issue Arbitrary code execution (RCE)
                // @audit-issue Unchecked return value
                let res := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
            }
            return;
        } 

        // @audit-issue Incrementating after return
        // @audit-issue reentrancy
        nonce++;
    }


    function executeMultiple(Transaction[] calldata transactions, bytes[] calldata signatures) external payable {
        // @audit-issue Maybe out-of-bound access
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
        // @audit-issue owner is an input
        require(msg.sender == owner, "Unauthorized");
        nftContract.burn(id);
    }


   function burnERC1155(ERC1155Burnable semiFungibleToken, uint256 id, uint256 amount) external {
        // @audit-issue No access control
        semiFungibleToken.burn(msg.sender, id, amount);
    }

    // @audit no onERC721Received() callbakc, can't receive via _safeTransfer()
}
