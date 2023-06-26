/* eslint-disable prettier/prettier */
import { expect } from "chai";
import { ethers } from "hardhat";
import Chance  from "chance";
// eslint-disable-next-line node/no-missing-import
import { VTVLVesting } from "../typechain";
import { BigNumber } from "ethers";

const chance = new Chance(43153); // Make sure we have a predictable seed for repeatability

const randomAddress = async () => {
  return await ethers.Wallet.createRandom().getAddress();
}

const getLastBlockTs = async () => {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  return timestampBefore;
}


const createContractFactory = async () => await ethers.getContractFactory("VTVLVesting");
const deployVestingContract = async (tokenAddress?: string) => {
  const factory = await createContractFactory();
  // TODO: check if we need any checks that the token be valid, etc
  const contract = await factory.deploy(tokenAddress ?? await randomAddress());
  return contract;
}

const dateToTs = (date: Date|string) => ethers.BigNumber.from(Math.floor((date instanceof Date ? date : new Date(date)).getTime() / 1000));


const createPrefundedVestingContract = async (props: {tokenName: string, tokenSymbol: string, initialSupplyTokens: number}) => {
  const {
      tokenName, 
      tokenSymbol, 
      initialSupplyTokens, 
  } = props;

  // Create an example token
  const tokenContractFactory = await ethers.getContractFactory('TestERC20Token');
  // const initialSupply = ethers.utils.parseUnits(initialSupplyTokens.toString(), decimals);
  const initialSupply = BigNumber.from(initialSupplyTokens); // The contract is already multiplying by decimals
  const tokenContract = await tokenContractFactory.deploy(tokenName, tokenSymbol, initialSupply);

  // Create an example vesting contract
  const vestingContract = await deployVestingContract(tokenContract.address);
  await vestingContract.deployed();

  expect(await vestingContract.tokenAddress()).to.be.equal(tokenContract.address);

  // Fund the vesting contract - transfer everything to the vesting contract (from the user)
  await tokenContract.transfer(vestingContract.address, await tokenContract.totalSupply());

  return {tokenContract, vestingContract};
}

type VestingContractType = VTVLVesting;

describe("Contract creation", async function () {
  let tokenAddress: string;

  before(async () => {
    // TODO: check if we need any checks that the token be valid, etc
    
  });

  it("can be created with a ERC20 token address", async function () {
    tokenAddress = await randomAddress();
    const contract = await deployVestingContract(tokenAddress);
    await contract.deployed();

    expect(await contract.tokenAddress()).to.equal(tokenAddress);
  });


  it("fails if initialized without a valid ERC20 token address", async function () {
    
    // TODO: check if we need any checks that the token be valid, etc
    const zeroAddressStr = '0x' + '0'.repeat(40);

    const invalidParamsSets = [
      undefined,
      null,
      0,
      '0x0',
      '0x11',
      zeroAddressStr
    ]

    for(const invalidParam of invalidParamsSets) {
      try {
        const factory = await createContractFactory();

        // @ts-ignore - Need to ignore invalid type because initializing with an invalid type is the whole point of this test
        const contractDeploymentPromise = factory.deploy(invalidParam);


        if(invalidParam === zeroAddressStr) {
          await expect(contractDeploymentPromise).to.be.revertedWith("INVALID_ADDRESS");
        }
        else {
          try {
              await contractDeploymentPromise;
              expect(true).to.be.equal(false, `Invalid failure mode with argument ${invalidParam}.`)
          }
          catch(e) {
            // Correct failure mode
          }
        }
        // await (await contractDeploymentPromise).deployed();
        // expect.fail(null, null, `Did not fail with argument ${invalidParams}.`)
      }
      catch(e) {
        expect(true).to.be.equal(false, `Invalid failure mode with argument ${invalidParam}.`)
      }
    }
  });

  // it("fails if initialized with an EOA as token address", async function () {

  // });
  // it("fails if initialized with a contract which isn't ERC20", async function () {

  // });


  it("the deployer is the owner", async function () {
    const [owner] = await ethers.getSigners();

    const contract = await deployVestingContract();

    expect(await contract.isAdmin(owner.address)).to.equal(true);
  });

  it("not everyone is admin", async function () {
    const contract = await deployVestingContract()

    expect(await contract.isAdmin(await randomAddress())).to.equal(false);
  });

  it('allows the owner to set and unset other user as an admin', async function() {
    const [owner, otherOwner] = await ethers.getSigners();

    const contract = await deployVestingContract();

    // Initially the other owner is not admin
    expect(await contract.isAdmin(otherOwner.address)).to.equal(false);

    // They'll become one after we set them as admin
    await (await contract.setAdmin(otherOwner.address, true)).wait();
    expect(await contract.isAdmin(otherOwner.address)).to.equal(true);
    
    // And then they'll stop being one right after we unset them
    await (await contract.setAdmin(otherOwner.address, false)).wait();
    expect(await contract.isAdmin(otherOwner.address)).to.equal(false);
  });
 
  it('fails if attempting to set wrong address as an admin', async function () {
    const contract = await deployVestingContract();
    
    await expect(contract.setAdmin('0x' + '0'.repeat(40), true)).to.be.revertedWith('INVALID_ADDRESS');
  });
});


