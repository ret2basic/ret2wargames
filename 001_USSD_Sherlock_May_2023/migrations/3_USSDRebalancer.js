const USSD = artifacts.require('USSD');
const USSDRebalancer = artifacts.require('USSDRebalancer');

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer, network, accounts) {
    const USSD_instance = await USSD.deployed();
    const USSDRebalancer_instance = await deployProxy(USSDRebalancer, [USSD_instance.address]);
};
