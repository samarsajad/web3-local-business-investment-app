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
  } = await import("firebase/firestore");

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const upsertBusiness = async (name, description) => {
    const q = query(collection(db, "businesses"), where("name", "==", name));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].id;
    }

    const ref = await addDoc(collection(db, "businesses"), {
      name,
      description,
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
    const bakeryId = await upsertBusiness("Local Bakery", "Fresh bread & cakes");
    const cafeId = await upsertBusiness("Local Cafe", "Coffee & snacks");

    await addProductIfMissing("Chocolate Cake", 200, bakeryId);
    await addProductIfMissing("Croissant", 80, bakeryId);
    await addProductIfMissing("Cold Coffee", 120, cafeId);

    console.log("Seed complete: businesses/products are ready.");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  }
}

seed();
