# Sherlock USSD Contest (May 2023)

## Introduction

This week we are going to practice audit the recent [Sherlock USSD contest](https://app.sherlock.xyz/audits/contests/82). You can find USSD Codebase [here](https://github.com/USSDofficial/ussd-contracts/tree/f44c726371f3152634bcf0a3e630802e39dec49c).

## Progress

- [ ] contracts/USSD.sol
- [ ] contracts/USSDRebalancer.sol
- [ ] contracts/interfaces/IStableOracle.sol
- [ ] contracts/interfaces/IStaticOracle.sol
- [ ] contracts/interfaces/IUSSDRebalancer.sol
- [ ] contracts/oracles/StableOracleDAI.sol
- [ ] contracts/oracles/StableOracleWBGL.sol
- [ ] contracts/oracles/StableOracleWBTC.sol
- [ ] contracts/oracles/StableOracleWETH.sol

## Prerequisites

Familiarize yourself with Uniswap V3 math -> will need this knowledge in `USSDRebalancer.sol`

- https://youtu.be/hKhdQl126Ys
- https://blog.uniswap.org/uniswap-v3-math-primer

Dacian has a nice article on common slippage issues -> also needed for `USSDRebalancer.sol`

https://dacian.me/defi-slippage-attacks

## USSD Overview

USSD is a stablecoin backed by a bucket of tokens as collateral. Just like other algorithmic stablecoin implementations, USSD has a rebalancing mechanism (`rebalance()`) that:

- `BuyUSSDSellCollateral()` when USSD price drops below $1.
	- This is because USSD price < $1 means there are more USSD and less collateral in the Uniswap pool, so we want to buy USSD (to reduce USSD in the pool) and sell collateral (to increase collateral in the pool).
- `SellUSSDBuyCollateral()` when USSD price exceeds $1.
	- This is the flipped version of above case.

**TODO**: explain rebalancing mechanism in detail.

## Audit Suggestion

> You can expect finishing the entire thing within 6 hours. Reserve a Saturday or Sunday to do this practice audit, maybe break that 6 hours into three 2-hour chunks.

I read the USSD whitepaper before looking at the code. The "rebalancing mechanics" part is interesting. This phase takes about 1 hour.

I started the practice audit with the oracle contracts. This is because the logic in oracle contracts are kind of independent of the USSD main contracts, so I wanted to finish this part first and then focus on `USSD.sol` and `USSDRebalancer.sol`. This phase takes around 0.5 hour.

`USSD.sol` and `USSDRebalancer.sol` took me about 3 hours to audit (I only wrote audit tags, no report). `USSD.sol` is easier than `USSDRebalancer.sol`, so start with `USSD.sol`. `USSDRebalancer.sol` is more complex whilst having more issues in it, be prepared.

**Hint:** There is a HUGE bug in the rebalancing mechanism. This bug is the essence of this practice audit. Try to find it!
