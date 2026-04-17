const hre = require("hardhat");

async function main() {
  const RewardToken = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();

  await rewardToken.waitForDeployment();

  console.log("Reward Token deployed to:", await rewardToken.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});