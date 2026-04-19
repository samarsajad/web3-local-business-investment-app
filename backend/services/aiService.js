const { GoogleGenerativeAI } = require("@google/generative-ai");

const SCORE_WEIGHTS = {
  marketDemand: 0.25,
  financialHealth: 0.25,
  growthMomentum: 0.2,
  riskResilience: 0.15,
  capitalEfficiency: 0.1,
  traction: 0.05,
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
    .slice(0, 3)
    .map(([key, value]) => `${key} (${value})`)
    .join(", ");

  return `${topBusiness.name} ranks highest with a weighted score of ${topBusiness.score}. Top drivers: ${topFactors}.`;
}

async function generateLLMExplanation(topBusiness, rankedBusinesses) {
  if (!genAI) {
    return buildFallbackExplanation(topBusiness);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
You are an investment analyst.
Use the weighted model scores exactly as factual inputs.

Top business:
${JSON.stringify(topBusiness, null, 2)}

Top 3 ranked businesses:
${JSON.stringify(rankedBusinesses.slice(0, 3), null, 2)}

Write a concise 2-3 line recommendation.
Mention the top 2 scoring factors and include one caution.
Do not invent numbers.
`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();
    return text || buildFallbackExplanation(topBusiness);
  } catch (error) {
    console.error("AI explanation fallback:", error?.message || error);
    return buildFallbackExplanation(topBusiness);
  }
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

module.exports = { getRecommendation };