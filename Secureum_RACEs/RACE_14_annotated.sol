contract USDCCollateral {
    // This is a contract that's part of a larger system implementing a lending protocol
    // This particular contract concerns itself with allowing people to deposit USDC as collateral for their loans

    // A list of all the addresses lending
    address[] lenders;
    // A mapping to allow efficient is lender checks
    mapping(address => bool) isLender;

    address immutable lendingPlatform;
    address token = ERC20(USDC_ADDRESS);

    // We use a mapping to store the deposits of all lenders
    mapping (address => bool) balance;

    // USDC is very stable, so for every 1 USDC you can borrow 1 DAI or 1 USD worth of the other currency
    // Similar to other lending platforms, this lending system uses an oracle to determine how much one can borrow. 
    // The following describes how the system determines the max borrow value (ignoring precision for simplicity).
    // maxBorrow = (collateralRatio * underlying * underlyingValueUSD) / otherValueUSD 
    // This encodes the margin requirement of the system.
    uint collateralRatio = 100_000_000; 

    constructor() {
        periodicFee = 1;

        // approved collateral contracts are deployed by the lending platform
        // assume it is implemented correctly, and doesn't allow false collateral contracts.
        lendingPlatform = msg.sender;
    }

    function deposit(uint amount) external {
        require(!isLender[msg.sender]);
        isLender[msg.sender] = true;
        lenders.push(msg.sender);

        ...
    }

    function computeFee(uint periodicFee, uint balance) internal returns (uint) {
        // Assume this is a correctly implemented function that computes the share of fees that someone should receive based on their balance.
    }

    // this function is called monthly by the lending platform
    // We compute how much fees the lender should receive and send it to them
    function payFees() external onlyLendingPlatform {
        for (uint i=0; i<lenders.length; i++) {
            // Compute fee uses the balance of each lender
            uint fee = computeFee(periodicFee, balance[lenders[i]]);
            token.transferFrom(lendingPlatform, lenders[i], fee);
        }
    }
    ...
}
