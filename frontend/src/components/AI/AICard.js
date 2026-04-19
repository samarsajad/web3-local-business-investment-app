import React from "react";

function AICard({
  recommendation,
  loading,
  error,
  recommendedBusinessName,
  modelInfo,
  topBreakdown,
}) {
  const factorRows = topBreakdown
    ? Object.entries(topBreakdown)
        .filter(([key]) => key !== "weightedScore")
        .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div
      style={{
        background: "#0f172a",
        color: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
      }}
    >
      <h2> AI Recommendation</h2>

      {loading ? (
        <p>Analyzing businesses...</p>
      ) : error ? (
        <p style={{ color: "#fca5a5" }}>{error}</p>
      ) : recommendation ? (
        <>
          {recommendedBusinessName ? (
            <p style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Recommended: {recommendedBusinessName}
            </p>
          ) : null}

          <p style={{ marginTop: 0 }}>{recommendation}</p>

          {modelInfo?.type ? (
            <p style={{ marginBottom: "6px", color: "#93c5fd", fontSize: "13px" }}>
              Model: {modelInfo.type}
            </p>
          ) : null}

          {modelInfo?.weights ? (
            <p style={{ marginTop: 0, marginBottom: "8px", color: "#cbd5e1", fontSize: "13px" }}>
              Weights: marketDemand {modelInfo.weights.marketDemand}, financialHealth {modelInfo.weights.financialHealth}, growthMomentum {modelInfo.weights.growthMomentum}, riskResilience {modelInfo.weights.riskResilience}, capitalEfficiency {modelInfo.weights.capitalEfficiency}, traction {modelInfo.weights.traction}
            </p>
          ) : null}

          {factorRows.length > 0 ? (
            <div>
              <p style={{ marginBottom: "6px", fontWeight: 600 }}>Score Breakdown</p>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {factorRows.map(([factor, value]) => (
                  <li key={factor} style={{ marginBottom: "4px" }}>
                    {factor}: {Number(value).toFixed(2)}
                  </li>
                ))}
              </ul>
              {Number.isFinite(topBreakdown.weightedScore) ? (
                <p style={{ marginTop: "8px", marginBottom: 0 }}>
                  Final Weighted Score: {Number(topBreakdown.weightedScore).toFixed(2)}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <p>No recommendation yet.</p>
      )}
    </div>
  );
}

export default AICard;