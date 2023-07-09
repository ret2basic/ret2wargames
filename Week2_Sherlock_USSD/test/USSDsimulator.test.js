const { expect } = require('chai');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const { time } = require('@openzeppelin/test-helpers');

const { SupportedChainId, Percent, Token, CurrencyAmount, TradeType } = require('@uniswap/sdk-core');

const { computePoolAddress, SwapQuoter, Pool, Route } = require('@uniswap/v3-sdk');
const { FeeAmount } = require('@uniswap/v3-sdk');

const { ethers } = require("ethers");

const {
    AlphaRouter,
    ChainId,
    SwapType,
  } = require('@uniswap/smart-order-router');

const USSD = artifacts.require('USSD');
const USSDRebalancer = artifacts.require('USSDRebalancer');
const SimOracle = artifacts.require('SimOracle');

contract('USSD', function (accounts) {
  beforeEach(async function () {
    this.USSD = await deployProxy(USSD, ["US Secured Dollar", "USSD"], { from: accounts[0] });
  });
 
  it('able to create pool, add collateral and rebalance itself (simulation)', async function () {
    expect((await this.USSD.totalSupply()).toString()).to.equal('10000000000'); // 10000 USSD minted

    let checkBalance = await web3.eth.getBalance(accounts[0]);
    console.log(`Eth balance on ${accounts[0]} is ${checkBalance}`)

    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const WETHABI = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}]';

    let WETHContract = new web3.eth.Contract(JSON.parse(WETHABI), WETH);
    await WETHContract.methods.deposit().send({value: web3.utils.toBN('30000000000000000000'), from: accounts[0] }, function(error, result) {
        console.log(`converted (wrapped) 20 ETH to WETH: ${result}`);
      });

    // get WETH
    await WETHContract.methods.balanceOf(accounts[0]).call(function(error, result) {
      console.log(`WETH balance of ${accounts[0]}: ${result}`);
    });

    // get DAI
    const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const DAIABI = '[{"inputs":[{"internalType":"uint256","name":"chainId_","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"guy","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":true,"inputs":[{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":true,"internalType":"address","name":"usr","type":"address"},{"indexed":true,"internalType":"bytes32","name":"arg1","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"arg2","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"LogNote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"dst","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"deny","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"move","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"holder","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"bool","name":"allowed","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"pull","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"push","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"rely","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"wards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]';
    let DAIContract = new web3.eth.Contract(JSON.parse(DAIABI), DAI);

    // https://docs.uniswap.org/sdk/v3/guides/routing
    // Note that routing is not supported for local forks, so we will use a mainnet provider even when swapping on a local fork
    let mainnetProvider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth")

    const router = new AlphaRouter({
      chainId: ChainId.MAINNET,
      provider: mainnetProvider,
    })

    const options = {
      recipient: accounts[0],
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    }
    
    const DAI_TOKEN = new Token(
      SupportedChainId.MAINNET,
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      18,
      'DAI',
      'Dai Stablecoin'
    )
    
    const WETH_TOKEN = new Token(
      SupportedChainId.MAINNET,
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      18,
      'WETH',
      'Wrapped Ether'
    )

    const route = await router.route(
      CurrencyAmount.fromRawAmount(
        WETH_TOKEN,
        '25000000000000000000'
      ),
      DAI_TOKEN,
      TradeType.EXACT_INPUT,
      options
    )
      
    console.log("Calculated route to swap WETH to DAI");

    await WETHContract.methods.approve(route.methodParameters.to, web3.utils.toBN('25000000000000000000')).send({ from: accounts[0] }, function(error, result) {
      console.log(`approved WETH to address ${route.methodParameters.to}: ${result}`);
    });

    await WETHContract.methods.balanceOf(accounts[0]).call(function(error, result) {
      console.log(`WETH balance of ${accounts[0]}: ${result}`);
    });

    await web3.eth.sendTransaction({
      to: route.methodParameters.to, // contract address
      data: route.methodParameters.calldata,
      from: accounts[0],
      gas: '1000000'
    }, function(error, hash){
      if (error != null) {
        console.log('Error', error);
      }
    });
    console.log("Swapped WETH to DAI");

    await WETHContract.methods.balanceOf(accounts[0]).call(function(error, result) {
      console.log(`WETH balance of ${accounts[0]}: ${result}`);
    });

    await DAIContract.methods.balanceOf(accounts[0]).call(function(error, result) {
      console.log(`DAI balance of ${accounts[0]}: ${result}`);
    });

    await this.USSD.grantRole.sendTransaction(web3.utils.sha3("STABLECONTROL"), accounts[0], { from: accounts[0] });

    const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
    const WBTCABI = '[{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"}],"name":"reclaimToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"claimOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"pendingOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"burner","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"}],"name":"OwnershipRenounced","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]';
    let WBTCContract = new web3.eth.Contract(JSON.parse(WBTCABI), WBTC);

    const WBGL = '0x2bA64EFB7A4Ec8983E22A49c81fa216AC33f383A';
    const WBGLABI = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINTER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PAUSER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burnFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"cap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getRoleMember","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleMemberCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"totalSupply","type":"uint256"},{"internalType":"address","name":"owner","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
    let WBGLContract = new web3.eth.Contract(JSON.parse(WBGLABI), WBGL);

    this.oracleDAI = await SimOracle.new(web3.utils.toBN('1000000000000000000'), { from: accounts[0] });
    this.oracleWBTC = await SimOracle.new(web3.utils.toBN('30000000000000000000000'), { from: accounts[0] });
    this.oracleWETH = await SimOracle.new(web3.utils.toBN('2000000000000000000000'), { from: accounts[0] });
    this.oracleWBGL = await SimOracle.new(web3.utils.toBN('300000000000000000'), { from: accounts[0] });

    path_DAI_USSD = "0x" + "6b175474e89094c44da98b954eedeac495271d0f" //DAI
      + "0001f4" // 0.05% tier (medium-risk)
      + this.USSD.address.substring(2)

    path_USSD_DAI = "0x" + this.USSD.address.substring(2)
      + "0001f4" // 0.05% tier (medium-risk)
      + "6b175474e89094c44da98b954eedeac495271d0f" //DAI

    path_DAI_USDC = "0x" + "6b175474e89094c44da98b954eedeac495271d0f" //DAI
      + "0001f4" // 0.05% tier (medium-risk)
      + "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" //USDC

    path_WETH_USDC_DAI = "0x" + "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" //WETH
      + "0001f4" // 0.05% tier (medium-risk)
      + "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" //USDC
      + "000064" // 0.01% tier (low-risk)
      + "6b175474e89094c44da98b954eedeac495271d0f" //DAI

    path_DAI_USDC_WETH = "0x" + "6b175474e89094c44da98b954eedeac495271d0f" //DAI
      + "000064" // 0.05% tier (medium-risk)
      + "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" //USDC
      + "0001f4" // 0.01% tier (low-risk)
      + "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" //WETH

    path_WBTC_WETH_USDC_DAI = "0x" + "2260fac5e5542a773aa44fbcfedf7c193bc2c599" //WBTC
      + "000bb8" // 0.3% tier 
      + "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" //WETH
      + "0001f4" // 0.05% tier (medium-risk)
      + "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" //USDC
      + "000064" // 0.01% tier (low-risk)
      + "6b175474e89094c44da98b954eedeac495271d0f" //DAI

    path_DAI_USDC_WETH_WBTC = "0x" + "6b175474e89094c44da98b954eedeac495271d0f" //DAI
      + "000064" // 0.01% tier (low-risk)
      + "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" //USDC
      + "0001f4" // 0.05% tier (medium-risk)      
      + "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" //WETH
      + "000bb8" // 0.3% tier 
      + "2260fac5e5542a773aa44fbcfedf7c193bc2c599" //WBTC
      
    path_WBGL_WETH_USDC_DAI = "0x" + "2ba64efb7a4ec8983e22a49c81fa216ac33f383a" //WBGL
      + "000064" // 0.01% tier 
      + "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" //WETH
      + "0001f4" // 0.05% tier
      + "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" //USDC
      + "000064" // 0.01% tier
      + "6b175474e89094c44da98b954eedeac495271d0f" //DAI
      
    path_DAI_USDC_WETH_WBGL = "0x" + "6b175474e89094c44da98b954eedeac495271d0f" //DAI
      + "000064" // 0.01% tier
      + "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" //USDC
      + "0001f4" // 0.05% tier      
      + "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" //WETH
      + "000064" // 0.01% tier
      + "2ba64efb7a4ec8983e22a49c81fa216ac33f383a" //WBGL

    await this.USSD.addCollateral(DAI, this.oracleDAI.address, true, true, 
      [web3.utils.toBN('250000000000000000'), web3.utils.toBN('350000000000000000'), web3.utils.toBN('1000000000000000000'), web3.utils.toBN('800000000000000000')],
      '0x', '0x', 100);
    await this.USSD.addCollateral(WETH, this.oracleWETH.address, false, false, 
      [web3.utils.toBN('2000000000000000000'), web3.utils.toBN('4000000000000000000'), web3.utils.toBN('5000000000000000000'), web3.utils.toBN('6000000000000000000')], 
      path_DAI_USDC_WETH, path_WETH_USDC_DAI, 100);
    await this.USSD.addCollateral(WBTC, this.oracleWBTC.address, false, false, 
      [web3.utils.toBN('2000000000000000000'), web3.utils.toBN('4000000000000000000'), web3.utils.toBN('5000000000000000000'), web3.utils.toBN('6000000000000000000')], 
      path_DAI_USDC_WETH_WBTC, path_WBTC_WETH_USDC_DAI, 100);
    await this.USSD.addCollateral(WBGL, this.oracleWBGL.address, false, false, 
      [web3.utils.toBN('10000000000000000000'), web3.utils.toBN('20000000000000000000'), web3.utils.toBN('50000000000000000000'), web3.utils.toBN('100000000000000000000')], 
      path_DAI_USDC_WETH_WBGL, path_WBGL_WETH_USDC_DAI, 100);
      
    // create a USSD/DAI pool in Uni V3
    const POOL_FACTORY_CONTRACT_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
    const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'

    // approve USSD
    let resapprove = await this.USSD.approve(NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS, web3.utils.toBN('10000000000'), { from: accounts[0] });
    console.log(`approved USSD to address ${NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS}: ${resapprove}`);

    // approve DAI
    await DAIContract.methods.approve(NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS, web3.utils.toBN('10000000000000000000000')).send({ from: accounts[0] }, function(error, result) {
      console.log(`approved DAI to address ${NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS}: ${result}`);
    });

    const USSD_TOKEN = new Token(
      SupportedChainId.MAINNET,
      this.USSD.address,
      6,
      'USSD',
      'US Secured Dollar'
    )

    const currentPoolAddress = computePoolAddress({
      factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
      tokenA: USSD_TOKEN,
      tokenB: DAI_TOKEN,
      fee: FeeAmount.LOW,
    })

    console.log("Computed USSD/DAI pool address: ", currentPoolAddress);

    UniV3MgrABI = '[{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH9","type":"address"},{"internalType":"address","name":"_tokenDescriptor_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Collect","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint128","name":"liquidity","type":"uint128"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"DecreaseLiquidity","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint128","name":"liquidity","type":"uint128"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"IncreaseLiquidity","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"WETH9","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"baseURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint128","name":"amount0Max","type":"uint128"},{"internalType":"uint128","name":"amount1Max","type":"uint128"}],"internalType":"struct INonfungiblePositionManager.CollectParams","name":"params","type":"tuple"}],"name":"collect","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token0","type":"address"},{"internalType":"address","name":"token1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"}],"name":"createAndInitializePoolIfNecessary","outputs":[{"internalType":"address","name":"pool","type":"address"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint128","name":"liquidity","type":"uint128"},{"internalType":"uint256","name":"amount0Min","type":"uint256"},{"internalType":"uint256","name":"amount1Min","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"internalType":"struct INonfungiblePositionManager.DecreaseLiquidityParams","name":"params","type":"tuple"}],"name":"decreaseLiquidity","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"amount0Desired","type":"uint256"},{"internalType":"uint256","name":"amount1Desired","type":"uint256"},{"internalType":"uint256","name":"amount0Min","type":"uint256"},{"internalType":"uint256","name":"amount1Min","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"internalType":"struct INonfungiblePositionManager.IncreaseLiquidityParams","name":"params","type":"tuple"}],"name":"increaseLiquidity","outputs":[{"internalType":"uint128","name":"liquidity","type":"uint128"},{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"token0","type":"address"},{"internalType":"address","name":"token1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint256","name":"amount0Desired","type":"uint256"},{"internalType":"uint256","name":"amount1Desired","type":"uint256"},{"internalType":"uint256","name":"amount0Min","type":"uint256"},{"internalType":"uint256","name":"amount1Min","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"internalType":"struct INonfungiblePositionManager.MintParams","name":"params","type":"tuple"}],"name":"mint","outputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint128","name":"liquidity","type":"uint128"},{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes[]","name":"data","type":"bytes[]"}],"name":"multicall","outputs":[{"internalType":"bytes[]","name":"results","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"positions","outputs":[{"internalType":"uint96","name":"nonce","type":"uint96"},{"internalType":"address","name":"operator","type":"address"},{"internalType":"address","name":"token0","type":"address"},{"internalType":"address","name":"token1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"liquidity","type":"uint128"},{"internalType":"uint256","name":"feeGrowthInside0LastX128","type":"uint256"},{"internalType":"uint256","name":"feeGrowthInside1LastX128","type":"uint256"},{"internalType":"uint128","name":"tokensOwed0","type":"uint128"},{"internalType":"uint128","name":"tokensOwed1","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"refundETH","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitAllowed","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitAllowedIfNecessary","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitIfNecessary","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"}],"name":"sweepToken","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount0Owed","type":"uint256"},{"internalType":"uint256","name":"amount1Owed","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"uniswapV3MintCallback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"}],"name":"unwrapWETH9","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}]';

    // uniswap address (!) of token0 must be less than address of token1
    // require(token0 < token1);
    // please refer to Uniswap V3 Book uniswapv3book.com for details on tick math, etc.
    let token0 = this.USSD.address.toLowerCase().substring(2);
    let token1 = DAI.toLowerCase().substring(2);
    let amount0 = "00000000000000000000000000000000000000000000000000000002540BE400";
    let amount1 = "00000000000000000000000000000000000000000000021E19E0C9BAB2400000";
    let minamount0 = "0000000000000000000000000000000000000000000000000000000000000000";
    let minamount1 = "0000000000000000000000000000000000000000000000000000000000000000";
    let sqrtPriceX96 = "00000000000000000000000000000000000F4240000000000000000000000000"; // 1000000000000000000 / 1000000 sqrt(y/x), price = 1e12, 1 USSD = 1 DAI
    let tickLower = "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff29280"; // tick lower
    let tickUpper = "00000000000000000000000000000000000000000000000000000000000d6d80"; // tick upper

    if (this.USSD.address.toLowerCase().substring(2) > DAI.toLowerCase().substring(2)) {
      console.log("DAI token is token 0 in pool");
      token0 = DAI.toLowerCase().substring(2);
      token1 = this.USSD.address.toLowerCase().substring(2);
      amount0 = "00000000000000000000000000000000000000000000021E19E0C9BAB2400000";
      amount1 = "00000000000000000000000000000000000000000000000000000002540BE400";
      minamount0 = "0000000000000000000000000000000000000000000000000000000000000000";
      minamount1 = "0000000000000000000000000000000000000000000000000000000000000000";
      sqrtPriceX96 = "0000000000000000000000000000000000000000000010C6F7A0B5ED8D36B4C7"; // 1000000 / 1000000000000000000 sqrt(y/x), price = 1e-12, 1 DAI = 1 USSD
      tickLower = "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff29280"; // tick lower 0.01 * 1e-12 = 0.00000000000001
      tickUpper = "00000000000000000000000000000000000000000000000000000000000d6d80"; // tick upper 100 * 1e-12 =  0.00000000100
    } else {
      console.log("USSD token is token 0 in pool");
    }

    let multiCallParams = [
      // first call
      "0x13ead562" + // encoded function signature ( createAndInitializePoolIfNecessary(address, address, uint24, uint160) )
      "000000000000000000000000" + token0 + // token1 address
      "000000000000000000000000" + token1 + // token2 address
      "00000000000000000000000000000000000000000000000000000000000001f4" + // fee
      sqrtPriceX96, // sqrtPriceX96
      // second call
      "0x88316456" + // encoded function signature ( mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) )
      "000000000000000000000000" + token0 + // token1 address
      "000000000000000000000000" + token1 + // token2 address
      "00000000000000000000000000000000000000000000000000000000000001f4" + // fee
      tickLower +
      tickUpper +
      amount0 + // amount 1 desired 10000
      amount1 + // amount 2 desired 10000
      minamount0 + // min amount 1 expected
      minamount1 + // min amount 2 expected 
      "000000000000000000000000" + accounts[0].toLowerCase().substring(2) + // deployer address 
      "000000000000000000000000000000000000000000000000000000006a380911" // deadline
    ];

    let params = web3.eth.abi.encodeParameters(['bytes[]'], [multiCallParams]);

    console.log("Pool creation tx data: 0xac9650d8" + params.substring(2));

    await time.advanceBlock();

    let txhash;
    await web3.eth.sendTransaction({
          to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS, // UniV3 contract address to create pool
          data: "0xac9650d8" + params.substring(2),
          from: accounts[0],
          gas: '7000000'
        }, function(error, hash){
          if (error != null) {
              console.log('Error', error);
          } else {
              console.log('Pool creation tx hash', hash);
              txhash = hash;
          }
        });
    
    await DAIContract.methods.balanceOf(currentPoolAddress).call(function(error, result) {
      console.log(`DAI balance of USSD/DAI POOL at ${currentPoolAddress}: ${result}`);
    });
      
    let ussdbalance2 = (await this.USSD.balanceOf(currentPoolAddress));
    console.log(`USSD balance of USSD/DAI POOL is ${ussdbalance2}`);

    let USSDaddr = this.USSD.address;
    await DAIContract.methods.transfer(USSDaddr, web3.utils.toBN('10000000000000000000000')).send({ from: accounts[0] }, function(error, result) {
      console.log(`Transferred 10000 DAI as collateral to USSD at ${USSDaddr}: ${result}`);
    });

    // two main scenarios:
    // 1. peg down recovery
    //    sell collateral (in order), DAI first, to buy USSD from pool and burn
    // 2. peg up rebalance
    //    buy collateral in equal portions appropriate for the collateralization flutter

    // approve DAI to USSD
    await DAIContract.methods.approve(USSDaddr, web3.utils.toBN('100000000000000000000000')).send({ from: accounts[0] }, function(error, result) {
      console.log(`approved DAI to USSD address ${USSDaddr}: ${result}`);
    });

    // mint USSD
    let mint = await this.USSD.mintForToken(DAI, web3.utils.toBN('10000000000000000000000'), accounts[0], { from: accounts[0] });
    console.log(`minted 10000 USSD for 10000 DAI to address ${accounts[0]}: ${mint}`);

    let ussdbalance = (await this.USSD.balanceOf(accounts[0]));
    console.log(`USSD balance of accounts[0] is ${ussdbalance}`);

    const currentPoolAddress2 = computePoolAddress({
      factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
      tokenA: USSD_TOKEN,
      tokenB: DAI_TOKEN,
      fee: FeeAmount.LOW,
    })

    console.log("Computed USSD/DAI pool address: ", currentPoolAddress2);

    const UniV3PoolABI = '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount","type":"uint128"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount0","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"amount1","type":"uint128"}],"name":"Collect","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint128","name":"amount0","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"amount1","type":"uint128"}],"name":"CollectProtocol","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"paid0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"paid1","type":"uint256"}],"name":"Flash","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"observationCardinalityNextOld","type":"uint16"},{"indexed":false,"internalType":"uint16","name":"observationCardinalityNextNew","type":"uint16"}],"name":"IncreaseObservationCardinalityNext","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"indexed":false,"internalType":"int24","name":"tick","type":"int24"}],"name":"Initialize","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount","type":"uint128"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"feeProtocol0Old","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"feeProtocol1Old","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"feeProtocol0New","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"feeProtocol1New","type":"uint8"}],"name":"SetFeeProtocol","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"int256","name":"amount0","type":"int256"},{"indexed":false,"internalType":"int256","name":"amount1","type":"int256"},{"indexed":false,"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"indexed":false,"internalType":"uint128","name":"liquidity","type":"uint128"},{"indexed":false,"internalType":"int24","name":"tick","type":"int24"}],"name":"Swap","type":"event"},{"inputs":[{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"amount","type":"uint128"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"amount0Requested","type":"uint128"},{"internalType":"uint128","name":"amount1Requested","type":"uint128"}],"name":"collect","outputs":[{"internalType":"uint128","name":"amount0","type":"uint128"},{"internalType":"uint128","name":"amount1","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint128","name":"amount0Requested","type":"uint128"},{"internalType":"uint128","name":"amount1Requested","type":"uint128"}],"name":"collectProtocol","outputs":[{"internalType":"uint128","name":"amount0","type":"uint128"},{"internalType":"uint128","name":"amount1","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"fee","outputs":[{"internalType":"uint24","name":"","type":"uint24"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeGrowthGlobal0X128","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeGrowthGlobal1X128","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"flash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"}],"name":"increaseObservationCardinalityNext","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"liquidity","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxLiquidityPerTick","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"amount","type":"uint128"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"mint","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"observations","outputs":[{"internalType":"uint32","name":"blockTimestamp","type":"uint32"},{"internalType":"int56","name":"tickCumulative","type":"int56"},{"internalType":"uint160","name":"secondsPerLiquidityCumulativeX128","type":"uint160"},{"internalType":"bool","name":"initialized","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32[]","name":"secondsAgos","type":"uint32[]"}],"name":"observe","outputs":[{"internalType":"int56[]","name":"tickCumulatives","type":"int56[]"},{"internalType":"uint160[]","name":"secondsPerLiquidityCumulativeX128s","type":"uint160[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"positions","outputs":[{"internalType":"uint128","name":"liquidity","type":"uint128"},{"internalType":"uint256","name":"feeGrowthInside0LastX128","type":"uint256"},{"internalType":"uint256","name":"feeGrowthInside1LastX128","type":"uint256"},{"internalType":"uint128","name":"tokensOwed0","type":"uint128"},{"internalType":"uint128","name":"tokensOwed1","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"protocolFees","outputs":[{"internalType":"uint128","name":"token0","type":"uint128"},{"internalType":"uint128","name":"token1","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"feeProtocol0","type":"uint8"},{"internalType":"uint8","name":"feeProtocol1","type":"uint8"}],"name":"setFeeProtocol","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"slot0","outputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"uint16","name":"observationIndex","type":"uint16"},{"internalType":"uint16","name":"observationCardinality","type":"uint16"},{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"},{"internalType":"uint8","name":"feeProtocol","type":"uint8"},{"internalType":"bool","name":"unlocked","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"}],"name":"snapshotCumulativesInside","outputs":[{"internalType":"int56","name":"tickCumulativeInside","type":"int56"},{"internalType":"uint160","name":"secondsPerLiquidityInsideX128","type":"uint160"},{"internalType":"uint32","name":"secondsInside","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"bool","name":"zeroForOne","type":"bool"},{"internalType":"int256","name":"amountSpecified","type":"int256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[{"internalType":"int256","name":"amount0","type":"int256"},{"internalType":"int256","name":"amount1","type":"int256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"int16","name":"","type":"int16"}],"name":"tickBitmap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tickSpacing","outputs":[{"internalType":"int24","name":"","type":"int24"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"int24","name":"","type":"int24"}],"name":"ticks","outputs":[{"internalType":"uint128","name":"liquidityGross","type":"uint128"},{"internalType":"int128","name":"liquidityNet","type":"int128"},{"internalType":"uint256","name":"feeGrowthOutside0X128","type":"uint256"},{"internalType":"uint256","name":"feeGrowthOutside1X128","type":"uint256"},{"internalType":"int56","name":"tickCumulativeOutside","type":"int56"},{"internalType":"uint160","name":"secondsPerLiquidityOutsideX128","type":"uint160"},{"internalType":"uint32","name":"secondsOutside","type":"uint32"},{"internalType":"bool","name":"initialized","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]';

    let PoolContract = new web3.eth.Contract(JSON.parse(UniV3PoolABI), currentPoolAddress2);

    await PoolContract.methods.token0().call({ from: accounts[0] }, function(error, result) {
      console.log(`token0 address on pool ${currentPoolAddress2}: ${result}`);
    });

    await PoolContract.methods.token1().call({ from: accounts[0] }, function(error, result) {
      console.log(`token1 address on pool ${currentPoolAddress2}: ${result}`);
    });

    let liquidity;
    await PoolContract.methods.liquidity().call({ from: accounts[0] }, function(error, result) {
      console.log(`liquidity on pool ${currentPoolAddress2}: ${result}`);
      liquidity = result;
    });

    let tick;
    let sqrtPriceX96p;
    await PoolContract.methods.slot0().call({ from: accounts[0] }, function(error, result) {
      console.log(`slot0 on pool ${currentPoolAddress2}: ${result}`);
      sqrtPriceX96p = result[0];
      tick = parseInt(result[1], 10);
      console.log(`sqrtPriceX96: ${sqrtPriceX96p}`);
      console.log(`tick: ${tick}`);
    });

    //const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    const SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';

    let approve = await this.USSD.approve(SWAP_ROUTER_ADDRESS, web3.utils.toBN('1000000000000000000'), { from: accounts[0] });
    console.log(`approved USSD to trade on UniV3 router address ${SWAP_ROUTER_ADDRESS}: ${approve}`);

    await DAIContract.methods.approve(SWAP_ROUTER_ADDRESS, web3.utils.toBN('100000000000000000000000')).send({ from: accounts[0] }, function(error, result) {
      console.log(`approved DAI to SWAP_ROUTER_ADDRESS address ${SWAP_ROUTER_ADDRESS}: ${result}`);
    });

    this.rebalancer = await deployProxy(USSDRebalancer, [this.USSD.address], { from: accounts[0] });

    await this.rebalancer.grantRole.sendTransaction(web3.utils.sha3("STABLECONTROL"), accounts[0], { from: accounts[0] });

    // add collateral and set flutter ratios for USSD
    // 14.25, 28.35, 61, 112.8 according to whitepaper
    await this.rebalancer.setFlutterRatios([web3.utils.toBN('14250000000000000000'), web3.utils.toBN('28350000000000000000'), web3.utils.toBN('61000000000000000000'), web3.utils.toBN('112800000000000000000')], { from: accounts[0] });

    await this.rebalancer.setPoolAddress(currentPoolAddress2, { from: accounts[0] });

    await this.rebalancer.setBaseAsset(DAI, { from: accounts[0] });

    let valuation = await this.rebalancer.getOwnValuation({ from: accounts[0] });
    console.log(`USSD rebalancer price valuation is: ${valuation}`);

    await this.USSD.setUniswapRouter(SWAP_ROUTER_ADDRESS);
    console.log(`Added router address ${SWAP_ROUTER_ADDRESS} to USSD contract`);

    await this.USSD.setRebalancer(this.rebalancer.address);
    console.log(`Added rebalancer address to USSD contract`);

    await this.USSD.approveToRouter(DAI);
    console.log(`Approved DAI to be traded by router from USSD contract`);

    await this.USSD.approveToRouter(this.USSD.address);
    console.log(`Approved USSD to be traded by router from USSD contract`);

    // perform simulation with random events
    for (var t = 0; t < 100; t++) {

      await time.advanceBlock();
      console.log("------------------------------------------------------------------------------");
      let blockNumber = await web3.eth.getBlockNumber();
      console.log("Block " + blockNumber);

      await DAIContract.methods.balanceOf(USSDaddr).call(function(error, result) {
        console.log(`USSD DAI collateral: ${result}`);
      });
      await WETHContract.methods.balanceOf(USSDaddr).call(function(error, result) {
        console.log(`USSD WETH collateral: ${result}`);
      });
      await WBTCContract.methods.balanceOf(USSDaddr).call(function(error, result) {
        console.log(`USSD WBTC collateral: ${result}`);
      });
      await WBGLContract.methods.balanceOf(USSDaddr).call(function(error, result) {
        console.log(`USSD WBGL collateral: ${result}`);
      });

      await DAIContract.methods.balanceOf(currentPoolAddress).call(function(error, result) {
        console.log(`DAI balance of USSD/DAI POOL at ${currentPoolAddress}: ${result}`);
      });
    
      let ussdbalance3 = (await this.USSD.balanceOf(currentPoolAddress));
      console.log(`USSD balance of USSD/DAI POOL is ${ussdbalance3}`);

      let valuation2 = await this.rebalancer.getOwnValuation({ from: accounts[0] });
      console.log(`USSD rebalancer price valuation is: ${valuation2}`);

      let collateralFactor = await this.USSD.collateralFactor({ from: accounts[0] });
      console.log(`Current USSD collateral factor: ${collateralFactor}`);

      console.log("------------------------------------------------------------------------------");
      const action = Math.floor(Math.random() * 7);

      switch(action) {
        case 0:
            priceDAI = await this.oracleDAI.getPriceUSD();
            priceDAI = priceDAI.iaddn(Math.random() * 200000 - 100000);
            console.log(`DAI price changed to ${priceDAI}`);
            await this.oracleDAI.setPriceUSD(priceDAI);
            break;
        case 1:
            priceWETH = await this.oracleWETH.getPriceUSD();
            priceWETH = priceWETH.iaddn(Math.random() * 200000 - 50000);
            console.log(`WETH price changed to ${priceWETH}`);
            await this.oracleWETH.setPriceUSD(priceWETH);
            break;
        case 2:
            priceWBTC = await this.oracleWBTC.getPriceUSD();
            priceWBTC = priceWBTC.iaddn(Math.random() * 200000 - 50000);
            console.log(`WBTC price changed to ${priceWBTC}`);
            await this.oracleWBTC.setPriceUSD(priceWBTC);
            break;
        case 3:
            priceWBGL = await this.oracleWBGL.getPriceUSD();
            priceWBGL = priceWBGL.iaddn(Math.random() * 200000 - 50000);
            console.log(`WBGL price changed to ${priceWBGL}`);
            await this.oracleWBGL.setPriceUSD(priceWBGL);
            break;
        case 4:
              // swap DAI for USSD
              console.log("User swaps 100 DAI for USSD");
              argsparam = web3.eth.abi.encodeParameter(
              {
                  "params": {
                      "path": 'bytes',
                      "recipient": 'address',
                      "amountIn": 'uint256',
                      "amountOutMin": 'uint256',
                  }
              },
              {
                  "path": path_DAI_USSD,
                  "recipient": accounts[0],
                  "amountIn": "100000000000000000000",
                  "amountOutMin": 0,
              }
            );

            await web3.eth.sendTransaction({
              to: SWAP_ROUTER_ADDRESS,
              data: "0xb858183f" + argsparam.substring(2),
              from: accounts[0],
              gas: '7000000'
            }, function(error, hash){
              if (error != null) {
                  console.log('Error', error);
              } else {
                  console.log('exactInput swap operation tx hash', hash);
                  txhash = hash;
              }
            });
            break;
        case 5:
              // swap USSD for DAI
              console.log("User swaps 100 USSD for DAI");
              argsparam = web3.eth.abi.encodeParameter(
                {
                    "params": {
                        "path": 'bytes',
                        "recipient": 'address',
                        "amountIn": 'uint256',
                        "amountOutMin": 'uint256',
                    }
                },
                {
                    "path": path_USSD_DAI,
                    "recipient": accounts[0],
                    "amountIn": "100000000",
                    "amountOutMin": 0,
                }
              );
    
              await web3.eth.sendTransaction({
                to: SWAP_ROUTER_ADDRESS,
                data: "0xb858183f" + argsparam.substring(2),
                from: accounts[0],
                gas: '7000000'
              }, function(error, hash){
                if (error != null) {
                    console.log('Error', error);
                } else {
                    console.log('exactInput swap operation tx hash', hash);
                    txhash = hash;
                }
              });
              break;
        case 6:
                console.log("Performing rebalancing");
                await this.rebalancer.rebalance();
                break;
        }
      }
  });
});
