import { useEffect, useState } from "react";
import Header from "../components/Layout/header";

function Home() {
  const [balance, setBalance] = useState(0);
  const [loadingId, setLoadingId] = useState(null);

  // 🔹 Demo balance
  useEffect(() => {
    setBalance(10);
  }, []);

  // 🔹 INVEST (Improved message)
  const invest = async (id) => {
    setLoadingId(id);

    setTimeout(() => {
      alert("🚀 Investment successful!\n+2 LRT tokens earned");
      setBalance((prev) => prev + 2);
      setLoadingId(null);
    }, 1200);
  };

  // 🔹 BUY (Improved message)
  const buyItem = (price, id) => {
    setLoadingId(id);

    setTimeout(() => {
      if (balance > 0) {
        alert("🎉 Discount unlocked using LRT!\nYou saved 10%");
        setBalance((prev) => prev - 2);
      } else {
        alert("⚠️ No LRT tokens available.\nYou paid full price.");
      }
      setLoadingId(null);
    }, 1000);
  };

  const businesses = [
    {
      id: 1,
      name: "Urban Brew Café ☕",
      tagline: "Craft coffee experience",
      category: "Food",
      goal: 100000,
      raised: 65000,
    },
    {
      id: 2,
      name: "Golden Crust Bakery 🥐",
      tagline: "Fresh baked happiness",
      category: "Bakery",
      goal: 80000,
      raised: 50000,
    },
  ];

  const shops = [
    {
      name: "Riya Boutique 👗",
      tagline: "Elegant styles for modern you",
      category: "Fashion",
      items: [
        { name: "Cotton Kurta", price: 1200 },
        { name: "Thread Work Dupatta", price: 800 },
      ],
    },
    {
      name: "Dev Electronics 📱",
      tagline: "Smart gadgets for smart living",
      category: "Electronics",
      items: [
        { name: "Wireless Earbuds", price: 2500 },
        { name: "Smart Watch", price: 4000 },
      ],
    },
    {
      name: "Cafe Delight 🍰",
      tagline: "Sweet treats & beverages",
      category: "Food",
      items: [
        { name: "Chocolate Cake", price: 200 },
        { name: "Cold Coffee", price: 120 },
      ],
    },
    {
      name: "FitZone Gym 💪",
      tagline: "Your fitness journey starts here",
      category: "Fitness",
      items: [
        { name: "Monthly Membership", price: 1500 },
        { name: "Personal Trainer", price: 3000 },
      ],
    },
  ];

  return (
    <div className="main">
      <Header />

      {/* HERO */}
      <div className="hero">
        <h1>Build Community.</h1>
        <p>Support neighborhood businesses with micro-investments and rewards</p>
      </div>

      {/* FLOW */}
      <div className="flow">
        <div className="flow-card">💰 Invest</div>
        <div className="flow-card">🪙 Earn</div>
        <div className="flow-card">🛒 Spend</div>
        <div className="flow-card">🧾 NFT</div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div><h3>2</h3><p>Businesses</p></div>
        <div><h3>4</h3><p>Shops</p></div>
        <div><h3>10%</h3><p>Discount</p></div>
        <div><h3>LRT</h3><p>Token</p></div>
      </div>

      {/* BALANCE */}
      <div className="balance-card">
        <h3>Your LRT Token Balance</h3>
        <h2>{balance} LRT</h2>
        <p style={{ fontSize: "14px", opacity: 0.7 }}>
          Use LRT tokens to unlock discounts in partner shops
        </p>
      </div>

      {/* BUSINESSES */}
      <h2 className="section-title">🏪 Local Businesses</h2>

      {businesses.map((biz) => {
        const percent = (biz.raised / biz.goal) * 100;

        return (
          <div key={biz.id} className="business-card">
            <div className="left">
              <h3>{biz.name}</h3>
              <p>{biz.tagline}</p>
              <span className="category">{biz.category}</span>
            </div>

            <div className="right">
              <h4>₹{biz.goal}</h4>
              <button
                className="btn"
                onClick={() => invest(biz.id)}
                disabled={loadingId === biz.id}
              >
                {loadingId === biz.id ? "Processing..." : "Invest"}
              </button>
            </div>

            <div className="progress">
              <div
                className="progress-fill"
                style={{ width: percent + "%" }}
              ></div>
            </div>
          </div>
        );
      })}

      {/* SHOPS */}
      <h2 className="section-title">🛒 Spend Your Rewards</h2>

      {shops.map((shop, index) => (
        <div key={index} className="shop-card">
          <h3>{shop.name}</h3>
          <p>{shop.tagline}</p>
          <span className="category">{shop.category}</span>

          {shop.items.map((item, i) => (
            <div key={i} className="shop-item">
              <div>
                <h4>{item.name}</h4>
                <p>₹{item.price}</p>
              </div>

              <button
                className="buy-btn"
                onClick={() => buyItem(item.price, i)}
                disabled={loadingId === i}
              >
                {loadingId === i ? "Processing..." : "Buy"}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Home;
