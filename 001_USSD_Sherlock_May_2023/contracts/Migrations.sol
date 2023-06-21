// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

/*
  NOTE: Migrations contract implements Truffle interface for marking last completed migration,
        but also is enhanced to store (retrievable only by deployer) information map, used for
        retrieving addresses of deployed contracts for providing persistent interdependence.

        Therefore, keeping address of contract in build json for Truffle for every network is crucial
        to keep things consistent.
*/
contract Migrations {
    address public owner;
    uint public lastCompletedMigration;

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setCompleted(uint completed) public restricted {
        lastCompletedMigration = completed;
    }
}
