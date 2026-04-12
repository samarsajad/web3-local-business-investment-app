import { useState } from "react";
import Login from "./components/Login";
import BusinessList from "./components/BusinessList";
import { connectWallet } from "./utils/wallet";
import { db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import "./App.css";

const seedShops = async () => {
  try {
    await setDoc(doc(db, "shops", "local_cafe"), {
      name: "Local Cafe", description: "Best cafe in the town",
      category: "Food & Beverages", businessId: 1,
    });
    await setDoc(doc(db, "shops", "local_cafe", "items", "item_001"), { name: "Masala Chai", price: 30, description: "Hot spiced tea" });
    await setDoc(doc(db, "shops", "local_cafe", "items", "item_002"), { name: "Cold Coffee", price: 80, description: "Chilled coffee with cream" });
    await setDoc(doc(db, "shops", "local_cafe", "items", "item_003"), { name: "Veg Sandwich", price: 60, description: "Grilled veg sandwich" });
    await setDoc(doc(db, "shops", "riya_boutique"), {
      name: "Riya Boutique", description: "Trendy local fashion store",
      category: "Fashion", businessId: 2,
    });
    await setDoc(doc(db, "shops", "riya_boutique", "items", "item_001"), { name: "Cotton Kurti", price: 299, description: "Comfortable daily wear kurti" });
    await setDoc(doc(db, "shops", "riya_boutique", "items", "item_002"), { name: "Printed Dupatta", price: 149, description: "Colorful printed dupatta" });
    await setDoc(doc(db, "shops", "dev_electronics"), {
      name: "Dev Electronics", description: "Your local gadget shop",
      category: "Electronics", businessId: 3,
    });
    await setDoc(doc(db, "shops", "dev_electronics", "items", "item_001"), { name: "USB Cable", price: 99, description: "Fast charging USB cable" });
    await setDoc(doc(db, "shops", "dev_electronics", "items", "item_002"), { name: "Phone Stand", price: 149, description: "Adjustable mobile stand" });
    await setDoc(doc(db, "shops", "local_bakery"), {
      name: "Local Bakery", description: "Fresh bread & cakes",
      category: "Bakery", businessId: 4,
    });
    await setDoc(doc(db, "shops", "local_bakery", "items", "item_001"), { name: "Butter Croissant", price: 45, description: "Freshly baked croissant" });
    await setDoc(doc(db, "shops", "local_bakery", "items", "item_002"), { name: "Chocolate Cake Slice", price: 80, description: "Rich chocolate cake" });
    await setDoc(doc(db, "shops", "local_bakery", "items", "item_003"), { name: "Whole Wheat Bread", price: 55, description: "Healthy whole wheat loaf" });
    alert("Shops seeded successfully!");
  } catch (err) {
    alert("Error: " + err.message);
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);

  const handleConnect = async () => {
    const acc = await connectWallet();
    setAccount(acc);
  };

  return (
    <div>
      {!user ? (
        <Login setUser={setUser} />
      ) : (
        <>
          {/* ── Header ── */}
          <div className="app-header">
            <h1>🏘️ Community Local Economy</h1>
            <div className="header-right">
              <button className="btn btn-wallet" onClick={handleConnect}>
                {account ? "✅ Wallet Connected" : "🦊 Connect Wallet"}
              </button>
              <button className="btn btn-seed" onClick={seedShops}>
                Seed Shops
              </button>
            </div>
          </div>

          {/* ── Hero ── */}
          <div className="hero">
            <div className="hero-content">
              <div className="hero-tag">🌍 SDG 8 · Decent Work & Economic Growth</div>
              <h2>Invest Local. <span>Earn Rewards.</span><br/>Build Community.</h2>
              <p>Support neighborhood businesses with micro-investments, earn blockchain-backed LRT tokens, and redeem discounts across the local economy.</p>
              <div className="how-it-works">
                <div className="step">
                  <div className="step-icon">💰</div>
                  <div className="step-title">Invest</div>
                  <div className="step-desc">Fund local businesses</div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-icon">🪙</div>
                  <div className="step-title">Earn LRT</div>
                  <div className="step-desc">Get blockchain tokens</div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-icon">🛒</div>
                  <div className="step-title">Spend</div>
                  <div className="step-desc">10% off at partner shops</div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-icon">🖼️</div>
                  <div className="step-title">Get NFT</div>
                  <div className="step-desc">Proof of purchase</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Bar ── */}
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-number">2</span>
              <span className="stat-label">Businesses Funded</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">4</span>
              <span className="stat-label">Partner Shops</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">10%</span>
              <span className="stat-label">Token Discount</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">LRT</span>
              <span className="stat-label">Reward Token</span>
            </div>
          </div>

          <div className="main-content">
            <BusinessList />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
