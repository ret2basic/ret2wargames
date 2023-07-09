//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mint everything at once
// VariableSupplyERC20Token could be used instead, but it needs to track available to mint supply (extra slot)
contract FullPremintERC20Token is ERC20 {
    // uint constant _initialSupply = 100 * (10**18);
    constructor(string memory name_, string memory symbol_, uint256 supply_) ERC20(name_, symbol_) {
        require(supply_ > 0, "NO_ZERO_MINT");
        _mint(_msgSender(), supply_);
    }
}