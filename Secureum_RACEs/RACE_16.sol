// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/interfaces/IERC3156FlashLender.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";


contract FlashLoan is IERC3156FlashLender {
   bytes32 public constant CALLBACK_SUCCESS = keccak256("ERC3156FlashBorrower.onFlashLoan");
   uint256 public fee;


   /**
    * @param fee_ the fee that should be paid on a flashloan
    */
   constructor (
       uint256 fee_
   ) {
       fee = fee_;
   }


   /**
    * @dev The amount of currency available to be lent.
    * @param token The loan currency.
    * @return The amount of `token` that can be borrowed.
    */
   function maxFlashLoan(
       address token
   ) public view override returns (uint256) {
       return IERC20(token).balanceOf(address(this));
   }


   /**
    * @dev The fee to be charged for a given loan.
    * @param token The loan currency. Must match the address of this contract.
    * @param amount The amount of tokens lent.
    * @return The amount of `token` to be charged for the loan, on top of the returned principal.
    */
   function flashFee(
       address token,
       uint256 amount
   ) external view override returns (uint256) {
       return fee;
   }


   /**
    * @dev Loan `amount` tokens to `receiver`, and takes it back plus a `flashFee` after the ERC3156 callback.
    * @param receiver The contract receiving the tokens, needs to implement the `onFlashLoan(address user, uint256 amount, uint256 fee, bytes calldata)` interface.
    * @param token The loan currency. Must match the address of this contract.
    * @param amount The amount of tokens lent.
    * @param data A data parameter to be passed on to the `receiver` for any custom use.
    */
   function flashLoan(
       IERC3156FlashBorrower receiver,
       address token,
       uint256 amount,
       bytes calldata data
   ) external override returns (bool){
       uint256 oldAllowance = IERC20(token).allowance(address(this), address(receiver));
       uint256 oldBal = IERC20(token).balanceOf(address(this));
       require(amount <= oldBal, "Too many funds requested");
       IERC20(token).approve(address(receiver), oldAllowance + amount);

       require(
           receiver.onFlashLoan(msg.sender, token, amount, fee, data) == CALLBACK_SUCCESS,
           "Callback failed"
       );

       uint256 newBal = IERC20(token).balanceOf(address(this));
       if(newBal < oldBal + fee) {
           uint retAmt = oldBal + fee - newBal;
           require(IERC20(token).transferFrom(msg.sender, address(this), retAmt), "All funds not returned");
       }

       if (IERC20(token).allowance(address(this), address(receiver)) > oldAllowance) {
           IERC20(token).approve(address(receiver), oldAllowance);
       }

       return true;
   }
}
