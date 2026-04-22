const express = require("express");
const router = express.Router();
const {
  getRecommendation,
  getPersonalizedRecommendation,
} = require("../services/aiService");

router.post("/recommend", async (req, res) => {
  try {
    const { businesses, productsByBusiness } = req.body || {};

    if (!Array.isArray(businesses) || businesses.length === 0) {
      return res.status(400).json({
        error: "Invalid payload. Send { businesses: [...] }",
      });
    }

    const result = await getRecommendation(businesses, productsByBusiness || {});

    res.json(result);
  } catch (err) {
    console.error("AI ERROR:", err);
    const status = Number(err?.status) || 500;
    const message = String(err?.message || "AI failed");

    if (status === 429 || message.toLowerCase().includes("quota")) {
      return res.status(429).json({
        error: "AI quota exceeded",
        details: message,
      });
    }

    if (status === 401 || status === 403 || message.toLowerCase().includes("api key")) {
      return res.status(401).json({
        error: "AI authentication failed",
        details: message,
      });
    }

    res.status(status).json({ error: "AI failed", details: message });
  }
});

router.post("/personalized", async (req, res) => {
  try {
    const { userInvestments, businesses, productsByBusiness } = req.body || {};

    if (!Array.isArray(userInvestments)) {
      return res.status(400).json({
        error: "Invalid payload. Send { userInvestments: [...], businesses: [...] }",
      });
    }

    if (!Array.isArray(businesses) || businesses.length === 0) {
      return res.status(400).json({
        error: "Invalid payload. Send { businesses: [...] }",
      });
    }

    const result = await getPersonalizedRecommendation(
      userInvestments,
      businesses,
      productsByBusiness || {}
    );

    res.json(result);
  } catch (err) {
    console.error("AI PERSONALIZED ERROR:", err);
    const status = Number(err?.status) || 500;
    const message = String(err?.message || "AI personalized recommendation failed");
    res.status(status).json({ error: "AI failed", details: message });
  }
});

module.exports = router;