const initialSupplyTokens = 1000;

const tokenName = chance.string({length: 10});
const tokenSymbol = chance.string({length: 3}).toUpperCase();

// Some default values 
// These variables represent some reasonable values that our contract calls might actually have
// Those can be used as sensible defaults, and then, they can individually be replaced by other values in individualized tests
const startTimestamp = dateToTs('2023-02-01');
const releaseIntervalSecs = BigNumber.from(60 * 60); // 1 hour 
const endTimestamp = startTimestamp.add(releaseIntervalSecs.mul(100)); // 100 releases of releaseIntervalSecs, because endTimestamp must startimestamp + X * releaseIntervalSecs
const cliffReleaseTimestamp = dateToTs(new Date('2023-02-01'));
const linearVestAmount = ethers.utils.parseUnits('100', 18);
const cliffAmount = ethers.utils.parseUnits('10', 18);

describe("Claim creation", async function () {
  const recipientAddress = await randomAddress();
  // const defaultCreateClaimParams = [recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount ];

  it("fails on recipientAddress = 0", async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    const result = vestingContract.createClaim('0x' + '0'.repeat(40), startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
    await expect(result).to.be.revertedWith("INVALID_ADDRESS")
  });

  it("fails on startTimestamp = 0", async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    const result = vestingContract.createClaim(recipientAddress, '0', endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
    await expect(result).to.be.revertedWith("INVALID_START_TIMESTAMP");
  });

  it("fails on endTimestamp less than startTimestamp", async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});

    const startTs = dateToTs('2023-01-01')
    const endTsBeforeStartTs = startTs.sub(releaseIntervalSecs.mul(100))
    // Date in the past
    const result = vestingContract.createClaim(recipientAddress, startTs, endTsBeforeStartTs, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
    await expect(result).to.be.revertedWith("INVALID_END_TIMESTAMP");
  });

  it("fails on invalid interval length", async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    // just add some random amount not a multiple of releaseIntervalSecs and check it breaks
    const result = vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, '0', linearVestAmount, cliffAmount);
    await expect(result).to.be.revertedWith("INVALID_RELEASE_INTERVAL");
  });

  it("fails on vesting duration not a multiple of release interval", async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    // just add some random amount not a multiple of releaseIntervalSecs and check it breaks
    const result = vestingContract.createClaim(recipientAddress, startTimestamp, startTimestamp.add(240197), cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
    await expect(result).to.be.revertedWith("INVALID_INTERVAL_LENGTH");
  });

  it("fails on existing claim", async() => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    // Create a claim first, then try to create a similar one
    const tx = await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
    
    const tx2p = vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
    
    await expect(tx2p).to.be.revertedWith('CLAIM_ALREADY_EXISTS');
  });

  // Try out zeros in each or both. This fn shadows the default params with the "bad" values
  [
    [cliffReleaseTimestamp, 0], 
    [0, cliffAmount], 
  ].forEach(([cliffReleaseTimestamp, cliffAmount]) => {

    it(`fails on invalid cliff ${cliffReleaseTimestamp}-${cliffAmount}`, async () => {
      const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
      const result = vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
      await expect(result).to.be.revertedWith("INVALID_CLIFF");
    });
  });

  it(`fails on nothing vested`, async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    // We also use 0 on cliff amount
    const result = vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, 0, releaseIntervalSecs, 0, 0);
    await expect(result).to.be.revertedWith("INVALID_VESTED_AMOUNT");
  });

  it('fails on insufficient balance on initial allocation', async () => {
    const {tokenContract, vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    
    const balance = await tokenContract.balanceOf(vestingContract.address);
    const amountExceedingBalance = balance.add(1);

    // Linear vest 1 more than what's available, should fail
    const resultLinVest = vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, 0, releaseIntervalSecs, amountExceedingBalance, 0);
    await expect(resultLinVest).to.be.revertedWith("INSUFFICIENT_BALANCE");  // `Not failing on insufficient balance when using 0 as cliffAmount and ${amountExceedingBalance} as linearVestAmount`);

    // Cliff vest 1 more than  what's available, should fail
    const resultCliffVest = vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, 0, amountExceedingBalance);
    await expect(resultCliffVest).to.be.revertedWith("INSUFFICIENT_BALANCE") //  `Not failing on insufficient balance when using ${amountExceedingBalance} as cliffAmount and 0 as linearVestAmount`);

    const resultBothVest = vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, amountExceedingBalance, amountExceedingBalance);
    await expect(resultBothVest).to.be.revertedWith("INSUFFICIENT_BALANCE");// , `Not failing on insufficient balance when using ${amountExceedingBalance} as cliffAmount and ${amountExceedingBalance} as linearVestAmount`);
  });

  it('fails on insufficient balance after multiple allocations', async () => {
    const {tokenContract, vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    const balance = await tokenContract.balanceOf(vestingContract.address);

    // Try wiht an amount that should succeed twice, but not three times
    const amt = balance.mul(3).div(8);

    await vestingContract.createClaim(await randomAddress(), startTimestamp, endTimestamp, 0, releaseIntervalSecs, amt, 0);
    await vestingContract.createClaim(await randomAddress(), startTimestamp, endTimestamp, 0, releaseIntervalSecs, amt, 0);
    const result = vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, 0, releaseIntervalSecs, amt, 0);

    await expect(result).to.be.revertedWith("INSUFFICIENT_BALANCE");// `Not failing on insufficient balance after the third claim`);
  });

  [
    [0, 1],
    [linearVestAmount, 0],
    [0, cliffAmount],
    [linearVestAmount, cliffAmount],
  ].forEach(([linearVestAmount, cliffAmount]) => {
    it(`allocates correct amount (linear: ${linearVestAmount}, cliff: ${cliffAmount})`, async() => {
      const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
      const expectedAllocation = BigNumber.from(linearVestAmount).add(BigNumber.from(cliffAmount));
      
      // 0 before the allocation
      expect(await vestingContract.numTokensReservedForVesting()).to.be.equal(0);

      await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffAmount ? cliffReleaseTimestamp : 0, releaseIntervalSecs, linearVestAmount, cliffAmount);
      
      // Allocate it once, expect it to come up to expectedAllocation
      expect(await vestingContract.numTokensReservedForVesting()).to.be.equal(expectedAllocation, "Incorrect amount allocated after the first allocation");
      
      // One more time, up to double allocation
      vestingContract.createClaim(await randomAddress(), startTimestamp, endTimestamp, cliffAmount ? cliffReleaseTimestamp : 0, releaseIntervalSecs, linearVestAmount, cliffAmount);
      expect(await vestingContract.numTokensReservedForVesting()).to.be.equal(expectedAllocation.mul(2));
    });
  })

  it("sets the claim", async() => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});

    const returnedClaimBeforeSet = await vestingContract.getClaim(recipientAddress);
    const nonZeroItemsInReturnedClaim = returnedClaimBeforeSet.filter(x=> !!x && x.toString() !== "0");
    expect(nonZeroItemsInReturnedClaim.length).to.be.equal(0, "Claim nonzero even before setting it.")

    await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

    const returnedClaimInfo = await vestingContract.getClaim(recipientAddress);
    // Last two fields are amountWithdrawn and active
    
    Object.entries({startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount, amountWithdrawn: 0, isActive: true}).map(([k, v]) => {
        // @ts-ignore
        const returnedValue = returnedClaimInfo?.[k];
        expect(returnedValue).to.be.equal(v, `New claim not properly set. Error on ${k}. Received ${returnedValue}, expected ${v}.`);
    })

  });

  it("sets the vesting recipient", async() => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});

    expect(await vestingContract.numVestingRecipients()).to.be.equal(0, "numVestingRecipients initially nonzero");
    expect((await vestingContract.allVestingRecipients()).length).to.be.equal(0, "vestingRecipients initially nonempty");

    await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

    expect(await vestingContract.numVestingRecipients()).to.be.equal(1, "numVestingRecipients not 1 after addition");
    const returnedVestingRecipientsAfterAssignment = await vestingContract.allVestingRecipients();
    expect(returnedVestingRecipientsAfterAssignment.length).to.be.equal(1, "vestingRecipients length not equal to 1 after addition.");
    expect(returnedVestingRecipientsAfterAssignment[0]).to.be.equal(recipientAddress, "vestingRecipients not equal to the [recipientAddress] after addition.");
  });

  it("emits ClaimCreated", async() => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    const tx = await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

    const returnedClaimInfo = await vestingContract.getClaim(recipientAddress);
    expect(tx).to.emit(vestingContract, "ClaimCreated").withArgs(recipientAddress, returnedClaimInfo);
  });
});

