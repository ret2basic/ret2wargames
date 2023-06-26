# VTVL contest details

- $28,500 USDC main award pot
- $1,500 USDC gas optimization award pot
- Join [C4 Discord](https://discord.gg/code4rena) to register
- Submit findings [using the C4 form](https://code4rena.com/contests/2022-09-vtvl-contest/submit)
- [Read our guidelines for more details](https://docs.code4rena.com/roles/wardens)
- Starts September 20, 2022 20:00 UTC
- Ends September 23, 2022 20:00 UTC

## VTVL Overview

VTVL is a token management platform for web3 founders.

The core function of VTVL is to allow users to generate and deploy token vesting smart contracts through our platform.

## Smart Contracts

This folder contains the vesting (and other auxiliary) smart contracts used for _vtvl_ vesting project. It is set up within a `hardhat` environment, so the usual `hardhat` tools are available.

### FullPremintERC20Token.sol (8 sloc)

A very basic, standard ERC20 token (import from @openzeppelin ERC20.sol). Used as a helper for development. VTVLVesting contract supports any ERC20 token, so any other token can be substituted for this one.

### VariableSupplyERC20Token.sol (21 sloc)

A very basic, standard ERC20 token with the ability to premint some or all of the tokens. Furthermore, it allows the user to specify a variable supply later on, if required.

### AccessProtected.sol (23 sloc)

A contract to add and govern the admin access control to the main contract.

### VTVLVesting.sol (187 sloc)

This is the main contract of the project. It controls the vesting of a given token, based on an arbitrary schedule.

When the contract is created (in the constructor), it receives the address for the relevant ERC20 token. This address cannot be changed later, i.e. a given contract can only control one token.

A vesting contract is associated to a token given at creation. It only carries out operations with respect to that token.

#### Claim

A claim is a vesting right associated to a given address. Each address can have a maximum of one claim associated to it.

A claim consists of the cliff part and the linear vesting part.

The cliff gets released all at once at a specified moment (cliffReleaseTimestamp).

Linear vesting, on the other hand, starts at startTimestamp and ends at some later date (endTimestamp). During this period, the user's allocation gradually increases as the time passes. The allocated amount can be configured to be claimable continuously (every second), or less frequently (for example, every hour, every day, etc).

Each of the parts (cliff and linear) have amounts that can be allocated to each. The founders can opt to use either or both options for each of the claims.

#### Access to the contract functions

There are three main groups that may want to interact with the contract - the administrators, vesting recipients, and everyone else.

##### The administrators

The administrators are normally the founders. They can create and revoke claims at will - however (other than revoking it), they cannot modify an existing claim. They can also withdraw the remaining amount not allocated on claims back to their wallet.

This group initially starts with just having the contract deployer as the owner/admin. They can then add (or remove) other users as administrators, relegating them the same rights.

##### Vesting recipients

If an user has a valid claim associated to their address, they have the ability to withdraw the amount that's claimable at the moment they make the claim. No one other than the designated vesting recipient (not even the admin) can withdraw on an existing claim - but the admin can revoke the claim.

##### Everyone else

Everyone else has just read access to the contract. That includes the ability to read all the vesting recipients, all claim information, as well as the information about how much will a given user vest at a certain point in time.

### Contract design notes for wardens consideration

As part of the business logic, the vesting contract is designed to provide a _trustless_ and automatic way to establish token vesting mechanism through locking tokens inside the vesting smart contract. However, due of the nature of vesting, e.g. employee token vesting, our vesting contract is deliberately designed to allow **_admin revocation_** in the circumstances of early employment termination (before the end of vesting period specified).

We understand that by allowing admins to have the ultimate power of revoking claims is a dangerous and centralised move in the design, we still think that this revocation design would match the business reality closer. We have added additional `event` (`ClaimRevoked` and `AdminWithdrawn`) as counteraction(s) to keep admin's (revocation) actions transparent and (hopefully accountable) thanks to blockchain's immutable and permissionless nature.

Therefore any potential risks or attack vectors concerning unauthorised access to admin account(s) (e.g. lost of admin's private key) <u>**will not**</u> be considered as valid risk findings.

## Development setup and testing

### Prepare the local environment:

1. install `nodejs`, refer to [nodejs](https://nodejs.org/en/)
2. install `yarn`, refer to [yarn](https://classic.yarnpkg.com/en/)
3. run `yarn install` in workspace root folder

### Compiling the contracts

The contracts can be compiled by running:

```shell
npx hardhat compile
```

This creates the appropriate artifacts.

### Running a local node

```shell
npx hardhat node
```

Spins up a local node, similar to ganache. The private keys will be shown in the command line.

### Tests

A full set of unit tests are provided in the `test` folder

Runs the tests.

```shell
npx hardhat test
```
