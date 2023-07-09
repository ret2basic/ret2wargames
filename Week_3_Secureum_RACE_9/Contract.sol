pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";

// Assume the Proxy contract was deployed and no further transactions were made afterwards.

contract Mastercopy is Ownable {
    int256 public counter = 0;

    function increase() public onlyOwner returns (int256) {
        return ++counter;
    }

    function decrease() public onlyOwner returns (int256) {
        return --counter;
    }

}

contract Proxy is Ownable {
    mapping(bytes4 => address) public implementations;

    constructor() {
        Mastercopy mastercopy = new Mastercopy();
        implementations[bytes4(keccak256(bytes("counter()")))] = address(mastercopy);
        implementations[Mastercopy.increase.selector] = address(mastercopy);
        implementations[Mastercopy.increase.selector] = address(mastercopy);
    }

    fallback() external payable {
        address implementation = implementations[msg.sig];

        assembly {
            // Copied without changes to the logic from OpenZeppelin's Proxy contract.
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
        }
    }

    function setImplementationForSelector(bytes4 signature, address implementation) external onlyOwner {
        implementations[signature] = implementation;
    }

}
