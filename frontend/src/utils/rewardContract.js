import { ethers } from "ethers";
import RewardToken from "../abis/RewardToken.json";

const CONTRACT_ADDRESS =
  process.env.REACT_APP_REWARD_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const EXPECTED_CHAIN_ID = Number(process.env.REACT_APP_CHAIN_ID || 31337);
const EXPECTED_CHAIN_HEX = process.env.REACT_APP_CHAIN_HEX || "0x7a69";
const EXPECTED_CHAIN_LABEL = process.env.REACT_APP_CHAIN_LABEL || "configured network";

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
  if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
    if (!allowNetworkSwitch) {
      throw new Error(`Switch MetaMask to ${EXPECTED_CHAIN_LABEL}`);
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: EXPECTED_CHAIN_HEX }],
      });
      provider = new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      throw new Error(`Switch MetaMask to ${EXPECTED_CHAIN_LABEL}`);
    }
  }

  const runner = requireSigner ? await provider.getSigner() : provider;
  const contract = new ethers.Contract(CONTRACT_ADDRESS, RewardToken.abi, runner);

  return contract;
};