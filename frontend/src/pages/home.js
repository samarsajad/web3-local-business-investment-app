import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { ethers } from "ethers";

import Header from "../components/Layout/header";
import BusinessCard from "../components/Business/BusinessCard";

import { getContract } from "../utils/contract";
import { getRewardContract } from "../utils/rewardContract";

import AIRecommendationCard from "../components/AI/AICard";
import InvestmentInsights from "../components/AI/InvestmentInsights";


function Home({ user, account }) {
  const minPersonalizedInvestments = 1;
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState({});
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState("");

  const [aiRecommendation, setAiRecommendation] = useState("");
  const [recommendedBusinessName, setRecommendedBusinessName] = useState("");
  const [nextRecommendation, setNextRecommendation] = useState("");
  const [nextRecommendedBusinessName, setNextRecommendedBusinessName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [nextError, setNextError] = useState("");

  const [userInvestments, setUserInvestments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    loadBalance();
  }, [account]);

  useEffect(() => {
    if (businesses.length > 0) {
      fetchAIRecommendation();
    }
  }, [businesses, products]);

  useEffect(() => {
    loadUserInvestments();
  }, [user?.uid]);

  useEffect(() => {
    if (
      !user?.uid ||
      businesses.length === 0 ||
      userInvestments.length < minPersonalizedInvestments
    ) {
      setNextRecommendation("");
      setNextRecommendedBusinessName("");
      setNextError("");
      return;
    }

    fetchPersonalizedRecommendation();
  }, [user?.uid, businesses, products, userInvestments]);

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

  const loadUserInvestments = async () => {
    if (!user?.uid) {
      setUserInvestments([]);
      return;
    }

    try {
      const investmentsRef = collection(db, "users", user.uid, "investments");
      const investmentsQuery = query(investmentsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(investmentsQuery);

      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserInvestments(records);
    } catch (err) {
      console.error("Failed to load user investments:", err);
      setUserInvestments([]);
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
      const contract = await getContract({
        requireSigner: false,
        requestAccounts: false,
        allowNetworkSwitch: false,
      });
      const count = Number(await contract.businessCount());

      if (count === 0) {
        return bizData.map((biz, index) => ({
          ...biz,
          chainId: index + 1,
          totalFundsEth: Number(biz.totalFundsEth || 0),
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
        const firestoreGoalRs = Number(biz.fundingGoal || 1000);

        return {
          ...biz,
          chainId: onChain?.id ?? index + 1,
          fundingGoal: firestoreGoalRs,
          fundingGoalRs: firestoreGoalRs,
          onChainFundingGoal: onChain?.fundingGoal ?? null,
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
      if (!window.ethereum || !account) {
        setBalance("0");
        return;
      }

      const contract = await getRewardContract({
        requireSigner: false,
        requestAccounts: false,
        allowNetworkSwitch: false,
      });

      const bal = await contract.balanceOf(account);
      setBalance(ethers.formatUnits(bal, 18));
    } catch (err) {
      console.error("Balance error:", err);
      setBalance("0");
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
    } catch (err) {
      console.error("AI error:", err);
      setAiRecommendation("");
      setRecommendedBusinessName("");
      setAiError(err?.message || "Unable to fetch AI recommendation");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchPersonalizedRecommendation = async () => {
    setNextLoading(true);
    setNextError("");

    try {
      const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

      const res = await fetch(`${backendUrl}/api/ai/personalized`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInvestments,
          businesses,
          productsByBusiness: products,
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(
          errPayload?.details || errPayload?.error || "Failed to fetch personalized AI"
        );
      }

      const data = await res.json();
      setNextRecommendation(data?.recommendation || "No personalized recommendation yet.");
      setNextRecommendedBusinessName(data?.recommendedBusiness?.name || "");
    } catch (err) {
      console.error("Personalized AI error:", err);
      setNextRecommendation("");
      setNextRecommendedBusinessName("");
      setNextError(err?.message || "Unable to fetch next investment recommendation");
    } finally {
      setNextLoading(false);
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

    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const contract = await getContract({
        requireSigner: true,
        requestAccounts: false,
        allowNetworkSwitch: true,
      });
      const rewardContract = await getRewardContract({
        requireSigner: false,
        requestAccounts: false,
        allowNetworkSwitch: true,
      });

      const beforeBal = await rewardContract.balanceOf(account);

      const tx = await contract.invest(businessId, {
        value: ethers.parseEther("0.01"),
      });

      await tx.wait();

      const selectedBusiness = businesses.find((biz) => biz.chainId === businessId);
      if (user?.uid) {
        await addDoc(collection(db, "users", user.uid, "investments"), {
          userId: user.uid,
          walletAddress: account,
          businessId,
          businessDocId: selectedBusiness?.docId || null,
          businessName: selectedBusiness?.name || "Unknown business",
          amountEth: "0.01",
          txHash: tx.hash,
          createdAt: serverTimestamp(),
        });

        await loadUserInvestments();
      }

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

      const afterBal = await rewardContract.balanceOf(account);
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
    if (!user) {
      alert("Please login first to purchase.");
      return;
    }

    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      setPurchaseStatus(`Preparing purchase for ${product.name}...`);
      const reward = await getRewardContract({
        requireSigner: true,
        requestAccounts: false,
        allowNetworkSwitch: true,
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(account);
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
        loading={aiLoading}
        error={aiError}
      />

      <InvestmentInsights
        loading={nextLoading}
        error={nextError}
        investmentCount={userInvestments.length}
        lastInvestedBusinessName={userInvestments[0]?.businessName || ""}
        nextRecommendedBusinessName={nextRecommendedBusinessName}
        nextRecommendation={nextRecommendation}
        trendingBusinessName={recommendedBusinessName}
        trendingText={aiRecommendation}
      />

      {purchaseStatus ? (
        <div className="status-banner">{purchaseStatus}</div>
      ) : null}

      <div className="section-heading" id="businesses">
        <div>
          <span className="eyebrow">Marketplace</span>
          <h2>Explore local businesses</h2>
        </div>
        <p>
          Start by picking a business. Each business has its own page where you can
          view products and make purchases.
        </p>
      </div>

      {businesses.length === 0 ? (
        <div className="empty-state">
          <h3>No businesses found</h3>
          <p>Seed your database to populate the dashboard.</p>
        </div>
      ) : (
        <div className="businesses-grid">
          {businesses.map((biz, index) => (
            <BusinessCard
              key={biz.docId || biz.id || index}
              business={biz}
              products={products[biz.id] || products[biz.docId] || []}
              onInvest={() => invest(biz.chainId || index + 1)}
              onBuy={handlePurchase}
              isRecommended={isRecommended(biz.name)}
              canInvest={Boolean(user && account)}
              showProducts={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
