
import { db } from "./firebase";

import { collection, addDoc, setDoc, doc } from "firebase/firestore";

const seedShops = async () => {

  try {

    // ── Shop 1: Local Cafe ──

    await setDoc(doc(db, "shops", "local_cafe"), {

      name: "Local Cafe",

      description: "Best cafe in the town",

      category: "Food & Beverages",

      businessId: 1,

    });

    await setDoc(doc(db, "shops", "local_cafe", "items", "item_001"), {

      name: "Masala Chai",

      price: 30,

      description: "Hot spiced tea",

    });

    await setDoc(doc(db, "shops", "local_cafe", "items", "item_002"), {

      name: "Cold Coffee",

      price: 80,

      description: "Chilled coffee with cream",

    });

    await setDoc(doc(db, "shops", "local_cafe", "items", "item_003"), {

      name: "Veg Sandwich",

      price: 60,

      description: "Grilled veg sandwich",

    });

    // ── Shop 2: Riya Boutique ──

    await setDoc(doc(db, "shops", "riya_boutique"), {

      name: "Riya Boutique",

      description: "Trendy local fashion store",

      category: "Fashion",

      businessId: 2,

    });

    await setDoc(doc(db, "shops", "riya_boutique", "items", "item_001"), {

      name: "Cotton Kurti",

      price: 299,

      description: "Comfortable daily wear kurti",

    });

    await setDoc(doc(db, "shops", "riya_boutique", "items", "item_002"), {

      name: "Printed Dupatta",

      price: 149,

      description: "Colorful printed dupatta",

    });

    // ── Shop 3: Dev Electronics ──

    await setDoc(doc(db, "shops", "dev_electronics"), {

      name: "Dev Electronics",

      description: "Your local gadget shop",

      category: "Electronics",

      businessId: 3,

    });

    await setDoc(doc(db, "shops", "dev_electronics", "items", "item_001"), {

      name: "USB Cable",

      price: 99,

      description: "Fast charging USB cable",

    });

    await setDoc(doc(db, "shops", "dev_electronics", "items", "item_002"), {

      name: "Phone Stand",

      price: 149,

      description: "Adjustable mobile stand",

    });

    console.log("Shops seeded successfully!");

  } catch (err) {

    console.error("Error seeding shops:", err);

  }

};

seedShops();

