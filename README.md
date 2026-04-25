#  Community-Powered Local Economy (Web3 DApp)

A decentralized platform where users can invest in local businesses, earn rewards, and participate in a circular local economy using **React, Firebase, and Blockchain**.

---

#  Tech Stack

* **Frontend:** React
* **Backend:** Firebase (Auth + Firestore)
* **Blockchain:** Hardhat (local), Solidity
* **Wallet:** MetaMask
* **Web3 Library:** ethers.js

---

#  Project Structure

```
project-root/
│
├── backend/        
├── blockchain/      
├── frontend/ 
└── README.md
```

---

# 1. FRONTEND SETUP 

##  Install dependencies

```bash
cd frontend
npm install
npm install firebase axios ethers @react-google-maps/api
```

---

## Create frontend environment file

```bash
REACT_APP_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
REACT_APP_REWARD_CONTRACT_ADDRESS=YOUR_DEPLOYED_REWARD_CONTRACT_ADDRESS
REACT_APP_NFT_ADDRESS=YOUR_DEPLOYED_NFT_CONTRACT_ADDRESS
REACT_APP_BACKEND_URL=YOUR_BACKEND_URL
REACT_APP_RPC_URL=YOUR_RPC_URL
```

##  Run frontend

```bash
npm start
```

---


# 2. BLOCKCHAIN SETUP 

##  Initialize project

```bash
cd ..
mkdir blockchain
cd blockchain

npm init -y
npm install --save-dev hardhat
npx hardhat --init
```




## Compile contract

```bash
npx hardhat compile
```

---

##  Start local blockchain

```bash
npx hardhat node
```

---

##  Deploy contract



```bash
npx hardhat run scripts/deploy.js --network localhost
```
##  Deploy Reward Token



```bash
npx hardhat run scripts/deployReward.js --network localhost
```

##  Deploy NFT



```bash
npx hardhat run scripts/deployNFT.js --network localhost
```


##  Create business

```bash
npx hardhat console --network localhost
```


#  3. METAMASK SETUP

1. Install MetaMask
2. Add network:

```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH
```

---

##  Import account

From Hardhat node:

```
Private Key: 0x...
```

 Import into MetaMask

---

#  4. BACKEND SETUP

##  Run backend

```bash
node server.js
```

##   Create backend environment file

```bash
RPC_URL=YOUR_RPC_URL
NFT_CONTRACT_ADDRESS=YOUR_DEPLOYED_NFT_CONTRACT_ADDRESS
MINT_SIGNER_PRIVATE_KEY=YOUR_BACKEND_MINT_WALLET_PRIVATE_KEY
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
```



