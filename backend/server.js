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

app.use(cors());
app.use(express.json());

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

    const mintTx = await nftContract.mintNFT(userAddress);
    const receipt = await mintTx.wait();

    usedOrders.add(orderId);

    return res.json({
      ok: true,
      txHash: receipt.hash,
      userAddress,
      orderId,
    });
  } catch (error) {
    console.error("Mint API error:", error);
    return res.status(500).json({
      error: error?.reason || error?.shortMessage || error?.message || "NFT mint failed",
    });
  }
});

app.listen(port, () => {
  console.log(`Mint verifier running on http://localhost:${port}`);
});
