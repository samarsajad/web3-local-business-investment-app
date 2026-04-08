import { useState } from "react";
import Login from "./components/Login";
import BusinessList from "./components/BusinessList";
import { connectWallet } from "./utils/wallet";

function App() {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);

  
  const handleConnect = async () => {
    const acc = await connectWallet();
    setAccount(acc);
    console.log("Connected:", acc);
  };

  return (
    <div>
      {!user ? (
        <Login setUser={setUser} />
      ) : (
        <>
          
          <button onClick={handleConnect}>
            {account ? "Wallet Connected" : "Connect Wallet"}
          </button>

          <BusinessList />
        </>
      )}
    </div>
  );
}

export default App;