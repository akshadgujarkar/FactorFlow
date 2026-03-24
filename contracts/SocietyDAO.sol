// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SocietyDAO {
    struct Proposal {
        uint256 amount;
        address payable recipient;
        uint256 deadline;
        bool executed;
        uint256 votesFor;
        uint256 votesAgainst;
        address proposer;
    }

    struct PaymentRecord {
        bool paid;
        uint256 amount;
        uint256 timestamp;
    }

    uint256 public monthlyFee;
    uint256 public penaltyRate;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => mapping(address => bool)) private votes;
    mapping(address => PaymentRecord) private payments;

    event MaintenancePaid(address indexed user, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId);
    event VoteCast(address indexed voter, uint256 indexed proposalId, bool support);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(uint256 _monthlyFee, uint256 _penaltyRate) {
        require(_monthlyFee > 0, "Monthly fee must be > 0");
        monthlyFee = _monthlyFee;
        penaltyRate = _penaltyRate;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function payMaintenance() external payable {
        require(msg.value >= monthlyFee, "Insufficient payment");

        payments[msg.sender] = PaymentRecord({
            paid: true,
            amount: msg.value,
            timestamp: block.timestamp
        });

        emit MaintenancePaid(msg.sender, msg.value);
    }

    function createProposal(
        uint256 amount,
        address recipient,
        uint256 deadline
    ) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(deadline > block.timestamp, "Deadline must be in future");

        proposalCount += 1;

        proposals[proposalCount] = Proposal({
            amount: amount,
            recipient: payable(recipient),
            deadline: deadline,
            executed: false,
            votesFor: 0,
            votesAgainst: 0,
            proposer: msg.sender
        });

        emit ProposalCreated(proposalCount);
        return proposalCount;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.recipient != address(0), "Proposal not found");
        require(block.timestamp <= proposal.deadline, "Voting ended");
        require(!proposal.executed, "Already executed");
        require(!votes[proposalId][msg.sender], "Already voted");

        votes[proposalId][msg.sender] = true;

        if (support) {
            proposal.votesFor += 1;
        } else {
            proposal.votesAgainst += 1;
        }

        emit VoteCast(msg.sender, proposalId, support);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.recipient != address(0), "Proposal not found");
        bool deadlinePassed = block.timestamp > proposal.deadline;
        bool unanimousYes = proposal.votesFor > 0 && proposal.votesAgainst == 0;
        require(deadlinePassed || unanimousYes, "Voting still active");
        require(!proposal.executed, "Already executed");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal rejected");
        require(address(this).balance >= proposal.amount, "Insufficient treasury");

        proposal.executed = true;
        (bool ok, ) = proposal.recipient.call{value: proposal.amount}("");
        require(ok, "Transfer failed");

        emit ProposalExecuted(proposalId);
    }

    function getProposal(
        uint256 id
    )
        external
        view
        returns (
            uint256 amount,
            address recipient,
            uint256 deadline,
            bool executed,
            uint256 votesFor,
            uint256 votesAgainst
        )
    {
        Proposal memory proposal = proposals[id];
        require(proposal.recipient != address(0), "Proposal not found");

        return (
            proposal.amount,
            proposal.recipient,
            proposal.deadline,
            proposal.executed,
            proposal.votesFor,
            proposal.votesAgainst
        );
    }

    function getPaymentStatus(
        address user
    ) external view returns (bool paid, uint256 amount, uint256 timestamp) {
        PaymentRecord memory payment = payments[user];
        return (payment.paid, payment.amount, payment.timestamp);
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return votes[proposalId][voter];
    }
}