describe("Claim creation batch", async function () {
  const nonAddrParams = [startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount]

  const paramset1 = [await randomAddress(), ...nonAddrParams];
    // Just add some random values 
  const paramset2 = [await randomAddress(), startTimestamp, endTimestamp.add(releaseIntervalSecs),        cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount.add(2000), cliffAmount];
  const paramset3 = [await randomAddress(), startTimestamp, endTimestamp.add(releaseIntervalSecs.mul(3)), cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount,           cliffAmount.add(2000)];
  
  const paramSets = [
    [paramset1],
    [paramset2, paramset1],
    [paramset1, paramset2, paramset3],
  ];

    const paramSetToGroups = (paramSet: (string | BigNumber)[][]) => {
      const paramGroups = paramSet[0].map(x => [x]);
      for(let i = 1; i < paramSet.length; i++) {
        for(let j = 0; j < paramGroups.length; j++) {
          paramGroups[j].push(paramSet[i][j]);
        }
      }
      return paramGroups;
  }
  
  it('delegates the call to createClaim properly', async () => {
    await Promise.all(paramSets.map(async paramSet => {
      const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
      
      // @ts-ignore
      return await vestingContract.createClaimsBatch.apply(this, paramSetToGroups(paramSet));

      // Waffle's calledOnContractWith is not supported by Hardhat
      // await Promise.all(paramSet.map(async params => {
      //   return expect('createClaim').to.be.calledOnContractWith(vestingContract, params);
      // }));
    }))
  });
  it('fails when called with invalid param length', async () => {
      const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
      // Try with removing each of the arguments -- should fail every time
      for(let j = 0; j < paramset3.length; j++) {
        const paramGroups = paramSetToGroups(paramSets[2])
        paramGroups[j].pop();
      
        // @ts-ignore
        const result = vestingContract.createClaimsBatch.apply(this, paramGroups);
        await expect(result).to.be.revertedWith('ARRAY_LENGTH_MISMATCH');
      }
  });
});


