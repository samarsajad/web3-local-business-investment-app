
pragma solidity ^0.8.0;

contract Investment {

    struct Business {
        string name;
        uint fundingGoal;
        uint totalFunds;
    }

    uint public businessCount;

    mapping(uint => Business) public businesses;

    
    mapping(uint => mapping(address => uint)) public investments;

    function createBusiness(string memory _name, uint _goal) public {
        businessCount++;

        businesses[businessCount] = Business({
            name: _name,
            fundingGoal: _goal,
            totalFunds: 0
        });
    }

    
    function invest(uint businessId) public payable {
        require(msg.value > 0, "Send some ETH");

        businesses[businessId].totalFunds += msg.value;
        investments[businessId][msg.sender] += msg.value;
    }

    
    function getInvestment(uint businessId, address user) public view returns(uint) {
        return investments[businessId][user];
    }
}