import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

export const fixBusinessData = async () => {
  try {
    // Fix Local Bakery funding goal
    const bakeryRef = doc(db, "businesses", "local_bakery");
    await updateDoc(bakeryRef, {
      fundingGoal: 50000
    });
    alert("Fixed! Refresh the page.");
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
};