describe('Withdraw', async () => {
  // const recipientAddress = await randomAddress();
  const [owner, owner2] = await ethers.getSigners();

  it('allows withdrawal up to the allowance and fails after the allowance is spent', async () => {
    const {tokenContract, vestingContract: claimCreateContractInstance} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});

    // Cliff of 100 vests at the last block TS, and then 1000 linearly vests starting at the timestamp of the last block every 10 secs
    const startTimestamp = await getLastBlockTs() + 100;
    const endTimestamp = startTimestamp + 100;
    const cliffReleaseTimestamp = startTimestamp;
    const releaseIntervalSecs = 10;
    const linearVestAmount = 1000;
    const cliffAmount = 100;

    const recipientAddress = owner2.address;

    const initialBalance = await tokenContract.balanceOf(recipientAddress);
    
    await claimCreateContractInstance.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

    await ethers.provider.send("evm_mine", [startTimestamp - 50]); // Make sure we're before the claim start

    // Now switch to owner2 as the withdrawer - to make sure admin properry of owner1 doesn't create problems
    const vestingContract = claimCreateContractInstance.connect(owner2);

    // At this moment, we don't have anything to withdraw - this should fail
    await expect(vestingContract.withdraw()).to.be.revertedWith("NOTHING_TO_WITHDRAW");

    // await ethers.provider.send("evm_setNextBlockTimestamp", [1000])
    await ethers.provider.send("evm_mine", [startTimestamp + 15]); // by now, we should've vested the cliff and one unlock interval

    (await vestingContract.withdraw()).wait();
    const balanceAfterFirstWithdraw = await tokenContract.balanceOf(recipientAddress);

    // The cliff has vested plus 10% of the linear vest amount
    expect(balanceAfterFirstWithdraw).to.be.equal(initialBalance.add(cliffAmount + linearVestAmount * 0.1));

    await ethers.provider.send("evm_mine", [startTimestamp + 17]); // Fast forward until the moment nothign further has vested
    
    // Now we don't have anything to withdraw again - as we've withdrawn just before the last vest
    await expect(vestingContract.withdraw()).to.be.revertedWith("NOTHING_TO_WITHDRAW");

    await ethers.provider.send("evm_mine", [startTimestamp + 25]); // mine another one
    await (await vestingContract.withdraw()).wait();
    const balanceAfterSecondWithdraw = await tokenContract.balanceOf(recipientAddress);

    // Expect to have 10% more after the last withdraw
    expect(balanceAfterSecondWithdraw).to.be.equal(balanceAfterFirstWithdraw.add(linearVestAmount * 0.1));
  });

  it("disallows withdrawal for an user without a claim", async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    const releaseIntervalSecs = 1;
    // We've created a claim for a random address (not for our user)
    // But we'll try to withdraw from our address, whcih should fail as we have no claim
    await vestingContract.createClaim(await randomAddress(), startTimestamp, endTimestamp, 0, releaseIntervalSecs, linearVestAmount, 0);
    await expect(vestingContract.connect(owner2).withdraw()).to.be.revertedWith("NO_ACTIVE_CLAIM");
  });

  it("disallows withdrawal for an user with consumed claim", async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    const releaseIntervalSecs = 1;
    // 100 end tiestamp is way in the past
    await vestingContract.createClaim(owner2.address, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

    // Fast forward until past the end of the interval
    await ethers.provider.send("evm_mine", [endTimestamp.toNumber() + 500]);

    // Withdraw once - ok, second time - we're out of balance
    await (await vestingContract.connect(owner2).withdraw()).wait();
    await expect(vestingContract.connect(owner2).withdraw()).to.be.revertedWith("NOTHING_TO_WITHDRAW");
  });

  it("disallows withdrawal for an user with revoked claim", async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    
    // Create a claim, and then revoke it
    const startTimestamp = await getLastBlockTs();
    const endTimestamp = startTimestamp + 1000;
    const releaseIntervalSecs = 1;

    // Create and immediately revoke a claim for owner2
    await vestingContract.createClaim(owner2.address, startTimestamp, endTimestamp, 0, releaseIntervalSecs, linearVestAmount, 0);
    
    // Fast forward until the middle of the interval - we should be vested by now (if it weren't for the revocation)
    await ethers.provider.send("evm_mine", [startTimestamp + 500]);
  
    // Revoke the claim, and try to withdraw afterwards
    await (await vestingContract.revokeClaim(owner2.address)).wait();

    await expect(vestingContract.connect(owner2).withdraw()).to.be.revertedWith("NO_ACTIVE_CLAIM");
  });
});

