import { useState } from "react";
import Login from "./components/Login";
import { connectWallet } from "./utils/wallet";

import { db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import "./App.css";

const seedShops = async () => {
  try {
    await setDoc(doc(db, "shops", "local_cafe"), { name: "Local Cafe", description: "Best cafe in the town", category: "Food & Beverages", businessId: 1 });
    await setDoc(doc(db, "shops", "local_cafe", "items", "item_001"), { name: "Masala Chai", price: 30, description: "Hot spiced tea" });
    await setDoc(doc(db, "shops", "local_cafe", "items", "item_002"), { name: "Cold Coffee", price: 80, description: "Chilled coffee with cream" });
    await setDoc(doc(db, "shops", "local_cafe", "items", "item_003"), { name: "Veg Sandwich", price: 60, description: "Grilled veg sandwich" });
    await setDoc(doc(db, "shops", "riya_boutique"), { name: "Riya Boutique", description: "Trendy local fashion store", category: "Fashion", businessId: 2 });
    await setDoc(doc(db, "shops", "riya_boutique", "items", "item_001"), { name: "Cotton Kurti", price: 299, description: "Comfortable daily wear kurti" });
    await setDoc(doc(db, "shops", "riya_boutique", "items", "item_002"), { name: "Printed Dupatta", price: 149, description: "Colorful printed dupatta" });
    await setDoc(doc(db, "shops", "dev_electronics"), { name: "Dev Electronics", description: "Your local gadget shop", category: "Electronics", businessId: 3 });
    await setDoc(doc(db, "shops", "dev_electronics", "items", "item_001"), { name: "USB Cable", price: 99, description: "Fast charging USB cable" });
    await setDoc(doc(db, "shops", "dev_electronics", "items", "item_002"), { name: "Phone Stand", price: 149, description: "Adjustable mobile stand" });
    await setDoc(doc(db, "shops", "local_bakery"), { name: "Local Bakery", description: "Fresh bread and cakes", category: "Bakery", businessId: 4 });
    await setDoc(doc(db, "shops", "local_bakery", "items", "item_001"), { name: "Butter Croissant", price: 45, description: "Freshly baked croissant" });
    await setDoc(doc(db, "shops", "local_bakery", "items", "item_002"), { name: "Chocolate Cake Slice", price: 80, description: "Rich chocolate cake" });
    await setDoc(doc(db, "shops", "local_bakery", "items", "item_003"), { name: "Whole Wheat Bread", price: 55, description: "Healthy whole wheat loaf" });
    alert("Shops seeded!");
  } catch (err) { alert("Error: " + err.message); }
};
import Home from "./pages/home";
import "./styles/global.css";


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
        // 🔐 LOGIN SCREEN
        <Login setUser={setUser} />
      ) : (
        // 🏠 MAIN APP
        <>

          {/* HEADER */}
          <div className="app-header">
            <div className="header-left">
              <span className="logo-icon">🏘️</span>
              <div>
                <div className="logo-title">Community Local Economy</div>
                <div className="logo-sub">Powered by Web3 + AI</div>
              </div>
            </div>
            <div className="header-right">
              <div className="sdg-badge">🌍 SDG 8 · SDG 11</div>
              <button className="btn btn-wallet" onClick={handleConnect}>
                {account ? "✅ " + account.slice(0,6) + "..." + account.slice(-4) : "🦊 Connect Wallet"}
              </button>
              <button className="btn btn-seed" onClick={seedShops}>Seed</button>
            </div>
          </div>

          {/* HERO */}
          <div className="hero">
            <div className="hero-tag">🚀 Google Solution Challenge 2026</div>
            <h2>Invest Local. <span className="green-text">Earn Rewards.</span><br/>Build Community.</h2>
            <p>Support neighborhood businesses with micro-investments, earn blockchain-backed LRT tokens, and redeem discounts across the local circular economy.</p>
            <div className="how-it-works">
              <div className="step">
                <div className="step-icon">💰</div>
                <div className="step-title">Invest</div>
                <div className="step-desc">Fund local businesses from Rs.100</div>
              </div>
              <div className="step-arrow">→</div>
              <div className="step">
                <div className="step-icon">🪙</div>
                <div className="step-title">Earn LRT</div>
                <div className="step-desc">Get blockchain reward tokens</div>
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
                <div className="step-title">NFT Proof</div>
                <div className="step-desc">Blockchain purchase receipt</div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-number">2</span>
              <span className="stat-label">Businesses Funded</span>
            </div>
            <div className="stat-divider"/>
            <div className="stat">
              <span className="stat-number">4</span>
              <span className="stat-label">Partner Shops</span>
            </div>
            <div className="stat-divider"/>
            <div className="stat">
              <span className="stat-number">10%</span>
              <span className="stat-label">Token Discount</span>
            </div>
            <div className="stat-divider"/>
            <div className="stat">
              <span className="stat-number">LRT</span>
              <span className="stat-label">Reward Token</span>
            </div>
            <div className="stat-divider"/>
            <div className="stat">
              <span className="stat-number">∞</span>
              <span className="stat-label">Community Impact</span>
            </div>
          </div>

          <div className="main-content">
            <BusinessList />
          </div>

          {/* FOOTER */}
          <div className="footer">
            <div className="footer-content">
              <span>🏘️ Community Local Economy</span>
              <span>Built for Google Solution Challenge 2026</span>
              <span>Powered by Firebase · Web3 · Vertex AI</span>
            </div>
          </div>

          <div style={{ padding: "20px" }}>
            <button
              onClick={handleConnect}
              style={{
                padding: "8px 12px",
                background: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "6px",
                marginBottom: "10px"
              }}
            >
              {account ? "Wallet Connected ✅" : "Connect Wallet"}
            </button>
          </div>

          <Home user={user} account={account} />

        </>
      )}
    </div>
  );
}

export default App;
