import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { getContract } from "../utils/contract";
import { getRewardContract } from "../utils/rewardContract";
import { ethers } from "ethers";

function BusinessList() {
  const [businesses, setBusinesses] = useState([]);
  const [balance, setBalance] = useState("0");
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopItems, setShopItems] = useState([]);

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

  useEffect(() => {
    const fetchShops = async () => {
      const querySnapshot = await getDocs(collection(db, "shops"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setShops(data);
    };
    fetchShops();
  }, []);

  const fetchItems = async (shopId) => {
    if (selectedShop === shopId) {
      setSelectedShop(null);
      setShopItems([]);
      return;
    }
    const itemsSnapshot = await getDocs(
      collection(db, "shops", shopId, "items")
    );
    const items = itemsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setShopItems(items);
    setSelectedShop(shopId);
  };

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

  const invest = async (businessId) => {
    try {
      const contract = await getContract();
      const rewardContract = await getRewardContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const tx = await contract.invest(Number(businessId), {
        value: ethers.parseEther("0.01"),
      });
      await tx.wait();
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
        err?.shortMessage || err?.reason || err?.message || "Transaction failed"
      );
    }
  };

  const handlePurchase = async (businessId, itemName, itemPrice) => {
    try {
      const rewardContract = await getRewardContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const userBalance = await rewardContract.balanceOf(userAddress);
      console.log("User balance:", ethers.formatUnits(userBalance, 18));
      const discountCost = ethers.parseUnits("5", 18);
      let finalPrice = itemPrice;
      if (userBalance >= discountCost) {
        const tx = await rewardContract.burnTokens(discountCost);
        await tx.wait();
        finalPrice = Math.round(itemPrice * 0.9);
        alert("Discount applied! You saved Rs." + (itemPrice - finalPrice));
      } else {
        alert("Not enough tokens, paying full price.");
      }
      alert("Purchased " + itemName + " for Rs." + finalPrice);
      await loadBalance();
    } catch (err) {
      console.error(err);
      alert("Purchase failed");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
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
              borderRadius: "8px",
            }}
          >
            <h3>{biz.name}</h3>
            <p>{biz.description}</p>
            <p>Funding Goal: Rs.{biz.fundingGoal}</p>
            <button onClick={() => invest(businessId)}>Invest</button>
          </div>
        );
      })}

      <h2 style={{ marginTop: "30px" }}>Spend Your Rewards</h2>
      <p style={{ color: "gray" }}>Use your LRT tokens for discounts at these shops!</p>

      {shops.length === 0 && (
        <p style={{ color: "orange" }}>No shops yet - waiting for Firebase data...</p>
      )}

      {shops.map((shop) => (
        <div
          key={shop.id}
          style={{
            border: "1px solid #4CAF50",
            margin: "10px",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          <h3>{shop.name}</h3>
          <p>{shop.description}</p>
          <button
            onClick={() => fetchItems(shop.id)}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {selectedShop === shop.id ? "Hide Items" : "Browse Items"}
          </button>

          {selectedShop === shop.id && (
            <div style={{ marginTop: "10px" }}>
              {shopItems.length === 0 ? (
                <p>No items found in this shop.</p>
              ) : (
                shopItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px",
                      margin: "6px 0",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <p style={{ margin: "2px 0", color: "gray", fontSize: "13px" }}>
                        {item.description}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0", fontWeight: "bold" }}>Rs.{item.price}</p>
                      <button
                        onClick={() => handlePurchase(shop.businessId, item.name, item.price)}
                        style={{
                          marginTop: "4px",
                          backgroundColor: "#2196F3",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Buy (Rs.{item.price})
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default BusinessList;
