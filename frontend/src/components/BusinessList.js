import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";

function BusinessList() {
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const querySnapshot = await getDocs(collection(db, "businesses"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBusinesses(data);
    };

    fetchBusinesses();
  }, []);

  const invest = async (businessId) => {
    try {
      const contract = await getContract();

      const tx = await contract.invest(Number(businessId), {
        value: ethers.parseEther("0.01"),
      });

      await tx.wait();

      alert("Investment successful!");
    } catch (err) {
      console.error(err);
      alert(err?.shortMessage || err?.reason || err?.message || "Transaction failed");
    }
  };

  return (
    <div>
      <h2>Local Businesses</h2>

      {businesses.map((biz, index) => (
        <div
          key={biz.id}
          style={{
            border: "1px solid gray",
            margin: "10px",
            padding: "10px",
          }}
        >
          <h3>{biz.name}</h3>
          <p>{biz.description}</p>
          <p>Funding Goal: ₹{biz.fundingGoal}</p>

          
          <button onClick={() => invest(index + 1)}>
            Invest
          </button>
        </div>
      ))}
    </div>
  );
}

export default BusinessList;