// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SocietyDAO {

    // ============================================================
    // STRUCTS
    // ============================================================

    struct Proposal {
        uint id;
        string description;
        uint amount;
        address payable recipient;
        uint deadline;
        uint yesVotes;
        uint noVotes;
        bool executed;
    }

    struct Payment {
        uint amount;
        uint timestamp;
        bool paid;
    }

    // ============================================================
    // STATE VARIABLES
    // ============================================================

    address public admin;

    uint public monthlyFee = 0.01 ether;
    uint public penaltyRate = 5; // 5% daily penalty after deadline

    uint public proposalCount;

    mapping(uint => Proposal) public proposals;
    mapping(uint => mapping(address => bool)) public hasVoted;
    mapping(address => Payment) public payments;
    mapping(address => bool) public isResident;

    uint public totalResidents;

    // ============================================================
    // EVENTS
    // ============================================================

    event MaintenancePaid(address indexed user, uint amount);
    event ProposalCreated(uint indexed proposalId);
    event VoteCast(address indexed voter, uint proposalId, bool support);
    event ProposalExecuted(uint indexed proposalId);

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor() {
        admin = msg.sender;
    }

    // ============================================================
    // MODIFIERS
    // ============================================================

    modifier onlyResident() {
        require(isResident[msg.sender], "Not a resident");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    // ============================================================
    // RESIDENT MANAGEMENT
    // ============================================================

    function addResident(address _user) external onlyAdmin {
        require(!isResident[_user], "Already resident");
        isResident[_user] = true;
        totalResidents++;
    }

    // ============================================================
    // TREASURY (RECEIVE FUNDS)
    // ============================================================

    receive() external payable {}

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    // ============================================================
    // MAINTENANCE PAYMENT LOGIC
    // ============================================================

    function payMaintenance() external payable onlyResident {
        uint requiredAmount = getDynamicFee(msg.sender);

        require(msg.value >= requiredAmount, "Insufficient payment");

        payments[msg.sender] = Payment({
            amount: msg.value,
            timestamp: block.timestamp,
            paid: true
        });

        emit MaintenancePaid(msg.sender, msg.value);
    }

    // 🔥 Penalty logic (your key feature)
    function getDynamicFee(address user) public view returns (uint) {
        Payment memory p = payments[user];

        if (!p.paid) return monthlyFee;

        uint daysLate = (block.timestamp - p.timestamp) / 1 days;

        if (daysLate <= 30) return monthlyFee;

        uint extraDays = daysLate - 30;

        return monthlyFee + ((monthlyFee * penaltyRate * extraDays) / 100);
    }

    // ============================================================
    // PROPOSALS
    // ============================================================

    function createProposal(
        string memory _desc,
        uint _amount,
        address payable _recipient,
        uint _duration
    ) external onlyResident returns (uint) {

        proposalCount++;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: _desc,
            amount: _amount,
            recipient: _recipient,
            deadline: block.timestamp + _duration,
            yesVotes: 0,
            noVotes: 0,
            executed: false
        });

        emit ProposalCreated(proposalCount);

        return proposalCount;
    }

    // ============================================================
    // VOTING SYSTEM
    // ============================================================

    function vote(uint _proposalId, bool support) external onlyResident {

        Proposal storage p = proposals[_proposalId];

        require(block.timestamp < p.deadline, "Voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        hasVoted[_proposalId][msg.sender] = true;

        if (support) {
            p.yesVotes++;
        } else {
            p.noVotes++;
        }

        emit VoteCast(msg.sender, _proposalId, support);
    }

    // ============================================================
    // EXECUTION LOGIC
    // ============================================================

    function executeProposal(uint _proposalId) external {

        Proposal storage p = proposals[_proposalId];

        require(block.timestamp >= p.deadline, "Voting not ended");
        require(!p.executed, "Already executed");

        require(p.yesVotes > p.noVotes, "Not approved");
        require(address(this).balance >= p.amount, "Insufficient funds");

        p.executed = true;

        p.recipient.transfer(p.amount);

        emit ProposalExecuted(_proposalId);
    }
}