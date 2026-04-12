import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { ethers } from "ethers";

import Header from "../components/Layout/header";
import BusinessCard from "../components/Business/BusinessCard";

import { getContract } from "../utils/contract";
import { getRewardContract } from "../utils/rewardContract";
import { getNFTContract } from "../utils/nftContract";

function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState({});
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);

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

      setBusinesses(bizData);
      setProducts(grouped);
    } catch (err) {
      console.error("Firestore error:", err);
    } finally {
      setLoading(false);
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
      const reward = await getRewardContract();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const user = await signer.getAddress();

      const tx = await contract.invest(businessId, {
        value: ethers.parseEther("0.01"),
      });

      await tx.wait();

      const rewardTx = await reward.rewardUser(
        user,
        ethers.parseUnits("10", 18)
      );

      await rewardTx.wait();

      alert("Investment successful + reward earned!");

      await loadBalance();
    } catch (err) {
      console.error(err);
      alert("Investment failed");
    }
  };

  // 🔹 Purchase + NFT mint
  const handlePurchase = async (businessId, product) => {
    try {
      const reward = await getRewardContract();
      const nft = await getNFTContract();

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
      alert(`Bought ${product.name} for ₹${finalPrice}`);

      // 🔥 NFT mint
      console.log("Minting NFT for:", user);
      const mintTx = await nft.mintNFT(user);
      await mintTx.wait();
      console.log("NFT mint transaction confirmed");

      const nftBalance = await nft.balanceOf(user);
      console.log("NFT count:", nftBalance.toString());

      alert("🎉 NFT minted successfully!");

      await loadBalance();
    } catch (err) {
      console.error(err);
      alert("Purchase failed");
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

      {businesses.length === 0 ? (
        <p>No businesses found. Seed your database.</p>
      ) : (
        businesses.map((biz, index) => (
          <BusinessCard
            key={biz.id}
            business={biz}
            products={products[biz.id] || []}
            onInvest={() => invest(index)}   // ✅ contract uses index
            onBuy={handlePurchase}
          />
        ))
      )}
    </div>
  );
}

export default Home;