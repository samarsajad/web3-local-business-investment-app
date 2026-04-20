const firebaseConfig = {
  apiKey: "AIzaSyAH4xit6_noco0Jynve-oC2JW1ysqVhPd4",
  authDomain: "blockchain-local-economy-app.firebaseapp.com",
  projectId: "blockchain-local-economy-app",
  storageBucket: "blockchain-local-economy-app.firebasestorage.app",
  messagingSenderId: "396522366570",
  appId: "1:396522366570:web:7e131a9acdb7b5e5cf8c13",
  measurementId: "G-R9VD2LQK1C",
};

async function seed() {
  const { initializeApp } = await import("firebase/app");
  const {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    setDoc,
  } = await import("firebase/firestore");

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const upsertBusiness = async (name, description, fundingGoal, location) => {
    const q = query(collection(db, "businesses"), where("name", "==", name));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const existing = snap.docs[0];
      await setDoc(
        doc(db, "businesses", existing.id),
        {
          name,
          description,
          fundingGoal,
          location,
        },
        { merge: true }
      );
      return existing.id;
    }

    const ref = await addDoc(collection(db, "businesses"), {
      name,
      description,
      fundingGoal,
      location,
    });
    return ref.id;
  };

  const addProductIfMissing = async (name, price, businessId) => {
    const q = query(
      collection(db, "products"),
      where("name", "==", name),
      where("businessId", "==", businessId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return;
    }

    await addDoc(collection(db, "products"), {
      name,
      price,
      businessId,
    });
  };

  try {
  const bakeryId = await upsertBusiness(
    "Local Bakery",
    "Fresh bread & cakes",
    1000,
    "MG Road, Bengaluru"
  );

  const cafeId = await upsertBusiness(
    "Local Cafe",
    "Coffee & snacks",
    1200,
    "Koramangala, Bengaluru"
  );

  // NEW BUSINESSES
  const groceryId = await upsertBusiness(
    "Green Grocery",
    "Fresh fruits and vegetables",
    1500,
    "Indiranagar, Bengaluru"
  );

  const bookstoreId = await upsertBusiness(
    "City Bookstore",
    "Books and stationery",
    800,
    "Jayanagar, Bengaluru"
  );

  const pharmacyId = await upsertBusiness(
    "Health Pharmacy",
    "Medicines and health products",
    2000,
    "HSR Layout, Bengaluru"
  );

  const clothingId = await upsertBusiness(
    "Trendy Clothes",
    "Fashion and apparel",
    1800,
    "Brigade Road, Bengaluru"
  );

  const electronicsId = await upsertBusiness(
    "Tech Store",
    "Electronics and gadgets",
    3000,
    "Marathahalli, Bengaluru"
  );

  const dairyId = await upsertBusiness(
    "Dairy Farm",
    "Milk and dairy products",
    1300,
    "Rajajinagar, Bengaluru"
  );

  const restaurantId = await upsertBusiness(
    "Family Restaurant",
    "Home-style meals",
    2500,
    "BTM Layout, Bengaluru"
  );

  const salonId = await upsertBusiness(
    "Beauty Salon",
    "Hair and skincare services",
    900,
    "Malleshwaram, Bengaluru"
  );

  // PRODUCTS
  await addProductIfMissing("Chocolate Cake", 200, bakeryId);
  await addProductIfMissing("Croissant", 80, bakeryId);
  await addProductIfMissing("Cold Coffee", 120, cafeId);

  await addProductIfMissing("Apples", 100, groceryId);
  await addProductIfMissing("Bananas", 60, groceryId);

  await addProductIfMissing("Notebook", 50, bookstoreId);
  await addProductIfMissing("Pen Pack", 30, bookstoreId);

  await addProductIfMissing("Paracetamol", 20, pharmacyId);
  await addProductIfMissing("Vitamins", 150, pharmacyId);

  await addProductIfMissing("T-Shirt", 400, clothingId);
  await addProductIfMissing("Jeans", 1200, clothingId);

  await addProductIfMissing("Headphones", 1500, electronicsId);
  await addProductIfMissing("Mobile Charger", 300, electronicsId);

  await addProductIfMissing("Milk", 60, dairyId);
  await addProductIfMissing("Paneer", 200, dairyId);

  await addProductIfMissing("Thali", 250, restaurantId);
  await addProductIfMissing("Biryani", 300, restaurantId);

  await addProductIfMissing("Haircut", 200, salonId);
  await addProductIfMissing("Facial", 800, salonId);

  console.log("Seed complete: businesses/products are ready.");
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
}
}

seed();
