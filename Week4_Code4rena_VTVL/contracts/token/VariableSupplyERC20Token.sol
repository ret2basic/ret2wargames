//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../AccessProtected.sol";

/**
@notice A ERC20 token contract that allows minting at will, with limited or unlimited supply.
 */
contract VariableSupplyERC20Token is ERC20, AccessProtected {
    uint256 public mintableSupply;

    /**
    @notice A ERC20 token contract that allows minting at will, with limited or unlimited supply. No burning possible
    @dev
    @param name_ - Name of the token
    @param symbol_ - Symbol of the token
    @param initialSupply_ - How much to immediately mint (saves another transaction). If 0, no mint at the beginning.
    @param maxSupply_ - What's the maximum supply. The contract won't allow minting over this amount. Set to 0 for no limit.
    */
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_, uint256 maxSupply_) ERC20(name_, symbol_) {
        // max supply == 0 means mint at will. 
        // initialSupply_ == 0 means nothing preminted
        // Therefore, we have valid scenarios if either of them is 0
        // However, if both are 0 we might have a valid scenario as well - user just wants to create a token but doesn't want to mint anything
        // Should we allow this?
        require(initialSupply_ > 0 || maxSupply_ > 0, "INVALID_AMOUNT");
        mintableSupply = maxSupply_;
        
        // Note: the check whether initial supply is less than or equal than mintableSupply will happen in mint fn.
        if(initialSupply_ > 0) {
            mint(_msgSender(), initialSupply_);
        }
    }

    function mint(address account, uint256 amount) public onlyAdmin {
        require(account != address(0), "INVALID_ADDRESS");
        // If we're using maxSupply, we need to make sure we respect it
        // mintableSupply = 0 means mint at will
        if(mintableSupply > 0) {
            require(amount <= mintableSupply, "INVALID_AMOUNT");
            // We need to reduce the amount only if we're using the limit, if not just leave it be
            mintableSupply -= amount;
        }
        _mint(account, amount);
    }

    // We can't really have burn, because that could make our vesting contract not work.
    // Example: if the user can burn tokens already assigned to vesting schedules, it could be unable to pay its obligations.
}