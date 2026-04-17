import { useState } from "react";
import { connectWallet } from "../../utils/wallet";

function Header() {
  const [account, setAccount] = useState("");

  const handleConnect = async () => {
    const wallet = await connectWallet();
    if (wallet) setAccount(wallet.address);
  };

  return (
    <div className="header">
      <h3>🏘️ Community Local Economy</h3>

      <button className="wallet-btn" onClick={handleConnect}>
        {account
          ? account.slice(0, 6) + "..." + account.slice(-4)
          : "Connect Wallet"}
      </button>
    </div>
  );
}

export default Header;
