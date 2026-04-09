import { ethers } from "ethers";
import RewardToken from "../abis/RewardToken.json";

const CONTRACT_ADDRESS =
  process.env.REACT_APP_REWARD_CONTRACT_ADDRESS ||
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const EXPECTED_CHAIN_ID = 31337n;
const LOCAL_CHAIN_HEX = "0x7a69";

export const getRewardContract = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  let provider = new ethers.BrowserProvider(window.ethereum);

  const network = await provider.getNetwork();
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: LOCAL_CHAIN_HEX }],
      });
      provider = new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      throw new Error("Switch MetaMask to Hardhat Local (31337)");
    }
  }

  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (!code || code === "0x") {
    throw new Error(
      `No contract found at ${CONTRACT_ADDRESS}. Redeploy RewardToken and set REACT_APP_REWARD_CONTRACT_ADDRESS.`
    );
  }

  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, RewardToken.abi, signer);

  try {
    await contract.name();
  } catch (error) {
    throw new Error(
      `Address ${CONTRACT_ADDRESS} is not the RewardToken contract. Redeploy RewardToken and update REACT_APP_REWARD_CONTRACT_ADDRESS.`
    );
  }

  return contract;
};