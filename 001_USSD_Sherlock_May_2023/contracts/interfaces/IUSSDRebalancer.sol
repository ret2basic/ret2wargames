// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "./IStableOracle.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

// to keep processing concise:
// - collateral struct indexes in collateral array could be swapped by admin
//   - order of collateral means the priority by which collateral is sold to force re-peg
// - pools indexes in array could be swapped by admin
//   - order of pools means the priority by which collateral is sold fo force re-peg
struct CollateralInfo {
    address token; // address of ERC20 collateral
    bool mint;  // can be used for minting
    bool redeem; // can be used for redeeming
    IStableOracle oracle; // oracle for getting the price in USD
    bytes pathbuy; // for rebalancing/swapping
    bytes pathsell; // for rebalancing/swapping
    uint256[] ratios; // target ratios for overcollateralization
}

interface IUSSDRebalancer {
    function rebalance() external;
    function getPool() external returns(address pool);
}

interface IUSSD is IERC20Upgradeable {
    function mintRebalancer(uint256 amount) external;
    function burnRebalancer(uint256 amount) external;
    function collateralList() external returns (CollateralInfo[] calldata);
    function collateralFactor() external returns(uint256);
    function UniV3SwapInput(bytes memory _path, uint256 _sellAmount) external;
}