describe('Revoke Claim', async () => {
  const recipientAddress = await randomAddress();
  const [owner, owner2] = await ethers.getSigners();

  it('allows admin to revoke a valid claim', async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

    (await vestingContract.revokeClaim(recipientAddress)).wait();

    // Make sure it gets reverted
    expect(await (await vestingContract.getClaim(recipientAddress)).isActive).to.be.equal(false);
  });

  it('prohibits a random user from revoking a valid claim', async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

    // A random user cant revert it
    await expect(vestingContract.connect(owner2).revokeClaim(recipientAddress)).to.be.revertedWith('ADMIN_ACCESS_REQUIRED');

    // Make sure it stays active
    expect(await (await vestingContract.getClaim(recipientAddress)).isActive).to.be.equal(true);
  });
  
  it('fails to revoke an invalid claim', async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    await expect(vestingContract.revokeClaim(await randomAddress())).to.be.revertedWith('NO_ACTIVE_CLAIM');
  });

  it('fails to revoke an already withdrawn claim', async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});

    const startTimestamp = await getLastBlockTs() + 100;
    const endTimestamp = startTimestamp + 2000;
    const releaseIntervalSecs = 100;

    // Create a claim for owner2, fast forward to the end, and withdraw
    await vestingContract.createClaim(owner2.address, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
    await ethers.provider.send("evm_mine", [endTimestamp]);
    
    await (await vestingContract.connect(owner2).withdraw()).wait();
    
    // Later on, the claim should be unrevokable due to no unvested amount
    await expect(vestingContract.revokeClaim(owner2.address)).to.be.revertedWith('NO_UNVESTED_AMOUNT');
  });

  // This could also belong in vested amount section
  it('takes revocation into account while calculating the vested amount', async () => {
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    // Create and immediately revoke the claim
    await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
    await (await vestingContract.revokeClaim(recipientAddress)).wait();

    // Having immediately revoked, we expect the vested amount to be 0
    expect(await vestingContract.finalVestedAmount(recipientAddress)).to.be.equal(0);
  });

  // Tested within Withdraw section
  // it("makes sure that an otherwise valid claim couldn't be withdrawn after revocation", async () => {
    
  // });
});

