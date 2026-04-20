import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { connectWallet } from "./utils/wallet";
import Home from "./pages/home";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import "./styles/global.css";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);

  const handleConnect = async () => {
    if (!user) {
      alert("Please login first to connect your wallet.");
      return;
    }

    const acc = await connectWallet();
    setAccount(acc || null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setAccount(null);
    }
  };

  return (
    <div className="app-shell">
      <Navbar
        user={user}
        account={account}
        setUser={setUser}
        onConnectWallet={handleConnect}
        onLogout={handleLogout}
      />

      <main className="app-main">
        <Home user={user} account={account} />
      </main>

      <Footer />
    </div>
  );
}

export default App;