import { ethers } from "ethers";
import RewardToken from "../abis/RewardToken.json";

const CONTRACT_ADDRESS =
  process.env.REACT_APP_REWARD_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const EXPECTED_CHAIN_ID = 31337n;
const LOCAL_CHAIN_HEX = "0x7a69";

export const getRewardContract = async (options = {}) => {
  const {
    requireSigner = true,
    requestAccounts = requireSigner,
    allowNetworkSwitch = requireSigner,
  } = options;

  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  let provider = new ethers.BrowserProvider(window.ethereum);

  if (requestAccounts) {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  const network = await provider.getNetwork();
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    if (!allowNetworkSwitch) {
      throw new Error("Switch MetaMask to Hardhat Local (31337)");
    }

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

  const runner = requireSigner ? await provider.getSigner() : provider;
  const contract = new ethers.Contract(CONTRACT_ADDRESS, RewardToken.abi, runner);

  return contract;
};