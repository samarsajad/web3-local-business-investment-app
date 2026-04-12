const hre = require("hardhat");

async function main() {
  const NFT = await hre.ethers.getContractFactory("PurchaseNFT");
  const nft = await NFT.deploy();

  await nft.waitForDeployment();

  console.log("NFT deployed to:", await nft.getAddress());
}

main();