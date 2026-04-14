import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { getContract } from "../utils/contract";
import { getRewardContract } from "../utils/rewardContract";
import { ethers } from "ethers";

function BusinessList() {
  const [businesses, setBusinesses] = useState([]);
  const [balance, setBalance] = useState("0");

  // 🔹 Fetch businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      const querySnapshot = await getDocs(collection(db, "businesses"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBusinesses(data);
    };

    fetchBusinesses();
  }, []);

  // 🔹 Load token balance
  const loadBalance = async () => {
    try {
      const rewardContract = await getRewardContract();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const bal = await rewardContract.balanceOf(userAddress);
      setBalance(ethers.formatUnits(bal, 18));
    } catch (err) {
      console.error("Balance error:", err);
    }
  };

  useEffect(() => {
    loadBalance();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  // 🔹 Invest
  const invest = async (businessId) => {
    try {
      const contract = await getContract();

      const tx = await contract.invest(Number(businessId), {
        value: ethers.parseEther("0.01"),
      });

      await tx.wait();

      alert("Investment successful + reward handled by contract!");

      await loadBalance();
    } catch (err) {
      console.error(err);
      alert("Investment failed");
    }
  };

  // 🔹 Purchase + NFT mint
  const handlePurchase = async (businessId, product) => {
    try {
      const rewardContract = await getRewardContract();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const userBalance = await rewardContract.balanceOf(userAddress);
      console.log("User balance:", ethers.formatUnits(userBalance, 18));

      const discountCost = ethers.parseUnits("5", 18);
      const productName = product?.name || "Item";
      let finalPrice = 100;

      // 🔹 Apply discount
      if (userBalance >= discountCost) {
        const tx = await rewardContract.burnTokens(discountCost);
        await tx.wait();

        finalPrice = 90;
        alert("Discount applied using tokens!");
      } else {
        alert("Not enough tokens, paying full price.");
      }

      // 🔹 Simulate purchase
      alert(`Purchased ${productName} from business ${businessId} for ₹${finalPrice}`);

      const orderId =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const mintMessage = [
        "Mint NFT for purchase",
        `user:${userAddress}`,
        `business:${businessId}`,
        `product:${productName}`,
        `price:${finalPrice}`,
        `order:${orderId}`,
      ].join("\n");

      const signature = await signer.signMessage(mintMessage);
      const backendUrl =
        process.env.REACT_APP_BACKEND_URL || "http://localhost:4001";
      const response = await fetch(`${backendUrl}/mint-nft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress,
          orderId,
          businessId,
          productName,
          price: finalPrice,
          message: mintMessage,
          signature,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Backend NFT mint failed");
      }

      alert("NFT minted!");

      await loadBalance();
    } catch (err) {
      console.error(err);
      alert("Purchase or NFT mint failed");
    }
  };

  return (
    <div>
      <h2>Local Businesses</h2>

      <h3>Your Rewards: {balance} LRT</h3>

      {businesses.map((biz, index) => {
        const businessId = index + 1;

        return (
          <div
            key={biz.id}
            style={{
              border: "1px solid gray",
              margin: "10px",
              padding: "10px",
            }}
          >
            <h3>{biz.name}</h3>
            <p>{biz.description}</p>
            <p>Funding Goal: ₹{biz.fundingGoal}</p>

            <button onClick={() => invest(businessId)}>
              Invest
            </button>

            <button onClick={() => handlePurchase(businessId)}>
              Buy Item (₹100)
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default BusinessList;