import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { ethers } from "ethers";

import Header from "../components/Layout/header";
import BusinessCard from "../components/Business/BusinessCard";

import { getContract } from "../utils/contract";
import { getRewardContract } from "../utils/rewardContract";

import AIRecommendationCard from "../components/AI/AICard";

function Home({ user, account }) {
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState({});
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState("");

  const [aiRecommendation, setAiRecommendation] = useState("");
  const [recommendedBusinessName, setRecommendedBusinessName] = useState("");
  const [aiModelInfo, setAiModelInfo] = useState(null);
  const [aiTopBreakdown, setAiTopBreakdown] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    fetchData();
    loadBalance();
  }, []);

  useEffect(() => {
    if (businesses.length > 0) {
      fetchAIRecommendation();
    }
  }, [businesses, products]);

  const fetchData = async () => {
    try {
      const bizSnap = await getDocs(collection(db, "businesses"));
      const prodSnap = await getDocs(collection(db, "products"));

      const bizData = bizSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          docId: doc.id,
          id: data.id ?? doc.id,
        };
      });

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
        totalFundsEth: Number(biz.totalFundsEth || 0),
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
          totalFundsEth: 0,
        }));
      }

      const onChainBusinesses = [];
      for (let i = 1; i <= count; i += 1) {
        const business = await contract.businesses(i);
        onChainBusinesses.push({
          id: i,
          name: business.name,
          fundingGoal: Number(business.fundingGoal),
          totalFundsEth: Number(ethers.formatEther(business.totalFunds)),
        });
      }

      const onChainByName = new Map(
        onChainBusinesses.map((business) => [
          business.name.trim().toLowerCase(),
          business,
        ])
      );

      return bizData.map((biz, index) => {
        const onChain = onChainByName.get((biz.name || "").trim().toLowerCase());

        return {
          ...biz,
          chainId: onChain?.id ?? index + 1,
          fundingGoal: onChain?.fundingGoal ?? Number(biz.fundingGoal || 1000),
          totalFundsEth: onChain?.totalFundsEth ?? Number(biz.totalFundsEth || 0),
        };
      });
    } catch (err) {
      console.error("Contract sync error:", err);
      return bizData.map((biz, index) => ({
        ...biz,
        chainId: index + 1,
        totalFundsEth: Number(biz.totalFundsEth || 0),
      }));
    }
  };

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

  const fetchAIRecommendation = async () => {
    setAiLoading(true);
    setAiError("");

    try {
      const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

      const res = await fetch(`${backendUrl}/api/ai/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businesses, productsByBusiness: products }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload?.error || "Failed to fetch AI recommendation");
      }

      const data = await res.json();
      setAiRecommendation(data?.recommendation || "No AI recommendation returned.");
      setRecommendedBusinessName(data?.recommendedBusiness?.name || "");
      setAiModelInfo(data?.model || null);
      setAiTopBreakdown(data?.recommendedBusiness?.breakdown || null);
    } catch (err) {
      console.error("AI error:", err);
      setAiRecommendation("");
      setRecommendedBusinessName("");
      setAiModelInfo(null);
      setAiTopBreakdown(null);
      setAiError(err?.message || "Unable to fetch AI recommendation");
    } finally {
      setAiLoading(false);
    }
  };

  const isRecommended = (bizName) => {
    if (!recommendedBusinessName) return false;
    return recommendedBusinessName.toLowerCase() === (bizName || "").toLowerCase();
  };

  const invest = async (businessId) => {
    if (!user) {
      alert("Please login first to invest.");
      return;
    }

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

      setBusinesses((prev) =>
        prev.map((biz) =>
          biz.chainId === businessId
            ? {
                ...biz,
                totalFundsEth: Number(biz.totalFundsEth || 0) + 0.01,
              }
            : biz
        )
      );

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
    } catch (err) {
      console.error(err);
      alert(err?.reason || err?.message || "Investment failed");
    }
  };

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

      if (bal >= cost) {
        const burnTx = await reward.burnTokens(cost);
        await burnTx.wait();

        finalPrice = Math.floor(product.price * 0.9);
        alert("Discount applied using tokens!");
      } else {
        alert("Not enough tokens, paying full price.");
      }

      setPurchaseStatus(`Bought ${product.name} for Rs.${finalPrice}. Minting NFT...`);

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
      alert("NFT minted successfully!");

      await loadBalance();
    } catch (err) {
      console.error(err);
      setPurchaseStatus("");
      alert(err?.reason || err?.message || "Purchase failed");
    }
  };

  if (loading) {
    return (
      <div className="container dashboard-loading">
        <div className="loading-card">
          <span className="eyebrow">Preparing dashboard</span>
          <h3>Loading businesses...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container dashboard-page">
      <Header balance={balance} user={user} account={account} />
      <AIRecommendationCard
        recommendation={aiRecommendation}
        recommendedBusinessName={recommendedBusinessName}
        modelInfo={aiModelInfo}
        topBreakdown={aiTopBreakdown}
        loading={aiLoading}
        error={aiError}
      />

      {purchaseStatus ? (
        <div className="status-banner">{purchaseStatus}</div>
      ) : null}

      <div className="section-heading" id="businesses">
        <div>
          <span className="eyebrow">Marketplace</span>
          <h2>Fund businesses and buy products</h2>
        </div>
        <p>
          Businesses are synced from Firestore and linked to the current contract state,
          so you can invest and purchase from one screen.
        </p>
      </div>

      {businesses.length === 0 ? (
        <div className="empty-state">
          <h3>No businesses found</h3>
          <p>Seed your database to populate the dashboard.</p>
        </div>
      ) : (
        businesses.map((biz, index) => (
          <BusinessCard
            key={biz.docId || biz.id || index}
            business={biz}
            products={products[biz.id] || products[biz.docId] || []}
            onInvest={() => invest(biz.chainId || index + 1)}
            onBuy={handlePurchase}
            isRecommended={isRecommended(biz.name)}
            canInvest={Boolean(user)}
          />
        ))
      )}
    </div>
  );
}

export default Home;
