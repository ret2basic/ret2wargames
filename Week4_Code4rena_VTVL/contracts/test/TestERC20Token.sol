//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20Token is ERC20 {
    // uint constant _initialSupply = 100 * (10**18);
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_) ERC20(name_, symbol_) {
        uint256 supplyToMint = initialSupply_ * (10 ** decimals());
        _mint(msg.sender, supplyToMint);
    }
}