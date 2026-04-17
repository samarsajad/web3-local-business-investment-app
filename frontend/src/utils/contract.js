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

export const getContract = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  let provider = new ethers.BrowserProvider(window.ethereum);

  // 🔥 STEP 1: Force account selection popup
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const selectedAccount = accounts[0];
  console.log("Connected Account:", selectedAccount);

  // 🔍 STEP 2: Get network
  const network = await provider.getNetwork();
  console.log("CHAIN ID:", network.chainId.toString());

  // 🔥 STEP 3: Ensure correct network
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: LOCAL_CHAIN_HEX }], // 31337
      });
      provider = new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      throw new Error("Switch MetaMask to Hardhat Local (31337)");
    }
  }

  // 🔥 STEP 4: Get signer and VERIFY account
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  console.log("Signer Address:", signerAddress);

  // ❗ CRITICAL CHECK
  if (signerAddress.toLowerCase() !== selectedAccount.toLowerCase()) {
    throw new Error("Account mismatch. Reconnect MetaMask.");
  }

  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (!code || code === "0x") {
    throw new Error(
      `No contract found at ${CONTRACT_ADDRESS}. Redeploy Investment and set REACT_APP_CONTRACT_ADDRESS.`
    );
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  // Probe a known function so wrong-address issues fail fast with a clear message.
  try {
    await contract.businessCount();
  } catch (error) {
    throw new Error(
      `Address ${CONTRACT_ADDRESS} is not the Investment contract. After restarting Hardhat, redeploy Investment and update REACT_APP_CONTRACT_ADDRESS.`
    );
  }

  // ✅ STEP 5: Return contract
  return contract;
};