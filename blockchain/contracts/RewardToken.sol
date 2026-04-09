// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardToken is ERC20, Ownable {

    constructor() ERC20("Local Reward Token", "LRT") Ownable(msg.sender) {}

    // mint rewards to user
    function rewardUser(address user, uint256 amount) public onlyOwner {
        _mint(user, amount);
    }
}