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

  // 🔹 Load balance on start + account change
  useEffect(() => {
    loadBalance();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  // 🔹 Invest function
  const invest = async (businessId) => {
    try {
      const contract = await getContract();
      const rewardContract = await getRewardContract();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // STEP 1: Invest
      const tx = await contract.invest(Number(businessId), {
        value: ethers.parseEther("0.01"),
      });

      await tx.wait();

      // STEP 2: Reward
      const rewardTx = await rewardContract.rewardUser(
        userAddress,
        ethers.parseUnits("10", 18)
      );

      await rewardTx.wait();

      alert("Investment successful + reward given!");

      await loadBalance();
    } catch (err) {
      console.error(err);

      if (err?.code === "CALL_EXCEPTION") {
        alert("Transaction reverted. Check contract or businessId.");
        return;
      }

      alert(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Transaction failed"
      );
    }
  };

  // 🔹 Purchase function
  const handlePurchase = async (businessId) => {
    try {
      const rewardContract = await getRewardContract();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const userBalance = await rewardContract.balanceOf(userAddress);
      console.log("User balance:", ethers.formatUnits(userBalance, 18));

      const discountCost = ethers.parseUnits("5", 18);

      let finalPrice = 100;

      // ✅ Apply discount if enough tokens
      if (userBalance >= discountCost) {
        const tx = await rewardContract.burnTokens(discountCost);
        await tx.wait();

        finalPrice = 90;
        alert("Discount applied using tokens!");
      } else {
        alert("Not enough tokens, paying full price.");
      }

      // Simulated purchase
      alert(`Purchased from business ${businessId} for ₹${finalPrice}`);

      await loadBalance();
    } catch (err) {
      console.error(err);
      alert("Purchase failed");
    }
  };

  return (
    <div>
      <h2>Local Businesses</h2>

      {/* 🔹 User balance */}
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