# AccessProtected



> Access Limiter to multiple owner-specified accounts.



*Exposes the onlyAdmin modifier, which will revert (ADMIN_ACCESS_REQUIRED) if the caller is not the owner nor the admin.*

## Methods

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



