
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IRewardToken {
    function rewardUser(address user, uint256 amount) external;
}

contract Investment is Ownable {

    struct Business {
        string name;
        uint fundingGoal;
        uint totalFunds;
    }

    uint public businessCount;
    uint256 public rewardAmount = 10 ether;
    uint256 public constant maxRewardedInvestments = 5;
    address public rewardToken;

    mapping(uint => Business) public businesses;

    
    mapping(uint => mapping(address => uint)) public investments;
    mapping(address => uint256) public rewardedInvestments;

    event BusinessCreated(uint256 indexed businessId, string name, uint256 fundingGoal);
    event Invested(uint256 indexed businessId, address indexed investor, uint256 amount);
    event RewardIssued(uint256 indexed businessId, address indexed investor, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    function setRewardToken(address _rewardToken) external onlyOwner {
        require(_rewardToken != address(0), "Invalid reward token");
        rewardToken = _rewardToken;
    }

    function setRewardAmount(uint256 _rewardAmount) external onlyOwner {
        rewardAmount = _rewardAmount;
    }

    function createBusiness(string memory _name, uint _goal) public {
        businessCount++;

        businesses[businessCount] = Business({
            name: _name,
            fundingGoal: _goal,
            totalFunds: 0
        });

        emit BusinessCreated(businessCount, _name, _goal);
    }

    
    function invest(uint businessId) public payable {
        require(msg.value > 0, "Send some ETH");
        require(businessId > 0 && businessId <= businessCount, "Invalid business");

        businesses[businessId].totalFunds += msg.value;
        investments[businessId][msg.sender] += msg.value;
        emit Invested(businessId, msg.sender, msg.value);

        if (rewardedInvestments[msg.sender] < maxRewardedInvestments && rewardToken != address(0) && rewardAmount > 0) {
            rewardedInvestments[msg.sender] += 1;
            IRewardToken(rewardToken).rewardUser(msg.sender, rewardAmount);
            emit RewardIssued(businessId, msg.sender, rewardAmount);
        }
    }

    function withdrawFunds(address payable recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");
        require(address(this).balance >= amount, "Insufficient contract balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(recipient, amount);
    }

    function withdrawAllFunds(address payable recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");

        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available");

        (bool success, ) = recipient.call{value: balance}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(recipient, balance);
    }

    
    function getInvestment(uint businessId, address user) public view returns(uint) {
        return investments[businessId][user];
    }
}