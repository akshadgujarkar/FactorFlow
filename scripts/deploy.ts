import { ethers } from "hardhat";

async function main() {
  const monthlyFeeEth = process.env.MONTHLY_FEE_ETH ?? "0.01";
  const penaltyRate = Number(process.env.PENALTY_RATE ?? "25");

  if (!Number.isFinite(penaltyRate) || penaltyRate < 0) {
    throw new Error("PENALTY_RATE must be a non-negative number");
  }

  const monthlyFeeWei = ethers.parseEther(monthlyFeeEth);

  console.log("Deploying SocietyDAO...");
  console.log(`monthlyFee: ${monthlyFeeEth} ETH (${monthlyFeeWei.toString()} wei)`);
  console.log(`penaltyRate: ${penaltyRate}%`);

  const SocietyDAO = await ethers.getContractFactory("SocietyDAO");
  const societyDAO = await SocietyDAO.deploy(monthlyFeeWei, penaltyRate);
  await societyDAO.waitForDeployment();

  const address = await societyDAO.getAddress();
  console.log(`SocietyDAO deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

