import { useCallback, useEffect, useMemo, useState } from "react";
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

const INVEST_AMOUNT_ETH = process.env.REACT_APP_INVEST_AMOUNT_ETH || "0.0001";


function Home({ user, account }) {
  const minPersonalizedInvestments = 1;
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState({});
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [purchaseStatusTone, setPurchaseStatusTone] = useState("pending");

  const [aiRecommendation, setAiRecommendation] = useState("");
  const [recommendedBusinessName, setRecommendedBusinessName] = useState("");
  const [nextRecommendation, setNextRecommendation] = useState("");
  const [nextRecommendedBusinessName, setNextRecommendedBusinessName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [nextError, setNextError] = useState("");

  const [userInvestments, setUserInvestments] = useState([]);

  const setPurchaseToast = (message, tone = "pending") => {
    setPurchaseStatus(message);
    setPurchaseStatusTone(tone);
  };

  const clearPurchaseToast = () => {
    setPurchaseStatus("");
    setPurchaseStatusTone("pending");
  };

  const getPurchaseToastIcon = () => {
    if (purchaseStatusTone === "success") return "✓";
    if (purchaseStatusTone === "error") return "!";
    return "...";
  };

  const syncBusinessesToContract = useCallback(async (bizData) => {
    if (!window.ethereum || bizData.length === 0) {
      return bizData.map((biz) => ({
        ...biz,
        chainId: null,
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
        return bizData.map((biz) => ({
          ...biz,
          chainId: null,
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
          chainId: onChain?.id ?? null,
          fundingGoal: firestoreGoalRs,
          fundingGoalRs: firestoreGoalRs,
          onChainFundingGoal: onChain?.fundingGoal ?? null,
          totalFundsEth: onChain?.totalFundsEth ?? Number(biz.totalFundsEth || 0),
        };
      });
    } catch (err) {
      console.error("Contract sync error:", err);
      return bizData.map((biz) => ({
        ...biz,
        chainId: null,
        totalFundsEth: Number(biz.totalFundsEth || 0),
      }));
    }
  }, []);

  const fetchData = useCallback(async () => {
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
  }, [syncBusinessesToContract]);

  const loadUserInvestments = useCallback(async () => {
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
  }, [user?.uid]);

  const loadBalance = useCallback(async () => {
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
  }, [account]);

  const fetchAIRecommendation = useCallback(async () => {
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
  }, [businesses, products]);

  const fetchPersonalizedRecommendation = useCallback(async () => {
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
  }, [businesses, products, userInvestments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (account) {
      fetchData();
    }
  }, [account, fetchData]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    if (businesses.length > 0) {
      fetchAIRecommendation();
    }
  }, [businesses, products, fetchAIRecommendation]);

  useEffect(() => {
    loadUserInvestments();
  }, [loadUserInvestments]);

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
  }, [user?.uid, businesses, products, userInvestments, fetchPersonalizedRecommendation]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(".reveal-on-scroll"));
    if (nodes.length === 0) {
      return undefined;
    }

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
    };
  }, [
    loading,
    businesses.length,
    userInvestments.length,
    aiRecommendation,
    nextRecommendation,
    purchaseStatus,
  ]);

  const isRecommended = (bizName) => {
    if (!recommendedBusinessName) return false;
    return recommendedBusinessName.toLowerCase() === (bizName || "").toLowerCase();
  };

  const displayedBusinesses = useMemo(() => {
    if (!recommendedBusinessName) {
      return businesses;
    }

    const normalizedRecommended = recommendedBusinessName.toLowerCase();

    return [...businesses].sort((a, b) => {
      const aPriority = (a?.name || "").toLowerCase() === normalizedRecommended ? 0 : 1;
      const bPriority = (b?.name || "").toLowerCase() === normalizedRecommended ? 0 : 1;
      return aPriority - bPriority;
    });
  }, [businesses, recommendedBusinessName]);

  const invest = async (business) => {
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

      let businessId = business?.chainId;
      if (!Number.isInteger(businessId) || businessId <= 0) {
        const normalizedName = (business?.name || "").trim().toLowerCase();
        const count = Number(await contract.businessCount());
        for (let i = 1; i <= count; i += 1) {
          const onChainBusiness = await contract.businesses(i);
          if ((onChainBusiness.name || "").trim().toLowerCase() === normalizedName) {
            businessId = i;
            break;
          }
        }
      }

      if (!Number.isInteger(businessId) || businessId <= 0) {
        alert("Investment is temporarily unavailable for this business. Please try another business for now.");
        return;
      }

      const rewardContract = await getRewardContract({
        requireSigner: false,
        requestAccounts: false,
        allowNetworkSwitch: true,
      });

      const beforeBal = await rewardContract.balanceOf(account);

      setPurchaseToast("Submitting investment transaction. Confirm in MetaMask...", "pending");
      const tx = await contract.invest(businessId, {
        value: ethers.parseEther(INVEST_AMOUNT_ETH),
      });

      setPurchaseToast("Investment submitted. Waiting for confirmation...", "pending");

      await tx.wait();
      setPurchaseToast("Investment confirmed on-chain.", "success");

      const selectedBusiness = businesses.find((biz) => biz.chainId === businessId);
      if (user?.uid) {
        await addDoc(collection(db, "users", user.uid, "investments"), {
          userId: user.uid,
          walletAddress: account,
          businessId,
          businessDocId: selectedBusiness?.docId || null,
          businessName: selectedBusiness?.name || "Unknown business",
          amountEth: INVEST_AMOUNT_ETH,
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
                totalFundsEth: Number(biz.totalFundsEth || 0) + Number(INVEST_AMOUNT_ETH),
              }
            : biz
        )
      );

      const afterBal = await rewardContract.balanceOf(account);
      const rewardDelta = afterBal - beforeBal;

      setBalance(ethers.formatUnits(afterBal, 18));
      clearPurchaseToast();

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
      clearPurchaseToast();
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
      setPurchaseToast(`Preparing purchase for ${product.name}...`, "pending");
      const reward = await getRewardContract({
        requireSigner: true,
        requestAccounts: false,
        allowNetworkSwitch: true,
      });

      // ✅ AFTER
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner(account);
const user = await signer.getAddress();

// Fetch fee data upfront to avoid ethers internally calling getGasPrice
const feeData = await provider.getFeeData();
const gasOverrides = {
  gasLimit: 150000n,
  maxFeePerGas: feeData.maxFeePerGas ?? feeData.gasPrice ?? ethers.parseUnits("20", "gwei"),
  maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei"),
};

const bal = await reward.balanceOf(user);
const cost = ethers.parseUnits("5", 18);

let finalPrice = product.price;

if (bal >= cost) {
  try {
    const burnTx = await reward.burnTokens(cost, gasOverrides); // ✅ explicit gas
    await burnTx.wait();

          finalPrice = Math.floor(product.price * 0.9);
          alert("Discount applied using tokens!");
        } catch (burnError) {
          const burnMessage =
            burnError?.reason || burnError?.shortMessage || burnError?.message || "";
          if (/insufficient funds/i.test(String(burnMessage))) {
            alert("Not enough network ETH for gas. Continuing without token discount.");
          } else {
            throw burnError;
          }
        }
      } else {
        alert("Not enough tokens, paying full price.");
      }

      setPurchaseToast(`Bought ${product.name} for Rs.${finalPrice}. Minting NFT...`, "pending");

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
      setPurchaseToast("NFT mint submitted to backend. Waiting for confirmation...", "pending");

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

      setPurchaseToast(`NFT minted successfully for ${product.name}.`, "success");
      clearPurchaseToast();
      alert("NFT minted successfully!");

      await loadBalance();
    } catch (err) {
      console.error(err);
      clearPurchaseToast();
      alert(err?.reason || err?.message || "Purchase failed");
    }
  };


  return (
    <div className="container dashboard-page">
      <Header balance={balance} user={user} account={account} />
      <div className="reveal-on-scroll reveal-lift">
        <AIRecommendationCard
          recommendation={aiRecommendation}
          recommendedBusinessName={recommendedBusinessName}
          loading={aiLoading}
          error={aiError}
        />
      </div>

      <div className="reveal-on-scroll reveal-lift reveal-delay-1">
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
      </div>

      {purchaseStatus ? (
        <div className={`purchase-toast purchase-toast--${purchaseStatusTone}`}>
          <span className="purchase-toast__icon">{getPurchaseToastIcon()}</span>
          <span>{purchaseStatus}</span>
        </div>
      ) : null}

      <div className="section-heading reveal-on-scroll reveal-lift reveal-delay-2" id="businesses">
        <div>
          <span className="eyebrow">Marketplace</span>
          <h2>Explore local businesses</h2>
        </div>
        <p>
          Your Neighborhood, FundedBrowse local businesses, back the ones you
          believe in, and earn rewards when you shop.
        </p>
      </div>

      {/* {businesses.length === 0 ? (
        <div className="empty-state reveal-on-scroll reveal-lift reveal-delay-2">
          <h3>No businesses found</h3>
          <p>Seed your database to populate the dashboard.</p>
        </div>
      ) : ( */}
        <div className="businesses-grid">
          {displayedBusinesses.map((biz, index) => (
            <div
              key={biz.docId || biz.id || index}
              className="reveal-on-scroll reveal-lift"
              style={{ "--reveal-delay": `${Math.min(index * 90, 540)}ms` }}
            >
              <BusinessCard
                business={biz}
                products={products[biz.id] || products[biz.docId] || []}
                onInvest={() => invest(biz)}
                onBuy={handlePurchase}
                isRecommended={isRecommended(biz.name)}
                canInvest={Boolean(user && account)}
                showProducts={false}
              />
            </div>
          ))}
        </div>
      
    </div>
  );
}

export default Home;
