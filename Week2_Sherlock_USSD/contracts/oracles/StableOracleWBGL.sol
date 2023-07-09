// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "./UniswapV3StaticOracle.sol";

import "../interfaces/IStableOracle.sol";
import "../interfaces/IStaticOracle.sol";

/* 
    wbgl 0x2bA64EFB7A4Ec8983E22A49c81fa216AC33f383A;
    wbgl/weth uni v3 0x982152A6C7f732Ec7C9EA998dDD9Ebde00Dfa16e
*/
contract StableOracleWBGL is IStableOracle {
    IStaticOracle staticOracleUniV3;
    IStableOracle ethOracle;

    constructor(address _WETHoracle) {
        staticOracleUniV3 = IStaticOracle(
            0x982152A6C7f732Ec7C9EA998dDD9Ebde00Dfa16e
        );
        ethOracle = IStableOracle(_WETHoracle);
    }

    function getPriceUSD() external view override returns (uint256) {
        address[] memory pools = new address[](1);
        pools[0] = 0x982152A6C7f732Ec7C9EA998dDD9Ebde00Dfa16e;
        uint256 wbglWethPrice = staticOracleUniV3
            .quoteSpecificPoolsWithTimePeriod(
                1000000000000000000, // 1 Eth
                0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, // WETH (base token)
                0x2bA64EFB7A4Ec8983E22A49c81fa216AC33f383A, // WBGL (quote token)
                pools, // WBGL/WETH pool uni v3
                600 // period
            );

        uint256 wethPriceUSD = ethOracle.getPriceUSD();

        return (wethPriceUSD * 1e18) / wbglWethPrice;
    }
}
