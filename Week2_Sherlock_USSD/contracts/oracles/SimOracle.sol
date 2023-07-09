// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "../interfaces/IStableOracle.sol";

/// @notice oracle for simulation/test with direct price setting
contract SimOracle is IStableOracle {

    uint256 public price;

    constructor(uint256 _price) {
        price = _price;
    }

    function getPriceUSD() override external view returns (uint256) {
        return price;
    }

    function setPriceUSD(uint256 _price) public {
        price = _price;
    }
}
