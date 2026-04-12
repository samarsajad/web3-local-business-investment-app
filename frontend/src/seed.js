import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// 🔹 Your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seed = async () => {
  try {
    // 🏪 Add businesses
    const bakeryRef = await addDoc(collection(db, "businesses"), {
      name: "Local Bakery",
      description: "Fresh bread & cakes",
    });

    const cafeRef = await addDoc(collection(db, "businesses"), {
      name: "Local Cafe",
      description: "Coffee & snacks",
    });

    console.log("Businesses added");

    // 🍰 Add products
    await addDoc(collection(db, "products"), {
      name: "Chocolate Cake",
      price: 200,
      businessId: bakeryRef.id,
    });

    await addDoc(collection(db, "products"), {
      name: "Croissant",
      price: 80,
      businessId: bakeryRef.id,
    });

    await addDoc(collection(db, "products"), {
      name: "Cold Coffee",
      price: 120,
      businessId: cafeRef.id,
    });

    console.log("Products added");

  } catch (err) {
    console.error(err);
  }
};

seed();