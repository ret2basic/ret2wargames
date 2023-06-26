# VTVLVesting









## Methods

### allVestingRecipients

```solidity
function allVestingRecipients() external view returns (address[])
```

Return all the addresses that have vesting schedules attached.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined |

### claimableAmount

```solidity
function claimableAmount(address _recipient) external view returns (uint112)
```

Calculates how much can we claim, by subtracting the already withdrawn amount from the vestedAmount at this moment.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | - The address for whom we&#39;re calculating |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint112 | undefined |

### createClaim

```solidity
function createClaim(address _recipient, uint40 _startTimestamp, uint40 _endTimestamp, uint40 _cliffReleaseTimestamp, uint40 _releaseIntervalSecs, uint112 _linearVestAmount, uint112 _cliffAmount) external nonpayable
```

Create a claim based on the input parameters.

*This&#39;ll simply check the input parameters, and create the structure verbatim based on passed in parameters.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | - The address of the recipient of the schedule |
| _startTimestamp | uint40 | - The timestamp when the linear vesting starts |
| _endTimestamp | uint40 | - The timestamp when the linear vesting ends |
| _cliffReleaseTimestamp | uint40 | - The timestamp when the cliff is released (must be &lt;= _startTimestamp, or 0 if no vesting) |
| _releaseIntervalSecs | uint40 | - The release interval for the linear vesting. If this is, for example, 60, that means that the linearly vested amount gets released every 60 seconds. |
| _linearVestAmount | uint112 | - The total amount to be linearly vested between _startTimestamp and _endTimestamp |
| _cliffAmount | uint112 | - The amount released at _cliffReleaseTimestamp. Can be 0 if _cliffReleaseTimestamp is also 0. |

### createClaimsBatch

```solidity
function createClaimsBatch(address[] _recipients, uint40[] _startTimestamps, uint40[] _endTimestamps, uint40[] _cliffReleaseTimestamps, uint40[] _releaseIntervalsSecs, uint112[] _linearVestAmounts, uint112[] _cliffAmounts) external nonpayable
```

The batch version of the createClaim function. Each argument is an array, and this function simply repeatedly calls the createClaim.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipients | address[] | undefined |
| _startTimestamps | uint40[] | undefined |
| _endTimestamps | uint40[] | undefined |
| _cliffReleaseTimestamps | uint40[] | undefined |
| _releaseIntervalsSecs | uint40[] | undefined |
| _linearVestAmounts | uint112[] | undefined |
| _cliffAmounts | uint112[] | undefined |

### finalVestedAmount

```solidity
function finalVestedAmount(address _recipient) external view returns (uint112)
```

Calculate the total vested at the end of the schedule, by simply feeding in the end timestamp to the function above.

*This fn is somewhat superfluous, should probably be removed.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | - The address for whom we&#39;re calculating |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint112 | undefined |

### getClaim

```solidity
function getClaim(address _recipient) external view returns (struct VTVLVesting.Claim)
```

Basic getter for a claim. 

*Could be using public claims var, but this is cleaner in terms of naming. (getClaim(address) as opposed to claims(address)). *

#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | - the address for which we fetch the claim. |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | VTVLVesting.Claim | undefined |

### isAdmin

```solidity
function isAdmin(address _addressToCheck) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _addressToCheck | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### numTokensReservedForVesting

```solidity
function numTokensReservedForVesting() external view returns (uint112)
```

How many tokens are already allocated to vesting schedules.

*Our balance of the token must always be greater than this amount. Otherwise we risk some users not getting their shares. This gets reduced as the users are paid out or when their schedules are revoked (as it is not reserved any more). In other words, this represents the amount the contract is scheduled to pay out at some point if the  owner were to never interact with the contract.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint112 | undefined |

### numVestingRecipients

```solidity
function numVestingRecipients() external view returns (uint256)
```

Get the total number of vesting recipients.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### revokeClaim

```solidity
function revokeClaim(address _recipient) external nonpayable
```

Allow an Owner to revoke a claim that is already active.

*The requirement is that a claim exists and that it&#39;s active.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | undefined |

### setAdmin

```solidity
function setAdmin(address admin, bool isEnabled) external nonpayable
```

Set/unset Admin Access for a given address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| admin | address | - Address of the new admin (or the one to be removed) |
| isEnabled | bool | - Enable/Disable Admin Access |

### tokenAddress

```solidity
function tokenAddress() external view returns (contract IERC20)
```

Address of the token that we&#39;re vesting




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

### vestedAmount

```solidity
function vestedAmount(address _recipient, uint40 _referenceTs) external view returns (uint112)
```

Calculate the amount vested for a given _recipient at a reference timestamp.

*Simply call the _baseVestedAmount for the claim in question*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | - The address for whom we&#39;re calculating |
| _referenceTs | uint40 | - The timestamp at which we want to calculate the vested amount. |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint112 | undefined |

### withdraw

```solidity
function withdraw() external nonpayable
```

Withdraw the full claimable balance.

*hasActiveClaim throws off anyone without a claim.*


### withdrawAdmin

```solidity
function withdrawAdmin(uint112 _amountRequested) external nonpayable
```

Admin withdrawal of the unallocated tokens.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amountRequested | uint112 | - the amount that we want to withdraw |

### withdrawOtherToken

```solidity
function withdrawOtherToken(contract IERC20 _otherTokenAddress) external nonpayable
```

Withdraw a token which isn&#39;t controlled by the vesting contract.

*This contract controls/vests token at &quot;tokenAddress&quot;. However, someone might send a different token.  To make sure these don&#39;t get accidentally trapped, give admin the ability to withdraw them (to their own address). Note that the token to be withdrawn can&#39;t be the one at &quot;tokenAddress&quot;.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _otherTokenAddress | contract IERC20 | - the token which we want to withdraw |



## Events

### AdminAccessSet

```solidity
event AdminAccessSet(address indexed _admin, bool _enabled)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _admin `indexed` | address | undefined |
| _enabled  | bool | undefined |

### AdminWithdrawn

```solidity
event AdminWithdrawn(address indexed _recipient, uint112 _amountRequested)
```

Emitted when admin withdraws.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient `indexed` | address | undefined |
| _amountRequested  | uint112 | undefined |

### ClaimCreated

```solidity
event ClaimCreated(address indexed _recipient, VTVLVesting.Claim _claim)
```

Emitted when a founder adds a vesting schedule.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient `indexed` | address | undefined |
| _claim  | VTVLVesting.Claim | undefined |

### ClaimRevoked

```solidity
event ClaimRevoked(address indexed _recipient, uint112 _numTokensWithheld, uint256 revocationTimestamp, VTVLVesting.Claim _claim)
```

Emitted when a claim is revoked



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient `indexed` | address | undefined |
| _numTokensWithheld  | uint112 | undefined |
| revocationTimestamp  | uint256 | undefined |
| _claim  | VTVLVesting.Claim | undefined |

### Claimed

```solidity
event Claimed(address indexed _recipient, uint112 _withdrawalAmount)
```

Emitted when someone withdraws a vested amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient `indexed` | address | undefined |
| _withdrawalAmount  | uint112 | undefined |



