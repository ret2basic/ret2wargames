// TODO:
// Token Tests

// A) Constructor
//  1. When called with initialSupply_ = 0 and maxSupply_ = 0, check that it fails with INVALID_AMOUNT.
//  2. When called with initialSupply_ > 0 and maxSupply_ > 0  and initialSupply_ > maxSupply, check that it fails with INVALID_AMOUNT.
//  3. When called with initialSupply_ = 0 and maxSupply_ > 0, check that it sets maxSupply := maxSupply_
//  4. When called with initialSupply_ > 0 and maxSupply_ > 0, check that it sets maxSupply := maxSupply_ - initialSupply, and that initialSupply_ is asigned to the sender
//  5. When called with initialSupply_ > 0 and maxSupply_ = 0, check that it sets maxSupply_= 0 and assigns initialSupply to the sender

// B) Mint tests
//  6. Check mint() fails to mint to invalid address with INVALID_ADDRESS
//  7. Check mint() fails to mint amount = 0 with INVALID_AMOUNT
//  8. If mintableSupply > 0, check mint() fails with amount > mintableSupply
//  9. If mintableSupply > 0, check mint() succeeds with amount == mintableSupply and amount ~= mintableSupply / 2
// 10. If mintableSupply = 0, check mint() succeeds with 3 different non-zero amounts
// 11. Test that any successful mint adds the appropriate amount to the appropriate account
