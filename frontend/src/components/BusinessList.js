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
      const data = querySnapshot.docs.map(doc => ({
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

      // 🔹 Refresh balance
      await loadBalance();

    } catch (err) {
      console.error(err);
      alert(err?.shortMessage || err?.reason || err?.message || "Transaction failed");
    }
  };

  return (
    <div>
      <h2>Local Businesses</h2>

      {/* 🔹 Show balance ONCE (not inside loop) */}
      <h3>Your Rewards: {balance} LRT</h3>

      {businesses.map((biz, index) => (
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

          <button onClick={() => invest(index + 1)}>
            Invest
          </button>
        </div>
      ))}
    </div>
  );
}

export default BusinessList;