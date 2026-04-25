const fs = require("fs");
const path = require("path");

const firebaseConfig = {
  apiKey: "AIzaSyAH4xit6_noco0Jynve-oC2JW1ysqVhPd4",
  authDomain: "blockchain-local-economy-app.firebaseapp.com",
  projectId: "blockchain-local-economy-app",
  storageBucket: "blockchain-local-economy-app.firebasestorage.app",
  messagingSenderId: "396522366570",
  appId: "1:396522366570:web:7e131a9acdb7b5e5cf8c13",
  measurementId: "G-R9VD2LQK1C",
};

function loadEnvFiles() {
  const env = {};
  const envPaths = [
    path.resolve(__dirname, "..", "blockchain", ".env"),
    path.resolve(__dirname, ".env.production"),
    path.resolve(__dirname, ".env.local"),
  ];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^"|"$/g, "");
      if (!(key in env)) {
        env[key] = value;
      }
    }
  }

  return env;
}

async function syncBusinessesOnChain(businessesForSync) {
  const { ethers } = await import("ethers");

  const fileEnv = loadEnvFiles();
  const rpcUrl = process.env.RPC_URL || fileEnv.RPC_URL || fileEnv.RPC_URl;
  const privateKey = process.env.PRIVATE_KEY || fileEnv.PRIVATE_KEY;
  const contractAddress =
    process.env.REACT_APP_CONTRACT_ADDRESS ||
    fileEnv.REACT_APP_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    console.warn(
      "Skipping on-chain sync. Missing RPC_URL, PRIVATE_KEY, or REACT_APP_CONTRACT_ADDRESS."
    );
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const investmentAbi = [
    "function businessCount() view returns (uint256)",
    "function businesses(uint256) view returns (string name, uint256 fundingGoal, uint256 totalFunds)",
    "function createBusiness(string _name, uint256 _goal)",
  ];
  const contract = new ethers.Contract(contractAddress, investmentAbi, wallet);

  const count = Number(await contract.businessCount());
  const onChainNames = new Set();
  for (let i = 1; i <= count; i += 1) {
    const business = await contract.businesses(i);
    onChainNames.add((business.name || "").trim().toLowerCase());
  }

  let created = 0;
  for (const biz of businessesForSync) {
    const normalizedName = (biz.name || "").trim().toLowerCase();
    if (!normalizedName || onChainNames.has(normalizedName)) {
      continue;
    }

    const tx = await contract.createBusiness(
      biz.name,
      Number(biz.fundingGoal || 1000)
    );
    await tx.wait();
    onChainNames.add(normalizedName);
    created += 1;
  }

  console.log(`On-chain business sync complete. Added ${created} new businesses.`);
}

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
  const businessesForSync = [];

  const upsertBusiness = async (
    name,
    description,
    fundingGoal,
    location,
    imageUrl,
    category
  ) => {
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
          imageUrl,
          category,
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
      imageUrl,
      category,
    });
    return ref.id;
  };

  const upsertProduct = async (name, price, businessId, imageUrl) => {
    const q = query(
      collection(db, "products"),
      where("name", "==", name),
      where("businessId", "==", businessId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const existing = snap.docs[0];
      await setDoc(
        doc(db, "products", existing.id),
        {
          name,
          price,
          businessId,
          imageUrl,
        },
        { merge: true }
      );
      return;
    }

    await addDoc(collection(db, "products"), {
      name,
      price,
      businessId,
      imageUrl,
    });
  };

  try {
  const bakeryId = await upsertBusiness(
    "Local Bakery",
    "Fresh bread & cakes",
    100000,
    "MG Road, Bengaluru",
    "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=80",
    "food"
  );
  businessesForSync.push({ name: "Local Bakery", fundingGoal: 100000 });

  const cafeId = await upsertBusiness(
    "Local Cafe",
    "Coffee & snacks",
    120000,
    "Koramangala, Bengaluru",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    "food"
  );
  businessesForSync.push({ name: "Local Cafe", fundingGoal: 120000 });

  // NEW BUSINESSES
  const groceryId = await upsertBusiness(
    "Green Grocery",
    "Fresh fruits and vegetables",
    150000,
    "Indiranagar, Bengaluru",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    "retail"
  );
  businessesForSync.push({ name: "Green Grocery", fundingGoal: 150000 });

  const bookstoreId = await upsertBusiness(
    "City Bookstore",
    "Books and stationery",
    80000,
    "Jayanagar, Bengaluru",
    "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=1200&q=80",
    "education"
  );
  businessesForSync.push({ name: "City Bookstore", fundingGoal: 80000 });

 

  const clothingId = await upsertBusiness(
    "Trendy Clothes",
    "Fashion and apparel",
    1800,
    "Brigade Road, Bengaluru",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
    "retail"
  );
  businessesForSync.push({ name: "Trendy Clothes", fundingGoal: 1800 });

  const restaurantId = await upsertBusiness(
    "Family Restaurant",
    "Home-style meals",
    250000,
    "BTM Layout, Bengaluru",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    "food"
  );
  businessesForSync.push({ name: "Family Restaurant", fundingGoal: 250000 });

  

  // PRODUCTS
  await upsertProduct(
    "Chocolate Cake",
    200,
    bakeryId,
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80"
  );
  await upsertProduct(
    "Croissant",
    80,
    bakeryId,
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80"
  );
  await upsertProduct(
    "Cold Coffee",
    120,
    cafeId,
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80"
  );

  await upsertProduct(
    "Apples",
    100,
    groceryId,
    "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=900&q=80"
  );
  await upsertProduct(
    "Bananas",
    60,
    groceryId,
    "https://images.unsplash.com/photo-1574226516831-e1dff420e37f?auto=format&fit=crop&w=900&q=80"
  );

  await upsertProduct(
    "Notebook",
    50,
    bookstoreId,
    "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80"
  );
  await upsertProduct(
    "Pen Pack",
    30,
    bookstoreId,
    "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=80"
  );

  await upsertProduct(
    "T-Shirt",
    400,
    clothingId,
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
  );
  await upsertProduct(
    "Jeans",
    1200,
    clothingId,
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80"
  );

  await upsertProduct(
    "Thali",
    250,
    restaurantId,
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
  );
  await upsertProduct(
    "Biryani",
    300,
    restaurantId,
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=80"
  );

  await syncBusinessesOnChain(businessesForSync);

  console.log("Seed complete");
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
}
}

seed();
