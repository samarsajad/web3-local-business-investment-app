import { useState } from "react";
import { signOut } from "firebase/auth";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { auth } from "./firebase";
import { connectWallet } from "./utils/wallet";
import Home from "./pages/home";
import BusinessDetailsPage from "./pages/business/[id]";
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
    <BrowserRouter>
      <div className="app-shell">
        <Navbar
          user={user}
          account={account}
          setUser={setUser}
          onConnectWallet={handleConnect}
          onLogout={handleLogout}
        />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home user={user} account={account} />} />
            <Route
              path="/business/:id"
              element={<BusinessDetailsPage user={user} />}
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;