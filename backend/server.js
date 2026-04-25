const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { ethers } = require("ethers");
const PurchaseNFT = require("./abis/PurchaseNFT.json");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;
const mintSignerPrivateKey = process.env.MINT_SIGNER_PRIVATE_KEY;

if (!nftContractAddress) {
  throw new Error("NFT_CONTRACT_ADDRESS is required");
}

if (!mintSignerPrivateKey) {
  throw new Error("MINT_SIGNER_PRIVATE_KEY is required");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(mintSignerPrivateKey, provider);
const nftContract = new ethers.Contract(nftContractAddress, PurchaseNFT.abi, wallet);
const usedOrders = new Set();

// Log wallet info on startup
(async () => {
  try {
    const walletAddress = wallet.address;
    const balance = await provider.getBalance(walletAddress);
    const balanceInEth = ethers.formatEther(balance);
    const owner = await nftContract.owner();
    const isMinter = await nftContract.minters(walletAddress);
    console.log(`✓ Mint signer wallet: ${walletAddress}`);
    console.log(`✓ Wallet balance: ${balanceInEth} ETH (${balance.toString()} wei)`);
    console.log(`✓ NFT Contract: ${nftContractAddress}`);
    console.log(`✓ RPC URL: ${rpcUrl}`);
    console.log(`✓ NFT owner: ${owner}`);
    console.log(`✓ Wallet is minter: ${isMinter}`);

    if (!isMinter) {
      if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
        console.warn("⚠ Wallet is not a minter and does not own the contract; minting will fail until an owner grants access.");
      } else {
        const grantTx = await nftContract.addMinter(walletAddress);
        console.log(`✓ Granting minter role: ${grantTx.hash}`);
        await grantTx.wait();
        console.log("✓ Mint signer wallet added as minter");
      }
    }
  } catch (err) {
    console.error("✗ Failed to check wallet info:", err.message);
  }
})();

const aiRoutes = require("./routes/ai");

app.use(cors());
app.use(express.json());
app.use("/api/ai", aiRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/mint-nft", async (req, res) => {
  try {
    const {
      userAddress,
      orderId,
      businessId,
      productName,
      price,
      message,
      signature,
    } = req.body || {};

    if (!userAddress || !orderId || !businessId || !productName || !price || !message || !signature) {
      return res.status(400).json({ error: "Missing mint request fields" });
    }

    if (usedOrders.has(orderId)) {
      return res.status(409).json({ error: "This order was already processed" });
    }

    const expectedMessage = [
      "Mint NFT for purchase",
      `user:${userAddress}`,
      `business:${businessId}`,
      `product:${productName}`,
      `price:${price}`,
      `order:${orderId}`,
    ].join("\n");

    if (message !== expectedMessage) {
      return res.status(400).json({ error: "Mint request message mismatch" });
    }

    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return res.status(401).json({ error: "Signature verification failed" });
    }

    // Debug: Check wallet balance before mint
    const walletBalance = await provider.getBalance(wallet.address);
    const walletBalanceEth = ethers.formatEther(walletBalance);
    console.log(`[MINT] Wallet balance before mint: ${walletBalanceEth} ETH (${walletBalance.toString()} wei)`);

    // Try to estimate gas first
  let gasEstimate;
try {
  gasEstimate = await nftContract.mintNFT.estimateGas(userAddress);
} catch (estErr) {
  console.error(`[MINT] Gas estimation failed:`, estErr); // log full error, not just message
  return res.status(500).json({
    error: `Gas estimation failed: ${estErr?.reason || estErr?.message}`,
  });
}

    console.log(`[MINT] Minting NFT for user: ${userAddress}`);
    const mintTx = await nftContract.mintNFT(userAddress);
    console.log(`[MINT] Transaction submitted: ${mintTx.hash}`);
    
    const receipt = await mintTx.wait();
    console.log(`[MINT] Transaction confirmed: ${receipt.hash}`);

    usedOrders.add(orderId);

    return res.json({
      ok: true,
      txHash: receipt.hash,
      userAddress,
      orderId,
    });
  } catch (error) {
  console.error("Mint API error FULL:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
  return res.status(500).json({
    error: error?.reason || error?.shortMessage || error?.message || "NFT mint failed",
  });
}
});

app.listen(port, () => {
  console.log(`Mint verifier running on http://localhost:${port}`);
});
