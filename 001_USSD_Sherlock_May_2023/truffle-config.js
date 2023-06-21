module.exports = {
  networks: {
    mainnet_fork: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: 1,       // Any network (default: none)
    },
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.6",
      settings: {
        optimizer: {
          enabled: false,
          runs: 200
        }
      }
    }
  },
};