describe('Vested amount', async () => {
    let vestingContract: VestingContractType;
    // Default params
    // linearly Vest 10000, every 1s, between TS 1000 and 2000
    // additionally, cliff vests another 5000, at TS = 900
    const recipientAddress = await randomAddress();
    const startTimestamp = BigNumber.from(1000);
    const endTimestamp = BigNumber.from(2000);
    const cliffReleaseTimestamp = BigNumber.from(900);
    const linearVestAmount = BigNumber.from(10000);
    const cliffAmount = BigNumber.from(5000);
    const releaseIntervalSecs = BigNumber.from(1);

    before(async () => {
      const {vestingContract: _vc} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
      vestingContract = _vc;
      await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);
    });

    it('calculates the vested amount before the cliff time to be 0', async() => {
        expect(await vestingContract.vestedAmount(recipientAddress, cliffReleaseTimestamp.sub(1))).to.be.equal(0);
    });

    it('calculates the vested amount at the cliff time to be equal cliff amount', async() => {
      // Note: at exactly the cliff time, linear vested amount won't yet come in play as we're only at second 0
      expect(await vestingContract.vestedAmount(recipientAddress, cliffReleaseTimestamp)).to.be.equal(cliffAmount);
    });


    it('correctly calculates the vested amount after the cliff time, but before the linear start time', async() => {
      expect(await vestingContract.vestedAmount(recipientAddress, cliffReleaseTimestamp.add(1))).to.be.equal(cliffAmount);
      expect(await vestingContract.vestedAmount(recipientAddress, startTimestamp.sub(1))).to.be.equal(cliffAmount);
    });

    it('vests correctly if cliff and linear vesting begin are at the same time', async() => {
      const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
      // Release the cliff at start timestamp
      const cliffReleaseTimestamp = startTimestamp;
      const endTimestamp = startTimestamp.add(1000);
      const linearVestAmount = 1000;
      const cliffAmount = 200;
      await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

      // at the start (shared start and cliff TS), we've vested exactly the cliff amount
      expect(await vestingContract.vestedAmount(recipientAddress, startTimestamp)).to.be.equal(cliffAmount);
      // Half the interval past, we've vested the cliff and half the linear amount
      expect(await vestingContract.vestedAmount(recipientAddress, startTimestamp.add(500))).to.be.equal(cliffAmount + linearVestAmount * 0.5);
    })

    it('correctly calculates the vested amount at the linear start time', async() => {
      // We've just released the cliff at the first second
      expect(await vestingContract.vestedAmount(recipientAddress, startTimestamp)).to.be.equal(cliffAmount);
    });

    it('correctly calculates the vested amount after the start', async() => {
      // We've just released the cliff at the first second
      const vestAmt = await vestingContract.vestedAmount(recipientAddress, startTimestamp.add(1));
      
      // 10% vested, ie 10 out of 10000, so add that to the cliff amound
      expect(vestAmt).to.be.equal(cliffAmount.add(10));
    });

    [10, 25, 45, 50, 70, 80, 95].forEach(percentage => {
      it(`correctly calculates the vested amount at ${percentage} of linear interval`, async() => {
        // Due to how our vesting is set up (length 1000, amount 10000), every 10*x a release of 100x should happen
        const vestAmt = await vestingContract.vestedAmount(recipientAddress, startTimestamp.add(percentage * 10));
        const expectedVestAmt = cliffAmount.add(percentage * 100);
        expect(vestAmt).to.be.equal(expectedVestAmt);
      });
    })

    it('calculates the vested amount at the end of the linear interval to be the full amount allocated', async() => {
      // The full amount vested at the end
      expect(await vestingContract.vestedAmount(recipientAddress, endTimestamp)).to.be.equal(cliffAmount.add(linearVestAmount));
    });
    
    it("doesn't vest further after the end of the linear interval", async() => {
      // Again the full amount even if we go a long way in the future
      expect(await vestingContract.vestedAmount(recipientAddress, endTimestamp.add(100000000))).to.be.equal(cliffAmount.add(linearVestAmount));
    });

    it('calculates the finalVestedAmount to be equal the total amount to be vested', async() => {
      expect(await vestingContract.finalVestedAmount(recipientAddress)).to.be.equal(cliffAmount.add(linearVestAmount));
    });

    it('takes the release interval into account', async () => {
      const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
      // with a release of 500, we should have cliff amount at start timestamp, cliffamount + 0.5 * linearvest at 1500, and full amonunt at 2000
      const releaseIntervalSecs = 500;
      await vestingContract.createClaim(recipientAddress, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

      const vestedAtStart = await vestingContract.vestedAmount(recipientAddress, startTimestamp);

      expect(vestedAtStart).to.be.equal(cliffAmount);
      // Just before the release interval gets triggered, we should still get just the cliff ts
      expect(await vestingContract.vestedAmount(recipientAddress, startTimestamp.add(releaseIntervalSecs).sub(1))).to.be.equal(cliffAmount);
      // at the release interval (release interval + 1 added, expect half of the linear vested amt)
      expect(await vestingContract.vestedAmount(recipientAddress, startTimestamp.add(releaseIntervalSecs))).to.be.equal(cliffAmount.add(linearVestAmount.div(2)));
      // Expect everything at the end
      expect(await vestingContract.vestedAmount(recipientAddress, endTimestamp)).to.be.equal(cliffAmount.add(linearVestAmount));
    });
});
  
