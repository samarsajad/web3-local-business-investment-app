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
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBusinesses(data);
    };
    fetchBusinesses();
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      const querySnapshot = await getDocs(collection(db, "shops"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setShops(data);
    };
    fetchShops();
  }, []);

  const fetchItems = async (shopId) => {
    if (selectedShop === shopId) { setSelectedShop(null); setShopItems([]); return; }
    const itemsSnapshot = await getDocs(collection(db, "shops", shopId, "items"));
    const items = itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
    } catch (err) { console.error("Balance error:", err); }
  };

  useEffect(() => {
    loadBalance();
    if (window.ethereum) window.ethereum.on("accountsChanged", () => window.location.reload());
  }, []);

  const invest = async (businessId) => {
    try {
      const contract = await getContract();
      const rewardContract = await getRewardContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const tx = await contract.invest(Number(businessId), { value: ethers.parseEther("0.01") });
      await tx.wait();
      const rewardTx = await rewardContract.rewardUser(userAddress, ethers.parseUnits("10", 18));
      await rewardTx.wait();
      alert("Investment successful! You earned 10 LRT tokens!");
      await loadBalance();
    } catch (err) {
      console.error(err);
      if (err?.code === "CALL_EXCEPTION") { alert("Transaction reverted. Check contract or businessId."); return; }
      alert(err?.shortMessage || err?.reason || err?.message || "Transaction failed");
    }
  };

  const handlePurchase = async (businessId, itemName, itemPrice) => {
    try {
      const rewardContract = await getRewardContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const userBalance = await rewardContract.balanceOf(userAddress);
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
    } catch (err) { console.error(err); alert("Purchase failed"); }
  };

  const categoryEmoji = { "Food & Beverages": "☕", "Fashion": "👗", "Electronics": "📱", "Bakery": "🥐" };
  const categoryClass = { "Food & Beverages": "cat-food", "Fashion": "cat-fashion", "Electronics": "cat-electronics", "Bakery": "cat-bakery" };

  return (
    <div>
      {/* REWARDS BANNER */}
      <div className="rewards-banner">
        <div className="rewards-left">
          <span className="rewards-icon">🪙</span>
          <div>
            <div className="rewards-label">Your LRT Token Balance</div>
            <div className="rewards-amount">{balance} LRT</div>
          </div>
        </div>
        <div className="rewards-tip">
          💡 Invest in businesses to earn LRT tokens<br/>
          Use tokens for <strong>10% discount</strong> at partner shops!
        </div>
      </div>

      {/* BUSINESSES */}
      <div className="section-header">
        <h2 className="section-title">🏪 Local Businesses</h2>
        <span className="section-badge">{businesses.length} Active</span>
      </div>

      {businesses.map((biz, index) => (
        <div key={biz.id} className="business-card">
          <div className="business-card-header">
            <div>
              <h3>{biz.name}</h3>
              <p className="description">{biz.description}</p>
            </div>
            <div className="funding-info">
              <div className="funding-label">Funding Goal</div>
              <div className="funding-amount">{biz.fundingGoal ? "Rs." + biz.fundingGoal : "—"}</div>
            </div>
          </div>
          <div className="progress-bar"><div className="progress-fill"></div></div>
          <div className="business-card-footer">
            <span className="reward-info">🎁 Earn 10 LRT tokens on every investment</span>
            <button className="btn btn-invest" onClick={() => invest(index + 1)}>💰 Invest Now</button>
          </div>
        </div>
      ))}

      <hr className="divider" />

      {/* SHOPS */}
      <div className="section-header">
        <h2 className="section-title">🛒 Spend Your Rewards</h2>
        <span className="section-badge">{shops.length} Partner Shops</span>
      </div>
      <p className="section-subtitle">Invest → Earn LRT tokens → Get 10% off at any partner shop below!</p>

      {shops.length === 0 && <div className="empty-state">No shops yet...</div>}

      {shops.map((shop) => (
        <div key={shop.id} className="shop-card">
          <div className="shop-card-header">
            <div className="shop-info">
              <h3>{categoryEmoji[shop.category] || "🏬"} {shop.name}</h3>
              <p>{shop.description}</p>
            </div>
            <div className="shop-meta">
              {shop.category && (
                <span className={"shop-category " + (categoryClass[shop.category] || "cat-default")}>
                  {shop.category}
                </span>
              )}
              <button className="btn btn-browse" onClick={() => fetchItems(shop.id)}>
                {selectedShop === shop.id ? "Hide ▲" : "Browse ▼"}
              </button>
            </div>
          </div>

          {selectedShop === shop.id && (
            <div className="items-list">
              {shopItems.length === 0 ? <p>No items found.</p> : (
                shopItems.map((item) => (
                  <div key={item.id} className="item-row">
                    <div className="item-info">
                      <strong>{item.name}</strong>
                      <span>{item.description}</span>
                    </div>
                    <div className="item-right">
                      <div className="item-price">Rs.{item.price}</div>
                      <div className="discount-badge">🏷️ 10% off with LRT</div>
                      <button className="btn btn-buy" onClick={() => handlePurchase(shop.businessId, item.name, item.price)}>
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
