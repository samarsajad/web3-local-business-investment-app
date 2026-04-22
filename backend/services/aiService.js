const { GoogleGenerativeAI } = require("@google/generative-ai");

const SCORE_WEIGHTS = {
  marketDemand: 0.25,
  financialHealth: 0.25,
  growthMomentum: 0.2,
  riskResilience: 0.15,
  capitalEfficiency: 0.1,
  traction: 0.05,
};

const PERSONALIZED_WEIGHTS = {
  baseQuality: 0.6,
  preferenceAffinity: 0.25,
  diversificationBoost: 0.15,
};

const FIELD_ALIASES = {
  demandScore: ["demandScore", "marketDemand", "demand", "customerDemand"],
  customerRating: ["rating", "customerRating", "reviewRating"],
  monthlyRevenue: ["monthlyRevenue", "revenue", "avgMonthlyRevenue"],
  profitMargin: ["profitMargin", "margin", "grossMargin"],
  growthRate: ["growthRate", "monthlyGrowthRate", "growth"],
  repeatCustomerRate: ["repeatCustomerRate", "retentionRate", "repeatRate"],
  riskScore: ["riskScore", "risk", "volatilityScore"],
  yearsInBusiness: ["yearsInBusiness", "years", "operatingYears"],
  fundingGoal: ["fundingGoal", "capitalRequired", "targetFunding"],
  monthlyCustomers: ["monthlyCustomers", "customersPerMonth", "customerCount"],
  ordersPerMonth: ["ordersPerMonth", "monthlyOrders", "orderVolume"],
  unitEconomicsScore: ["unitEconomicsScore", "economicsScore", "efficiencyScore"],
};

const genAI = process.env.GOOGLE_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

const AI_MODEL_CANDIDATES = String(
  process.env.GEMINI_MODELS || "gemini-2.5-flash,gemini-1.5-flash"
)
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

const AI_MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 2);
const AI_RETRY_BASE_MS = Number(process.env.AI_RETRY_BASE_MS || 350);
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getErrorStatusCode(error) {
  const directStatus = Number(error?.status || error?.statusCode);
  if (Number.isFinite(directStatus) && directStatus > 0) {
    return directStatus;
  }

  const message = String(error?.message || "");
  const match = message.match(/\[(\d{3})\s/);
  if (match) {
    return Number(match[1]);
  }

  return 0;
}

function isRetryableError(error) {
  const status = getErrorStatusCode(error);
  if (RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("tempor")
  );
}

function summarizeError(error) {
  const status = getErrorStatusCode(error);
  const message = String(error?.message || error || "Unknown AI error");
  return status ? `[${status}] ${message}` : message;
}

async function generateWithRetry(modelName, prompt) {
  const model = genAI.getGenerativeModel({ model: modelName });

  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.();
      if (text) {
        return text;
      }

      throw new Error(`Model ${modelName} returned an empty response`);
    } catch (error) {
      const hasMoreAttempts = attempt < AI_MAX_RETRIES;
      if (!isRetryableError(error) || !hasMoreAttempts) {
        throw error;
      }

      const backoff = AI_RETRY_BASE_MS * 2 ** attempt;
      const jitter = Math.floor(Math.random() * 150);
      await wait(backoff + jitter);
    }
  }

  throw new Error(`Model ${modelName} did not return a response`);
}

