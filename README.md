#  Community-Powered Local Economy (Web3 DApp)

A decentralized platform where users can invest in local businesses, earn rewards, and participate in a circular local economy using **React, Firebase, and Blockchain (Hardhat + MetaMask)**.

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
├── frontend/        # React app
├── blockchain/      # Smart contracts (Hardhat)
└── README.md
```

---

# 1. FRONTEND SETUP (React + Firebase)

##  Install dependencies

```bash
cd frontend
npm install
npm install firebase axios ethers @react-google-maps/api
```

---

##  Run frontend

```bash
npm start
```

---


# ⛓️ 2. BLOCKCHAIN SETUP (Hardhat)

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


