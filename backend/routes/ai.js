const express = require("express");
const router = express.Router();
const { getRecommendation } = require("../services/aiService");

router.post("/recommend", async (req, res) => {
  try {
    const { businesses } = req.body || {};

    if (!Array.isArray(businesses) || businesses.length === 0) {
      return res.status(400).json({
        error: "Invalid payload. Send { businesses: [...] }",
      });
    }

    const recommendation = await getRecommendation(businesses);

    res.json({ recommendation });
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

module.exports = router;