import { ethers } from "ethers";

const CONTRACT_ADDRESS =
  process.env.REACT_APP_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const EXPECTED_CHAIN_ID = 31337n;

const LOCAL_CHAIN_HEX = "0x7a69";

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

  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (!code || code === "0x") {
    throw new Error(
      `No contract found at ${CONTRACT_ADDRESS}. Redeploy Investment and set REACT_APP_CONTRACT_ADDRESS.`
    );
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, runner);

  // Probe a known function so wrong-address issues fail fast with a clear message.
  try {
    await contract.businessCount();
  } catch (error) {
    throw new Error(
      `Address ${CONTRACT_ADDRESS} is not the Investment contract. After restarting Hardhat, redeploy Investment and update REACT_APP_CONTRACT_ADDRESS.`
    );
  }

  return contract;
};