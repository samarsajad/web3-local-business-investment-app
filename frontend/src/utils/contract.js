import { ethers } from "ethers";

const CONTRACT_ADDRESS =
  process.env.REACT_APP_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const EXPECTED_CHAIN_ID = BigInt(process.env.REACT_APP_CHAIN_ID || "31337");
const EXPECTED_CHAIN_HEX = process.env.REACT_APP_CHAIN_HEX || "0x7a69";
const EXPECTED_CHAIN_LABEL = process.env.REACT_APP_CHAIN_LABEL || "configured network";

const ABI = [{
      "inputs": [],
      "name": "businessCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "businesses",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "fundingGoal",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalFunds",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_goal",
          "type": "uint256"
        }
      ],
      "name": "createBusiness",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "businessId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getInvestment",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "businessId",
          "type": "uint256"
        }
      ],
      "name": "invest",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "investments",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }];

export const getContract = async (options = {}) => {
  const {
    requireSigner = true,
    requestAccounts = requireSigner,
    allowNetworkSwitch = requireSigner,
  } = options;

  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  let provider = new ethers.BrowserProvider(window.ethereum);

  let selectedAccount;
  if (requestAccounts) {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    selectedAccount = accounts[0];
  }

  const network = await provider.getNetwork();

  if (network.chainId !== EXPECTED_CHAIN_ID) {
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

  let runner = provider;
  if (requireSigner) {
    const signer = await provider.getSigner();

    if (selectedAccount) {
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== selectedAccount.toLowerCase()) {
        throw new Error("Account mismatch. Reconnect MetaMask.");
      }
    }

    runner = signer;
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, runner);

  return contract;
};