function clamp(value, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalize(value, min, max) {
  if (!Number.isFinite(value) || max <= min) return 50;
  const ratio = (value - min) / (max - min);
  return clamp(ratio * 100);
}

function scalePercent(value) {
  if (!Number.isFinite(value)) return null;
  if (value <= 1 && value >= -1) return value * 100;
  return value;
}

function pickNumeric(source, aliases) {
  for (const key of aliases) {
    const value = Number(source?.[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function keywordDemandScore(description) {
  const text = String(description || "").toLowerCase();
  if (!text) return 50;

  const positives = [
    "subscription",
    "healthy",
    "organic",
    "delivery",
    "community",
    "daily",
    "repeat",
    "popular",
    "trusted",
    "local",
  ];

  let hits = 0;
  positives.forEach((word) => {
    if (text.includes(word)) hits += 1;
  });

  return clamp(45 + hits * 6);
}

function calcScores(business, relatedProducts) {
  const demandScore = pickNumeric(business, FIELD_ALIASES.demandScore);
  const customerRating = pickNumeric(business, FIELD_ALIASES.customerRating);
  const monthlyRevenue = pickNumeric(business, FIELD_ALIASES.monthlyRevenue);
  const profitMargin = pickNumeric(business, FIELD_ALIASES.profitMargin);
  const growthRate = scalePercent(pickNumeric(business, FIELD_ALIASES.growthRate));
  const repeatCustomerRate = scalePercent(
    pickNumeric(business, FIELD_ALIASES.repeatCustomerRate)
  );
  const riskScore = pickNumeric(business, FIELD_ALIASES.riskScore);
  const yearsInBusiness = pickNumeric(business, FIELD_ALIASES.yearsInBusiness);
  const fundingGoal = pickNumeric(business, FIELD_ALIASES.fundingGoal);
  const monthlyCustomers = pickNumeric(business, FIELD_ALIASES.monthlyCustomers);
  const ordersPerMonth = pickNumeric(business, FIELD_ALIASES.ordersPerMonth);
  const unitEconomicsScore = pickNumeric(business, FIELD_ALIASES.unitEconomicsScore);
  const productCount = Array.isArray(relatedProducts) ? relatedProducts.length : 0;

  const marketDemand = clamp(
    [
      demandScore,
      customerRating !== null ? customerRating * 20 : null,
      monthlyCustomers !== null ? normalize(monthlyCustomers, 50, 3000) : null,
      keywordDemandScore(business?.description),
    ].filter((v) => Number.isFinite(v)).reduce((a, b, _, arr) => a + b / arr.length, 0)
  );

  const financialHealth = clamp(
    [
      monthlyRevenue !== null ? normalize(monthlyRevenue, 20000, 800000) : null,
      profitMargin !== null ? clamp(scalePercent(profitMargin), -20, 60) + 25 : null,
      unitEconomicsScore,
    ].filter((v) => Number.isFinite(v)).reduce((a, b, _, arr) => a + b / arr.length, 0) || 50
  );

  const growthMomentum = clamp(
    [
      growthRate !== null ? normalize(growthRate, -20, 80) : null,
      repeatCustomerRate !== null ? clamp(repeatCustomerRate) : null,
      ordersPerMonth !== null ? normalize(ordersPerMonth, 100, 6000) : null,
    ].filter((v) => Number.isFinite(v)).reduce((a, b, _, arr) => a + b / arr.length, 0) || 50
  );

  const riskResilience = clamp(
    [
      riskScore !== null ? 100 - clamp(riskScore) : null,
      yearsInBusiness !== null ? normalize(yearsInBusiness, 0, 15) : null,
      productCount > 0 ? normalize(productCount, 1, 12) : null,
    ].filter((v) => Number.isFinite(v)).reduce((a, b, _, arr) => a + b / arr.length, 0) || 50
  );

  const capitalEfficiency = clamp(
    [
      fundingGoal !== null ? 100 - normalize(fundingGoal, 500, 100000) : null,
      unitEconomicsScore,
      monthlyRevenue !== null && fundingGoal !== null && fundingGoal > 0
        ? clamp((monthlyRevenue / fundingGoal) * 25)
        : null,
    ].filter((v) => Number.isFinite(v)).reduce((a, b, _, arr) => a + b / arr.length, 0) || 50
  );

  const traction = clamp(
    [
      monthlyCustomers !== null ? normalize(monthlyCustomers, 50, 3000) : null,
      ordersPerMonth !== null ? normalize(ordersPerMonth, 100, 6000) : null,
      productCount > 0 ? normalize(productCount, 1, 12) : null,
    ].filter((v) => Number.isFinite(v)).reduce((a, b, _, arr) => a + b / arr.length, 0) || 50
  );

  const weightedScore = clamp(
    marketDemand * SCORE_WEIGHTS.marketDemand +
      financialHealth * SCORE_WEIGHTS.financialHealth +
      growthMomentum * SCORE_WEIGHTS.growthMomentum +
      riskResilience * SCORE_WEIGHTS.riskResilience +
      capitalEfficiency * SCORE_WEIGHTS.capitalEfficiency +
      traction * SCORE_WEIGHTS.traction
  );

  return {
    marketDemand: Number(marketDemand.toFixed(2)),
    financialHealth: Number(financialHealth.toFixed(2)),
    growthMomentum: Number(growthMomentum.toFixed(2)),
    riskResilience: Number(riskResilience.toFixed(2)),
    capitalEfficiency: Number(capitalEfficiency.toFixed(2)),
    traction: Number(traction.toFixed(2)),
    weightedScore: Number(weightedScore.toFixed(2)),
  };
}

function buildFallbackExplanation(topBusiness) {
  const topFactors = Object.entries(topBusiness.breakdown)
    .filter(([key]) => key !== "weightedScore")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key)
    .join(" and ");

  return `Best pick right now: ${topBusiness.name}. Strongest factors: ${topFactors}.`;
}

async function generateLLMExplanation(topBusiness, rankedBusinesses) {
  if (!genAI) {
    return buildFallbackExplanation(topBusiness);
  }

  const prompt = `
You are a sharp, practical investment analyst evaluating local businesses for retail investors.

IMPORTANT RULES:
- Do NOT mention scores, weights, models, or technical calculations.
- Use natural business language (like an investor memo).
- Be persuasive but honest.
- Highlight BOTH strengths and risks.
- Do NOT invent numbers.

DATA:

Top business:
${JSON.stringify(topBusiness, null, 2)}

Top 3 businesses:
${JSON.stringify(rankedBusinesses.slice(0, 3), null, 2)}

TASK:

Write a short investment analysis (50 words) for the top business.

Structure:
1. Start with a clear recommendation (why this business stands out)
2. Explain key strengths using real business signals:
   - demand / customers
   - revenue / margins
   - growth / repeat customers
   - operational stability
3. Briefly compare it with others (optional but useful)
4. Mention 1–2 realistic risks (important)

Tone:
Confident, grounded, and practical — like explaining to a smart investor friend.

Avoid fluff. Focus on reasoning.
`;

  let lastError = null;

  for (const modelName of AI_MODEL_CANDIDATES) {
    try {
      return await generateWithRetry(modelName, prompt);
    } catch (error) {
      lastError = error;
    }
  }

  console.warn("AI explanation fallback:", summarizeError(lastError));
  return buildFallbackExplanation(topBusiness);
}

async function getRecommendation(businesses, productsByBusiness = {}) {
  if (!Array.isArray(businesses) || businesses.length === 0) {
    throw new Error("No businesses provided for scoring");
  }

  const rankedBusinesses = businesses
    .map((business) => {
      const relatedProducts =
        productsByBusiness?.[business.id] || productsByBusiness?.[business.docId] || [];
      const breakdown = calcScores(business, relatedProducts);

      return {
        id: business.id,
        docId: business.docId,
        name: business.name || "Unnamed Business",
        score: breakdown.weightedScore,
        breakdown,
      };
    })
    .sort((a, b) => b.score - a.score);

  const recommendedBusiness = rankedBusinesses[0];
  const explanation = await generateLLMExplanation(recommendedBusiness, rankedBusinesses);

  return {
    recommendation: explanation,
    model: {
      type: "weighted-scoring-v1",
      weights: SCORE_WEIGHTS,
    },
    recommendedBusiness,
    rankedBusinesses,
  };
}

function normalizeCategoryValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function inferCategories(business) {
  const categoryFields = [business?.category, business?.industry, business?.sector]
    .filter(Boolean)
    .map(normalizeCategoryValue)
    .filter(Boolean);

  const tags = Array.isArray(business?.tags)
    ? business.tags.map(normalizeCategoryValue).filter(Boolean)
    : [];

  const description = String(business?.description || "").toLowerCase();
  const keywordBuckets = [
    {
      tag: "food",
      keywords: ["cafe", "bakery", "food", "restaurant", "snack", "meal"],
    },
    {
      tag: "retail",
      keywords: ["shop", "store", "retail", "fashion", "clothing", "boutique"],
    },
    {
      tag: "services",
      keywords: ["service", "repair", "salon", "consult", "agency"],
    },
    {
      tag: "health",
      keywords: ["health", "fitness", "wellness", "gym", "care"],
    },
    {
      tag: "education",
      keywords: ["learning", "education", "training", "course", "academy"],
    },
  ];

  const inferred = keywordBuckets
    .filter((bucket) => bucket.keywords.some((word) => description.includes(word)))
    .map((bucket) => bucket.tag);

  return [...new Set([...categoryFields, ...tags, ...inferred])];
}

function getBusinessKey(business) {
  return String(
    business?.docId ||
      business?.businessDocId ||
      business?.id ||
      business?.businessId ||
      business?.name ||
      business?.businessName ||
      ""
  )
    .trim()
    .toLowerCase();
}

function computeBaseRankings(businesses, productsByBusiness = {}) {
  return businesses
    .map((business) => {
      const relatedProducts =
        productsByBusiness?.[business.id] || productsByBusiness?.[business.docId] || [];
      const breakdown = calcScores(business, relatedProducts);

      return {
        id: business.id,
        docId: business.docId,
        name: business.name || "Unnamed Business",
        score: breakdown.weightedScore,
        breakdown,
        categories: inferCategories(business),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildPreferenceProfile(userInvestments, businesses) {
  const businessesByKey = new Map(
    businesses.map((biz) => [getBusinessKey(biz), biz])
  );

  const categoryWeights = new Map();
  const businessCounts = new Map();

  userInvestments.forEach((investment) => {
    const key = getBusinessKey(investment);
    if (!key) return;

    businessCounts.set(key, (businessCounts.get(key) || 0) + 1);

    const matchedBusiness = businessesByKey.get(key);
    const fallbackBusinessLike = {
      category: investment?.businessCategory,
      tags: investment?.businessTags,
      description: investment?.businessDescription,
    };

    const categories = inferCategories(matchedBusiness || fallbackBusinessLike);
    categories.forEach((category) => {
      categoryWeights.set(category, (categoryWeights.get(category) || 0) + 1);
    });
  });

  return {
    categoryWeights,
    businessCounts,
    totalInvestments: userInvestments.length,
  };
}

function computePreferenceAffinity(categories, profile) {
  if (!categories.length || profile.totalInvestments === 0) {
    return 50;
  }

  const totalCategoryWeight = Array.from(profile.categoryWeights.values()).reduce(
    (sum, value) => sum + value,
    0
  );

  if (totalCategoryWeight === 0) {
    return 50;
  }

  const matchedWeight = categories.reduce(
    (sum, category) => sum + (profile.categoryWeights.get(category) || 0),
    0
  );

  return clamp((matchedWeight / totalCategoryWeight) * 100);
}

function computeDiversificationBoost(businessKey, categories, profile) {
  const investedInBusinessCount = profile.businessCounts.get(businessKey) || 0;
  const noveltyBusiness = investedInBusinessCount === 0 ? 100 : clamp(60 - investedInBusinessCount * 15, 10, 60);

  if (!categories.length) {
    return noveltyBusiness;
  }

  const seenCategories = categories.filter((category) =>
    profile.categoryWeights.has(category)
  ).length;
  const unseenRatio = 1 - seenCategories / categories.length;
  const noveltyCategory = clamp(unseenRatio * 100);

  return clamp((noveltyBusiness * 0.7) + (noveltyCategory * 0.3));
}

function buildPersonalizedFallback(topBusiness, userInvestments) {
  const priorCount = userInvestments.length;
  return `Based on your ${priorCount} prior investments, ${topBusiness.name} looks like the strongest next move with a healthy balance of quality and portfolio diversification.`;
}

async function generatePersonalizedLLMExplanation(
  topBusiness,
  rankedBusinesses,
  userInvestments
) {
  if (!genAI) {
    return buildPersonalizedFallback(topBusiness, userInvestments);
  }

  const recentHistory = userInvestments.slice(0, 5);
  const prompt = `
You are an investment co-pilot helping a user decide the NEXT local business to invest in.

Rules:
- Keep response under 70 words.
- Mention why this is a good "next" pick given prior investments.
- Mention one diversification or risk-management angle.
- Do not mention hidden scores, weights, or raw model internals.

User recent investments:
${JSON.stringify(recentHistory, null, 2)}

Top candidates:
${JSON.stringify(rankedBusinesses.slice(0, 3), null, 2)}

Write one concise recommendation paragraph.
`;

  let lastError = null;

  for (const modelName of AI_MODEL_CANDIDATES) {
    try {
      return await generateWithRetry(modelName, prompt);
    } catch (error) {
      lastError = error;
    }
  }

  console.warn("AI personalized explanation fallback:", summarizeError(lastError));
  return buildPersonalizedFallback(topBusiness, userInvestments);
}

async function getPersonalizedRecommendation(
  userInvestments,
  businesses,
  productsByBusiness = {}
) {
  if (!Array.isArray(userInvestments)) {
    throw new Error("userInvestments must be an array");
  }

  if (!Array.isArray(businesses) || businesses.length === 0) {
    throw new Error("No businesses provided for personalized scoring");
  }

  if (userInvestments.length === 0) {
    return getRecommendation(businesses, productsByBusiness);
  }

  const baseRanked = computeBaseRankings(businesses, productsByBusiness);
  const profile = buildPreferenceProfile(userInvestments, businesses);

  const rankedBusinesses = baseRanked
    .map((business) => {
      const businessKey = getBusinessKey(business);
      const preferenceAffinity = computePreferenceAffinity(
        business.categories,
        profile
      );
      const diversificationBoost = computeDiversificationBoost(
        businessKey,
        business.categories,
        profile
      );

      const personalizedScore = clamp(
        business.score * PERSONALIZED_WEIGHTS.baseQuality +
          preferenceAffinity * PERSONALIZED_WEIGHTS.preferenceAffinity +
          diversificationBoost * PERSONALIZED_WEIGHTS.diversificationBoost
      );

      return {
        ...business,
        score: Number(personalizedScore.toFixed(2)),
        personalization: {
          preferenceAffinity: Number(preferenceAffinity.toFixed(2)),
          diversificationBoost: Number(diversificationBoost.toFixed(2)),
        },
      };
    })
    .sort((a, b) => b.score - a.score);

  const recommendedBusiness = rankedBusinesses[0];
  const explanation = await generatePersonalizedLLMExplanation(
    recommendedBusiness,
    rankedBusinesses,
    userInvestments
  );

  return {
    recommendation: explanation,
    model: {
      type: "personalized-next-investment-v1",
      weights: PERSONALIZED_WEIGHTS,
      basedOnInvestments: userInvestments.length,
    },
    recommendedBusiness,
    rankedBusinesses,
  };
}

module.exports = { getRecommendation, getPersonalizedRecommendation };