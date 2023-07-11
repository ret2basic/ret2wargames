// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenV1 is ERC20, AccessControl {
    bytes32 MIGRATOR_ROLE = keccak256("MIGRATOR_ROLE");

    constructor() ERC20("Token", "TKN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Spec wasn't clear about what 'admin functions' need to be capable of.
    // Well, this should do the trick.
    fallback() external {
        if (hasRole(MIGRATOR_ROLE, msg.sender)) {
            (bool success, bytes memory data) = msg.sender.delegatecall(msg.data);
            require(success, "MIGRATION CALL FAILED");
            assembly {
                return(add(data, 32), mload(data))
            }
        }
    }
}

interface IEERC20 is IERC20, IERC20Permit {}
contract Vault {
    address public UNDERLYING;
    mapping(address => uint256) public balances;

    constructor(address token)  {
        UNDERLYING = token;
    }

    function deposit(uint256 amount) external {
        IEERC20(UNDERLYING).transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
    }

    function depositWithPermit(address target, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s, address to) external {
        IEERC20(UNDERLYING).permit(target, address(this), amount, deadline, v, r, s);
        IEERC20(UNDERLYING).transferFrom(target, address(this), amount);
        balances[to] += amount;
    }

    function withdraw(uint256 amount) external {
        IEERC20(UNDERLYING).transfer(msg.sender, amount);
        balances[msg.sender] -= amount;
    }

    function sweep(address token) external {
        require(UNDERLYING != token, "can't sweep underlying");
        IEERC20(token).transfer(msg.sender, IEERC20(token).balanceOf(address(this)));
    }
}

/* ... some time later ... */

// Adding permit() while maintaining old token balances.
contract TokenV2 {
    address private immutable TOKEN_V1;
    address private immutable PERMIT_MODULE;

    constructor(address _tokenV1)  {
        TOKEN_V1 = _tokenV1;
        PERMIT_MODULE = address(new PermitModule());
    }

    // Abusing migrations as proxy.
    fallback() external {
        (
            bool success,
            bytes memory data
        ) = (address(this) != TOKEN_V1)
          ? TOKEN_V1.call(abi.encodePacked(hex"00000000", msg.data, msg.sender))
          : PERMIT_MODULE.delegatecall(msg.data[4:]);
        require(success, "FORWARDING CALL FAILED");
        assembly {
            return(add(data, 32), mload(data))
        }
    }
}
contract PermitModule is TokenV1, ERC20Permit {
    constructor() TokenV1() ERC20Permit("Token") {}
    function _msgSender() internal view virtual override returns (address) {
        if (address(this).code.length == 0) return super._msgSender(); // normal context during construction
        return address(uint160(bytes20(msg.data[msg.data.length-20:msg.data.length])));
    }
}
