export const ETH_TO_INR = 200000; // 1 ETH = ₹200,000

export const formatETH = (eth: number) => `${eth.toFixed(4)} ETH`;
export const formatINR = (inr: number) => `₹${inr.toLocaleString('en-IN')}`;
export const ethToINR = (eth: number) => eth * ETH_TO_INR;
export const inrToETH = (inr: number) => inr / ETH_TO_INR;

export const residents = [
  { id: "1", name: "Aarav Sharma", flat: "A-101", wallet: "0x1a2b...3c4d", maintenanceDue: 2000, lateFee: 0, status: "paid" as const, paidDate: "2024-03-01" },
  { id: "2", name: "Priya Patel", flat: "A-102", wallet: "0x5e6f...7g8h", maintenanceDue: 2000, lateFee: 500, status: "late" as const, paidDate: null },
  { id: "3", name: "Vikram Singh", flat: "B-201", wallet: "0x9i0j...1k2l", maintenanceDue: 2000, lateFee: 0, status: "pending" as const, paidDate: null },
  { id: "4", name: "Neha Gupta", flat: "B-202", wallet: "0x3m4n...5o6p", maintenanceDue: 2000, lateFee: 0, status: "paid" as const, paidDate: "2024-03-05" },
  { id: "5", name: "Rahul Verma", flat: "C-301", wallet: "0x7q8r...9s0t", maintenanceDue: 2000, lateFee: 1000, status: "late" as const, paidDate: null },
  { id: "6", name: "Ananya Joshi", flat: "C-302", wallet: "0xab12...cd34", maintenanceDue: 2000, lateFee: 0, status: "paid" as const, paidDate: "2024-03-02" },
  { id: "7", name: "Karan Mehta", flat: "D-401", wallet: "0xef56...gh78", maintenanceDue: 2000, lateFee: 0, status: "pending" as const, paidDate: null },
  { id: "8", name: "Deepika Rao", flat: "D-402", wallet: "0xij90...kl12", maintenanceDue: 2000, lateFee: 500, status: "late" as const, paidDate: null },
];

export const proposals = [
  { id: "1", title: "Install Solar Panels", domain: "Infrastructure", description: "Install solar panels on rooftop for common area electricity", proposer: "Aarav Sharma", status: "active" as const, votesFor: 45, votesAgainst: 12, totalVoters: 80, budget: 0.5, vendorId: "1", createdAt: "2024-03-01" },
  { id: "2", title: "Repair Parking Lot", domain: "Maintenance", description: "Fix potholes and repaint parking lines in basement", proposer: "Priya Patel", status: "active" as const, votesFor: 30, votesAgainst: 5, totalVoters: 80, budget: 0.15, vendorId: null, createdAt: "2024-03-05" },
  { id: "3", title: "Garden Renovation", domain: "Amenities", description: "Redesign community garden with new plants and seating", proposer: "Neha Gupta", status: "completed" as const, votesFor: 60, votesAgainst: 8, totalVoters: 80, budget: 0.2, vendorId: "2", createdAt: "2024-02-15" },
  { id: "4", title: "Security Camera Upgrade", domain: "Security", description: "Replace old CCTV cameras with HD night vision models", proposer: "Vikram Singh", status: "active" as const, votesFor: 55, votesAgainst: 3, totalVoters: 80, budget: 0.3, vendorId: "3", createdAt: "2024-03-10" },
  { id: "5", title: "Swimming Pool Maintenance", domain: "Amenities", description: "Deep clean and repair filtration system", proposer: "Rahul Verma", status: "pending" as const, votesFor: 20, votesAgainst: 15, totalVoters: 80, budget: 0.1, vendorId: null, createdAt: "2024-03-12" },
];

export const vendors = [
  { id: "1", name: "GreenTech Solutions", specialty: "Solar & Electrical", contact: "+91 98765 43210", wallet: "0xven1...abc1", rating: 4.5, completedJobs: 12 },
  { id: "2", name: "Urban Gardens Co.", specialty: "Landscaping", contact: "+91 87654 32109", wallet: "0xven2...abc2", rating: 4.2, completedJobs: 8 },
  { id: "3", name: "SecureVision India", specialty: "Security Systems", contact: "+91 76543 21098", wallet: "0xven3...abc3", rating: 4.8, completedJobs: 20 },
  { id: "4", name: "BuildRight Contractors", specialty: "Civil Works", contact: "+91 65432 10987", wallet: "0xven4...abc4", rating: 4.0, completedJobs: 15 },
];

export const transactions = [
  { id: "1", type: "maintenance" as const, from: "Aarav Sharma (A-101)", to: "Treasury", amount: 0.01, inr: 2000, date: "2024-03-01", hash: "0xabc...123" },
  { id: "2", type: "maintenance" as const, from: "Neha Gupta (B-202)", to: "Treasury", amount: 0.01, inr: 2000, date: "2024-03-05", hash: "0xdef...456" },
  { id: "3", type: "payment" as const, from: "Treasury", to: "Urban Gardens Co.", amount: 0.2, inr: 40000, date: "2024-03-08", hash: "0xghi...789" },
  { id: "4", type: "maintenance" as const, from: "Ananya Joshi (C-302)", to: "Treasury", amount: 0.01, inr: 2000, date: "2024-03-02", hash: "0xjkl...012" },
  { id: "5", type: "payment" as const, from: "Treasury", to: "GreenTech Solutions", amount: 0.25, inr: 50000, date: "2024-03-15", hash: "0xmno...345" },
];

export const notifications = [
  { id: "1", title: "New Proposal: Security Camera Upgrade", message: "A new proposal has been submitted for voting", time: "2 hours ago", read: false, type: "proposal" as const },
  { id: "2", title: "Maintenance Due Reminder", message: "Your March maintenance of ₹2,000 is due", time: "1 day ago", read: false, type: "payment" as const },
  { id: "3", title: "Voting Ended: Garden Renovation", message: "The proposal passed with 88% votes in favor", time: "3 days ago", read: true, type: "proposal" as const },
  { id: "4", title: "Payment Confirmed", message: "Your maintenance payment of 0.01 ETH has been confirmed", time: "5 days ago", read: true, type: "payment" as const },
  { id: "5", title: "Work Completed: Garden Renovation", message: "The garden renovation has been marked as complete", time: "1 week ago", read: true, type: "system" as const },
];

export const monthlyCollection = [
  { month: "Oct", collected: 0.06, target: 0.08 },
  { month: "Nov", collected: 0.07, target: 0.08 },
  { month: "Dec", collected: 0.08, target: 0.08 },
  { month: "Jan", collected: 0.065, target: 0.08 },
  { month: "Feb", collected: 0.075, target: 0.08 },
  { month: "Mar", collected: 0.04, target: 0.08 },
];

export const spendingByDomain = [
  { domain: "Infrastructure", amount: 0.5, color: "hsl(200, 100%, 55%)" },
  { domain: "Maintenance", amount: 0.25, color: "hsl(260, 60%, 55%)" },
  { domain: "Amenities", amount: 0.3, color: "hsl(160, 100%, 45%)" },
  { domain: "Security", amount: 0.35, color: "hsl(40, 100%, 55%)" },
];

export const domains = ["Infrastructure", "Maintenance", "Amenities", "Security", "Governance", "Community"];

export const votingHistory = [
  { proposalId: "3", title: "Garden Renovation", vote: "for" as const, date: "2024-02-20" },
  { proposalId: "1", title: "Install Solar Panels", vote: "for" as const, date: "2024-03-02" },
  { proposalId: "5", title: "Swimming Pool Maintenance", vote: "against" as const, date: "2024-03-13" },
];
