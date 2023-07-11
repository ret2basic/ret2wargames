pragma solidity ^0.8.0; // using 0.8 to be safe from arithmetic risks

interface IERC20 {
    function decimals() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function totalSupply() external view returns (uint256);

    // Mint tokens
    // The access controls only allows the Bank contract to call this function
    // mint does not have callback (i.e. it does not allow reentrancies)
    // [Secureum] Assume no bug
    function mint(uint amount, address to) external;

    // Burn token
    // The access controls only allows the Bank contract to call this function
    // burn does not have callback (i.e. it does not allow reentrancies)
    // [Secureum] Assume no bug
    function burn(uint amount, address to) external;
}

// This contract allows to deposit ether and mint tokens by locking Ether, at a rate of 1 ether = 10 tokens
// The user needs to burn the token to unlock their balance
// Once they minted tokens, the user cannot mint more, unless they burned the original amount
// This contract is safe from reentrancies and front running risks
contract Bank{

    mapping(address => uint) balances;
    mapping(address => uint) minted;
    uint decimals_factor = 10**18;
    IERC20 token;

    uint8 isReenter = 1;
    modifier nonReentrant{
        require(isReenter>=1);
        isReenter = 2;
        _;
        isReenter = 1;
    }

    constructor(address token_address){
        token = IERC20(token_address);
        // Only accept tokens with 18 decimals to ease the math
        require(token.decimals() == 18);
    }

    /***
    Deposit function
    ***/

    function deposit(uint amount) internal{
        balances[msg.sender] += amount;
    }

    function deposit() payable nonReentrant public{
        deposit(msg.value);
    }

    function depositTo(address to) payable nonReentrant public{
        balances[to] = msg.value;
    }

    /***
    Getter
    ***/

    // Return the balance of the user
    function getBalances(address user) public nonReentrant returns(uint balance){
        uint balance = balances[user];
    }

    /***
    Withdraw functions
    ***/

    function withdraw(uint amount) nonReentrant public{
        // Cannot withdraw if some tokens have been minted
        require(minted[msg.sender]==0);
        msg.sender.call{value: amount}("");
        balances[msg.sender] -= amount;
    }

    function withdrawAll() nonReentrant public{
        // Cannot withdraw if some tokens have been minted
        require(minted[msg.sender]==0);
        balances[msg.sender] = 0;
        msg.sender.call{value: balances[msg.sender]}("");
    }

    /***
    Mint/burn functions
    ***/

    // Mint tokens
    // The user must have locked enough ether in the contract
    // This function only mint whole number and not fraction.
    // As a result, amount is expressed without the decimals.
    // To mint 10 tokens, call mint(10);
    // @param amount The number of tokens to be minted. amount is the whole number.
    function mint(uint amount) nonReentrant public{
        // Cannot mint if some tokens have already been minted
        require(minted[msg.sender]==0);

        _has_enough_balance(amount, balances[msg.sender]);
        minted[msg.sender] = amount * decimals_factor;
        // [Secureum] Assume token.mint has no bug and no callback
        token.mint(amount * decimals_factor, msg.sender);
    }

    /// @notice burn the token and unlock the account.
    function burn() nonReentrant public{
        // This will revert if the user does not have minted[msg.sender] tokens in its balance
        require(token.balanceOf(msg.sender) == minted[msg.sender]);
        // [Secureum] Assume token.burn has no bug and no callback
        token.burn(minted[msg.sender], msg.sender);
        minted[msg.sender] = 0;
    }

    /// @notice Ensure that enough ethers are locked. 1 ether allows to mint 10 tokens
    /// @param desired_tokens The number of tokens to buy
    /// @param balance The ether balance available
    function _has_enough_balance(uint256 desired_tokens, uint256 balance) internal view {
        uint256 required_balance = (desired_tokens / 10) * decimals_factor;
        require(balance >= required_balance);
    }
}
