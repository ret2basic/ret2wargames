// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "../interfaces/IStableOracle.sol";

/*
    wbtc 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    chainlink btc/usd priceFeed 0xf4030086522a5beea4988f8ca5b36dbc97bee88c;
*/
contract StableOracleWBTC is IStableOracle {
    AggregatorV3Interface priceFeed;

    constructor() {
        priceFeed = AggregatorV3Interface(
            0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
        );
    }

    function getPriceUSD() external view override returns (uint256) {
        //(uint80 roundID, int256 price, uint256 startedAt, uint256 timeStamp, uint80 answeredInRound) = priceFeed.latestRoundData();
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // chainlink price data is 8 decimals for WETH/USD
        return uint256(price) * 1e10;
    }
}
