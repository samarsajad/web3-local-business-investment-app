import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { ethers } from "ethers";

import Header from "../components/Layout/header";
import BusinessCard from "../components/Business/BusinessCard";

import { getContract } from "../utils/contract";
import { getRewardContract } from "../utils/rewardContract";

function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState({});
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState("");

  useEffect(() => {
    fetchData();
    loadBalance();
  }, []);

  // 🔹 Fetch businesses + products
  const fetchData = async () => {
    try {
      const bizSnap = await getDocs(collection(db, "businesses"));
      const prodSnap = await getDocs(collection(db, "products"));

      const bizData = bizSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const grouped = {};

      prodSnap.docs.forEach((doc) => {
        const data = doc.data();

        if (!grouped[data.businessId]) {
          grouped[data.businessId] = [];
        }

        grouped[data.businessId].push(data);
      });

      const syncedBusinesses = await syncBusinessesToContract(bizData);
      setBusinesses(syncedBusinesses);
      setProducts(grouped);
    } catch (err) {
      console.error("Firestore error:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncBusinessesToContract = async (bizData) => {
    if (!window.ethereum || bizData.length === 0) {
      return bizData.map((biz, index) => ({
        ...biz,
        chainId: index + 1,
      }));
    }

    try {
      const contract = await getContract();
      const count = Number(await contract.businessCount());

      if (count === 0) {
        for (const biz of bizData) {
          const fundingGoal = Number(biz.fundingGoal || 1000);
          const tx = await contract.createBusiness(biz.name, fundingGoal);
          await tx.wait();
        }

        return bizData.map((biz, index) => ({
          ...biz,
          chainId: index + 1,
        }));
      }

      const onChainBusinesses = [];
      for (let i = 1; i <= count; i += 1) {
        const business = await contract.businesses(i);
        onChainBusinesses.push({
          id: i,
          name: business.name,
        });
      }

      const idByName = new Map(
        onChainBusinesses.map((business) => [
          business.name.trim().toLowerCase(),
          business.id,
        ])
      );

      return bizData.map((biz, index) => ({
        ...biz,
        chainId:
          idByName.get((biz.name || "").trim().toLowerCase()) ?? index + 1,
      }));
    } catch (err) {
      console.error("Contract sync error:", err);
      return bizData.map((biz, index) => ({
        ...biz,
        chainId: index + 1,
      }));
    }
  };

  // 🔹 Load token balance
  const loadBalance = async () => {
    try {
      if (!window.ethereum) return;

      const contract = await getRewardContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const user = await signer.getAddress();

      const bal = await contract.balanceOf(user);
      setBalance(ethers.formatUnits(bal, 18));
    } catch (err) {
      console.error("Balance error:", err);
    }
  };

  // 🔹 Invest
  const invest = async (businessId) => {
    try {
      const contract = await getContract();
      const rewardContract = await getRewardContract();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const user = await signer.getAddress();

      const beforeBal = await rewardContract.balanceOf(user);

      const tx = await contract.invest(businessId, {
        value: ethers.parseEther("0.01"),
      });

      await tx.wait();

      const afterBal = await rewardContract.balanceOf(user);
      const rewardDelta = afterBal - beforeBal;

      setBalance(ethers.formatUnits(afterBal, 18));

      if (rewardDelta > 0n) {
        alert(
          `Investment successful! You earned ${ethers.formatUnits(
            rewardDelta,
            18
          )} LRT.`
        );
      } else {
        alert(
          "Investment successful, but no new LRT was added (you may have reached the 5 rewarded investments limit)."
        );
      }

      console.log("LRT before invest:", ethers.formatUnits(beforeBal, 18));
      console.log("LRT after invest:", ethers.formatUnits(afterBal, 18));
    } catch (err) {
      console.error(err);
      alert(err?.reason || err?.message || "Investment failed");
    }
  };

  // 🔹 Purchase + NFT mint
  const handlePurchase = async (businessId, product) => {
    try {
      setPurchaseStatus(`Preparing purchase for ${product.name}...`);
      const reward = await getRewardContract();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const user = await signer.getAddress();

      const bal = await reward.balanceOf(user);
      const cost = ethers.parseUnits("5", 18);

      let finalPrice = product.price;

      // 🔹 Apply discount
      if (bal >= cost) {
        const burnTx = await reward.burnTokens(cost);
        await burnTx.wait();

        finalPrice = Math.floor(product.price * 0.9);
        alert("Discount applied using tokens!");
      } else {
        alert("Not enough tokens, paying full price.");
      }

      // 🔹 Purchase confirmation
      setPurchaseStatus(`Bought ${product.name} for ₹${finalPrice}. Minting NFT...`);

      const orderId =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const mintMessage = [
        "Mint NFT for purchase",
        `user:${user}`,
        `business:${businessId}`,
        `product:${product.name}`,
        `price:${finalPrice}`,
        `order:${orderId}`,
      ].join("\n");

      const signature = await signer.signMessage(mintMessage);
      setPurchaseStatus("NFT mint submitted to backend. Waiting for confirmation...");

      const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/mint-nft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress: user,
          orderId,
          businessId,
          productName: product.name,
          price: finalPrice,
          message: mintMessage,
          signature,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Backend NFT mint failed");
      }

      setPurchaseStatus(`NFT minted successfully for ${product.name}.`);
      alert("🎉 NFT minted successfully!");

      await loadBalance();
    } catch (err) {
      console.error(err);
      setPurchaseStatus("");
      alert(err?.reason || err?.message || "Purchase failed");
    }
  };

  // 🔹 Loading UI
  if (loading) {
    return (
      <div className="container">
        <h3>Loading businesses...</h3>
      </div>
    );
  }

  return (
    <div className="container">
      <Header balance={balance} />
      {purchaseStatus ? <p style={{ marginTop: "12px" }}>{purchaseStatus}</p> : null}

      {businesses.length === 0 ? (
        <p>No businesses found. Seed your database.</p>
      ) : (
        businesses.map((biz, index) => (
          <BusinessCard
            key={biz.id}
            business={biz}
            products={products[biz.id] || []}
            onInvest={() => invest(biz.chainId || index + 1)}
            onBuy={handlePurchase}
          />
        ))
      )}
    </div>
  );
}

export default Home;