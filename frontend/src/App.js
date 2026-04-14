import { useState } from "react";
import Login from "./components/Login";
import { connectWallet } from "./utils/wallet";
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