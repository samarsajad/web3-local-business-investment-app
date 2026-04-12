const hre = require("hardhat");

async function main() {
  const RewardToken = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();

  const Investment = await hre.ethers.getContractFactory("Investment");
  const investment = await Investment.deploy();
  await investment.waitForDeployment();

  const rewardAddress = await rewardToken.getAddress();
  const investmentAddress = await investment.getAddress();

  const setRewardTx = await investment.setRewardToken(rewardAddress);
  await setRewardTx.wait();

  const transferOwnershipTx = await rewardToken.transferOwnership(investmentAddress);
  await transferOwnershipTx.wait();

  console.log("Reward Token deployed to:", rewardAddress);
  console.log("Investment deployed to:", investmentAddress);
  console.log("Reward ownership transferred to Investment:", investmentAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});