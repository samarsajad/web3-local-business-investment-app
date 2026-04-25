import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { ethers } from "ethers";

import { db } from "../../../firebase";
import { getContract } from "../../../utils/contract";
import { getRewardContract } from "../../../utils/rewardContract";
import BusinessCard from "../../../components/Business/BusinessCard";

const INVEST_AMOUNT_ETH = process.env.REACT_APP_INVEST_AMOUNT_ETH || "0.001";

function BusinessDetailsPage({ user, account }) {
  const { id } = useParams();
  const decodedId = decodeURIComponent(id || "");

  const [businesses, setBusinesses] = useState([]);
  const [productsByBusiness, setProductsByBusiness] = useState({});
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [purchaseStatusTone, setPurchaseStatusTone] = useState("pending");

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
      setProductsByBusiness(grouped);
    } catch (err) {
      console.error("Business page load error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (account) {
      fetchData();
    }
  }, [account, fetchData]);

  const syncBusinessesToContract = async (bizData) => {
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
        onChainBusinesses.map((business) => [business.name.trim().toLowerCase(), business])
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
  };

  const selectedBusiness = useMemo(
    () => businesses.find((biz) => String(biz.docId || biz.id) === decodedId),
    [businesses, decodedId]
  );

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
        alert("Investment is temporarily unavailable for this business. Please try again later.");
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

      const txUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
      setPurchaseToast(`Investment submitted. Waiting for confirmation... ${txUrl}`, "pending");

      await tx.wait();
      setPurchaseToast("Investment confirmed on-chain.", "success");

      if (user?.uid) {
        const investedBusiness = businesses.find((biz) => biz.chainId === businessId);

        await addDoc(collection(db, "users", user.uid, "investments"), {
          userId: user.uid,
          walletAddress: account,
          businessId,
          businessDocId: investedBusiness?.docId || null,
          businessName: investedBusiness?.name || "Unknown business",
          amountEth: INVEST_AMOUNT_ETH,
          txHash: tx.hash,
          createdAt: serverTimestamp(),
        });
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
      clearPurchaseToast();

      if (rewardDelta > 0n) {
        alert(
          `Investment successful! You earned ${ethers.formatUnits(rewardDelta, 18)} LRT.`
        );
      } else {
        alert("Investment successful.");
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

      const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner(account);
const userAddress = await signer.getAddress();

const feeData = await provider.getFeeData();
const gasOverrides = {
  gasLimit: 150000n,
  maxFeePerGas: feeData.maxFeePerGas ?? feeData.gasPrice ?? ethers.parseUnits("20", "gwei"),
  maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei"),
};

const bal = await reward.balanceOf(userAddress);
const cost = ethers.parseUnits("5", 18);

let finalPrice = product.price;
if (bal >= cost) {
  try {
    const burnTx = await reward.burnTokens(cost, gasOverrides);
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
      const orderId =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const mintMessage = [
        "Mint NFT for purchase",
        `user:${userAddress}`,
        `business:${businessId}`,
        `product:${product.name}`,
        `price:${finalPrice}`,
        `order:${orderId}`,
      ].join("\n");

      const signature = await signer.signMessage(mintMessage);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/mint-nft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress,
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

      setPurchaseToast(`Purchased ${product.name} for Rs.${finalPrice}. NFT minted.`, "success");
      clearPurchaseToast();
      alert("Purchase successful and NFT minted!");
    } catch (err) {
      console.error(err);
      clearPurchaseToast();
      alert(err?.reason || err?.message || "Purchase failed");
    }
  };


  if (!selectedBusiness) {
    return (
      <div className="container dashboard-page">
        <div className="empty-state">
          <h3>Business not found</h3>
          <p>The business page you opened does not exist.</p>
          <Link to="/" className="business-card__open-link">
            Back to businesses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container dashboard-page">
      <div className="section-heading" id="businesses">
        <div>
          <span className="eyebrow">Business Page</span>
          <h2>{selectedBusiness.name}</h2>
        </div>
        <p>
          View this business profile and browse all its available products.
        </p>
      </div>

      <div className="business-page-topbar">
        <Link to="/" className="business-card__open-link">
          Back to all businesses
        </Link>
      </div>

      {purchaseStatus ? (
        <div className={`purchase-toast purchase-toast--${purchaseStatusTone}`}>
          <span className="purchase-toast__icon">{getPurchaseToastIcon()}</span>
          <span>{purchaseStatus}</span>
        </div>
      ) : null}

      <BusinessCard
        business={selectedBusiness}
        products={
          productsByBusiness[selectedBusiness.id] ||
          productsByBusiness[selectedBusiness.docId] ||
          []
        }
        onInvest={() => invest(selectedBusiness)}
        onBuy={handlePurchase}
        canInvest={Boolean(user && account)}
        showProducts
      />
    </div>
  );
}

export default BusinessDetailsPage;
