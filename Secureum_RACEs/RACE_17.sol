pragma solidity 0.8.19;


import {Pausable} from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/Pausable.sol";
import {IERC20} from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/utils/SafeERC20.sol";


interface IWETH is IERC20 {
   function deposit() external payable;
   function withdraw(uint256) external;
}


contract Vault is Pausable {
   using SafeERC20 for IWETH;


   address public immutable controller;
   IWETH public immutable WETH;


   // about 4700 ETH
   uint72 public constant TOTAL_CONTRIBUTION_CAP = type(uint72).max;
   // ALLOWANCE_CAP = 40% of TOTAL_CONTRIBUTION_CAP
   uint256 public immutable ALLOWANCE_CAP = 40 * uint256(TOTAL_CONTRIBUTION_CAP) / 100;
   uint72 public totalContributions;
   mapping (address => uint72) individualContributions;


   uint256 numContributors;
   event ContributorsUpdated(address newContributor, uint256 indexed oldNumContributors, uint256 indexed newNumContributors);


   constructor(address _controller, IWETH _weth) {
       controller = _controller;
       WETH = _weth;
   }


   function deposit(uint72 amount) external payable whenNotPaused {
       if (msg.value > 0) {
           WETH.deposit{value: amount}();
       } else {
           WETH.transferFrom(msg.sender, address(this), amount);
       }
       require((totalContributions += amount) <= TOTAL_CONTRIBUTION_CAP, "cap exceeded");
       if (individualContributions[msg.sender] == 0) emit ContributorsUpdated(msg.sender, numContributors, numContributors++);
       individualContributions[msg.sender] += amount;
   }


   function withdraw(uint72 amount) external whenNotPaused {
       individualContributions[msg.sender] -= amount;
       totalContributions -= amount;
       // unwrap and call
       WETH.withdraw(amount);
       (bool success, ) = payable(address(msg.sender)).call{value: amount}("");
       require(success, "failed to transfer ETH");
   }


   function requestAllowance(uint256 amount) external {
       // ALLOWANCE_CAP is 40% of TOTAL_CAP
       uint256 allowanceCap = ALLOWANCE_CAP;
       uint256 allowance = amount > totalContributions ? allowanceCap : amount;
       WETH.safeApprove(controller, allowance);
   }


   // for unwrapping WETH -> ETH
   receive() external payable {
       require(msg.sender == address(WETH), "only WETH contract");
   }
}
