// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/// CallbackERC20 is based on Solmate's ERC20.
/// It adds the extra feature that address can register callbacks,
/// which are called when that address is a recipient or sender
/// of a transfer.
/// Addresses can also revoke callbacks.
contract CallbackERC20 {
   event Transfer(address indexed from, address indexed to, uint256 amount);

   event Approval(address indexed owner, address indexed spender, uint256 amount);

   /*//////////////////////////////////////////////////////////////
                           METADATA STORAGE
   //////////////////////////////////////////////////////////////*/

   // Optimized version vs string
   function name() external pure returns (string memory) {
       // Returns "Callback"
       assembly {
           mstore(0, 0x20)
           mstore(0x28, 0x0843616c6c6261636b)
           return(0, 0x60)
       }
   }

   // Optimized version vs string
   function symbol() external pure returns (string memory) {
       // Returns "CERC"
       assembly {
           mstore(0, 0x20)
           mstore(0x24, 0x0443455243)
           return(0, 0x60)
       }
   }

   uint8 public constant decimals = 18;

   /*//////////////////////////////////////////////////////////////
                             ERC20 STORAGE
   //////////////////////////////////////////////////////////////*/

   uint256 public totalSupply;

   mapping(address => uint256) public balanceOf;

   mapping(address => mapping(address => uint256)) public allowance;

   /*//////////////////////////////////////////////////////////////
                              CALLBACK
   //////////////////////////////////////////////////////////////*/

   mapping(address => function (address, address, uint) external) public callbacks;

   /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
   //////////////////////////////////////////////////////////////*/

   constructor() {
       // Owner starts with a little fortune they can distribute.
       _mint(msg.sender, 1_000_000);
   }

   /*//////////////////////////////////////////////////////////////
                             CALLBACK LOGIC
   //////////////////////////////////////////////////////////////*/

  function registerCallback(function (address, address, uint) external callback) external {
      callbacks[msg.sender] = callback;
  }

  function unregisterCallback() external {
      delete callbacks[msg.sender];
  }

   /*//////////////////////////////////////////////////////////////
                              ERC20 LOGIC
   //////////////////////////////////////////////////////////////*/

   function approve(address spender, uint256 amount) public virtual returns (bool) {
       allowance[msg.sender][spender] = amount;

       emit Approval(msg.sender, spender, amount);

       return true;
   }

   function transfer(address to, uint256 amount) public virtual returns (bool) {
       balanceOf[msg.sender] -= amount;

       // Cannot overflow because the sum of all user
       // balances can't exceed the max uint256 value.
       unchecked {
           balanceOf[to] += amount;
       }

       notify(msg.sender, msg.sender, to, amount);
       notify(to, msg.sender, to, amount);

       emit Transfer(msg.sender, to, amount);

       return true;
   }

   function transferFrom(
       address from,
       address to,
       uint256 amount
   ) public virtual returns (bool) {
       uint256 allowed = allowance[from][msg.sender]; // Saves gas for limited approvals.

       if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;

       balanceOf[from] -= amount;

       // Cannot overflow because the sum of all user
       // balances can't exceed the max uint256 value.
       unchecked {
           balanceOf[to] += amount;
       }

       notify(from, from, to, amount);
       notify(to, from, to, amount);

       emit Transfer(from, to, amount);

       return true;
   }

   function notify(address who, address from, address to, uint amt) internal {
       if (callbacks[who].address != address(0)) {
           callbacks[who](from, to, amt);
       }
   }

   /*//////////////////////////////////////////////////////////////
                       INTERNAL MINT/BURN LOGIC
   //////////////////////////////////////////////////////////////*/

   function _mint(address to, uint256 amount) internal virtual {
       totalSupply += amount;

       // Cannot overflow because the sum of all user
       // balances can't exceed the max uint256 value.
       unchecked {
           balanceOf[to] += amount;
       }

       emit Transfer(address(0), to, amount);
   }

   function _burn(address from, uint256 amount) internal virtual {
       balanceOf[from] -= amount;

       // Cannot underflow because a user's balance
       // will never be larger than the total supply.
       unchecked {
           totalSupply -= amount;
       }

       emit Transfer(from, address(0), amount);
   }
}
