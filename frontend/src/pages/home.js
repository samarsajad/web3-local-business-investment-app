import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Header from "../components/Layout/header";
import { getContract } from "../utils/contract";
import { getRewardContract } from "../utils/rewardContract";

function Home() {
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);

  // 🔹 Load Balance
  const loadBalance = async () => {
    try {
      if (!window.ethereum) return;

      const rewardContract = await getRewardContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const bal = await rewardContract.balanceOf(address);
      setBalance(ethers.formatUnits(bal, 18));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  // 🔹 INVEST (REAL FIX)
  const invest = async (businessId) => {
    try {
      if (!window.ethereum) {
        alert("Install MetaMask");
        return;
      }

      setLoading(true);

      const contract = await getContract();

      const tx = await contract.invest(businessId, {
        value: ethers.parseEther("0.01"),
      });

      await tx.wait();

      alert("✅ Investment successful!");
      await loadBalance();

    } catch (err) {
      console.error(err);

      if (err.code === "CALL_EXCEPTION") {
        alert("❌ Contract rejected (wrong businessId or contract issue)");
      } else if (err.code === "ACTION_REJECTED") {
        alert("⚠️ Transaction rejected");
      } else {
        alert(err?.shortMessage || "Transaction failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 BUY
  const buyItem = async (price) => {
    try {
      if (!window.ethereum) {
        alert("Connect wallet first");
        return;
      }

      setLoading(true);

      const rewardContract = await getRewardContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const balanceWei = await rewardContract.balanceOf(address);
      const discountCost = ethers.parseUnits("5", 18);

      let finalPrice = price;

      if (balanceWei >= discountCost) {
        const burnTx = await rewardContract.burnTokens(discountCost);
        await burnTx.wait();
        finalPrice = price * 0.9;
        alert("🎉 Discount applied!");
      } else {
        alert("No tokens → full price");
      }

      alert(`Purchased for ₹${finalPrice}`);
      await loadBalance();

    } catch (err) {
      console.error(err);
      alert("Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 DATA (same UI content)
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

      {/* FLOW SECTION */}
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
                disabled={loading}
                onClick={() => invest(biz.id)}
              >
                {loading ? "Processing..." : "Invest"}
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
                disabled={loading}
                onClick={() => buyItem(item.price)}
              >
                {loading ? "Processing..." : "Buy"}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Home;