describe('Claimable amount', async () => {
  const [owner, owner2] = await ethers.getSigners();
  // Default params - a bit different than those above
  // linearly Vest 10000, every 1s, between last block ts+100 and 1000 secs forward
  // No cliff
  
  const cliffReleaseTimestamp = BigNumber.from(0);
  const linearVestAmount = BigNumber.from(10000);
  const cliffAmount = BigNumber.from(0);
  const releaseIntervalSecs = BigNumber.from(1);

  it(`calculates the claimable amount to be equal to the vested amount if we have no withdrawals`, async () => {
    const startTimestamp = await getLastBlockTs() + 100;
    const endTimestamp = startTimestamp + 1000;
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    await vestingContract.createClaim(owner2.address, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

    // Try couple of different points, no matter where we are, it should be the same since we have no withdrawals
    for(let ts = startTimestamp; ts <= endTimestamp; ts += 100) {
        await ethers.provider.send("evm_mine", [ts]); // Make sure we're at the relevant ts
        const vestAmt = await vestingContract.vestedAmount(owner2.address, ts);
        const claimableAmount = await vestingContract.claimableAmount(owner2.address);
        expect(claimableAmount).to.be.equal(vestAmt);
    }
  })

  it('takes withdrawals into account when calculating the claimable amount', async () => {
    const startTimestamp = await getLastBlockTs() + 100;
    const endTimestamp = startTimestamp + 1000;
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    await vestingContract.createClaim(owner2.address, startTimestamp, endTimestamp, cliffReleaseTimestamp, releaseIntervalSecs, linearVestAmount, cliffAmount);

      const ts = startTimestamp + 500;
      await ethers.provider.send("evm_mine", [ts]); // Make sure we're at half of the interval

      // const amtFirstWithdraw = vestingContract.vestedAmount(owner2.address, ts);
      // second owner withdraws
      const tx = await vestingContract.connect(owner2).withdraw();
      // TODO: fetch the withdraw amount in a better way
      const amtFirstWithdraw = (await tx.wait()).events?.[1]?.args?._withdrawalAmount;

      // Nothing should be claimable
      expect(await vestingContract.claimableAmount(owner2.address)).to.be.equal(0);

      // now wait a bit till the end of the interval for everything to get vested
      await ethers.provider.send("evm_mine", [endTimestamp]);

      // we expect the claimble be less than vested for the amt withdrawn
      const vestAmtEnd = await vestingContract.finalVestedAmount(owner2.address);
      const expectedClaimable = vestAmtEnd.sub(amtFirstWithdraw);

      expect(await vestingContract.claimableAmount(owner2.address)).to.be.equal(expectedClaimable);
  });
})

describe('Admin withdrawal', async () => {
  it('allows the admin to withdraw the allocated amount', async () => {
    const [owner] = await ethers.getSigners();

    const {tokenContract, vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});

    const initialBalance = await tokenContract.balanceOf(vestingContract.address);

    const firstWithdrawalAmt = 100;
    // First withdrawal - we try to take 100, we should be good
    await (await vestingContract.withdrawAdmin(firstWithdrawalAmt)).wait();

    expect(await tokenContract.balanceOf(owner.address)).to.be.equal(firstWithdrawalAmt);
    
    const remainingBalance = await tokenContract.balanceOf(vestingContract.address);
    
    // We should be good to withdraw what's left
    await (await vestingContract.withdrawAdmin(remainingBalance)).wait();
    
    // We should've withdrawn everything
    expect(await tokenContract.balanceOf(owner.address)).to.be.equal(initialBalance);
    
    // now try that again. it should fail
    await expect(vestingContract.withdrawAdmin(remainingBalance)).to.be.revertedWith('INSUFFICIENT_BALANCE');
  });
  it('reverts on attempt to withdraw more than available', async () => {
    const {tokenContract, vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    const initialBalance = await tokenContract.balanceOf(vestingContract.address);

    await expect(vestingContract.withdrawAdmin(initialBalance.add(1))).to.be.revertedWith('INSUFFICIENT_BALANCE');
  });
  it("doesn't allow random user to admin withdraw", async () => {
    const [owner, otherUser] = await ethers.getSigners();
    const {vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    await expect(vestingContract.connect(otherUser).withdrawAdmin(1)).to.be.revertedWith('ADMIN_ACCESS_REQUIRED');
  });
});

describe('Other token admin withdrawal', async () => {
  // Enough to just use one token for all tests - since we'll create a new vesting contract for each of the tests
  // @ts-ignore It'll otherwise complain it's undefined
  const otherTokenAmount = 10000;

  const createOtherToken = async (vestingContractAddress: string | null) => {
    const [owner, otherUser] = await ethers.getSigners();
    const tokenContractFactory = await ethers.getContractFactory('TestERC20Token');
    const otherTokenContract = await tokenContractFactory.connect(otherUser).deploy(tokenName, tokenSymbol, otherTokenAmount);

    // Fill if if address has been sent
    if(vestingContractAddress) { 
      const transferTx = await otherTokenContract.transfer(vestingContractAddress, otherTokenAmount);

    }
    return otherTokenContract;
  }
  
  it('allows the admin to withdraw the other token, if present', async () => {
    const [owner, otherUser] = await ethers.getSigners();
    const {tokenContract, vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    const otherTokenContract = await createOtherToken(vestingContract.address);

    const myBalanceBefore = await otherTokenContract.balanceOf(owner.address);
    expect(myBalanceBefore).to.be.equal(0);
    
    await vestingContract.withdrawOtherToken(otherTokenContract.address);
    
    const myBalance = await otherTokenContract.balanceOf(owner.address);
    expect(myBalance).to.be.equal(otherTokenAmount, `We didn't get the full amount of tokens (${otherTokenAmount})`);
  });
  it('fails on other token withdraw, if token with zero balance', async () => {
    const [owner] = await ethers.getSigners();
    const {tokenContract, vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});

    // We create the otken, but didn't send anything to the vesting contract
    const otherTokenContract = await createOtherToken(null);

    expect(vestingContract.withdrawOtherToken(otherTokenContract.address)).to.be.revertedWith("INSUFFICIENT_BALANCE");
  });
  it('fails if called with the main token', async () => {
    const {tokenContract, vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    expect(vestingContract.withdrawOtherToken(tokenContract.address)).to.be.revertedWith("INVALID_TOKEN");
  });
  it('disallows a non-admin user to withdraw the other token', async () => {
    const [owner, secondOwner, thirdOwner] = await ethers.getSigners();
    const {tokenContract, vestingContract} = await createPrefundedVestingContract({tokenName, tokenSymbol, initialSupplyTokens});
    const otherTokenContract = await createOtherToken(vestingContract.address);

    expect(vestingContract.connect(thirdOwner).withdrawOtherToken(otherTokenContract.address)).to.be.revertedWith("ADMIN_ACCESS_REQUIRED");
  });
});