const USSD = artifacts.require('USSD');

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer, network, accounts) {
    const USSD_instance = await deployProxy(USSD, ["US Secured Dollar", "USSD"]);
};
