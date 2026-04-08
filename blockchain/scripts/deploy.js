const hre = require("hardhat");

async function main() {
  const Investment = await hre.ethers.getContractFactory("Investment");
  const investment = await Investment.deploy();

  await investment.waitForDeployment();

  console.log("Contract deployed to:", await investment.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});