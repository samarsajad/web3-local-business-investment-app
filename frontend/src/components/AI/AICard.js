import React from "react";

function AICard({
  recommendation,
  loading,
  error,
  recommendedBusinessName,
}) {
  return (
    <section className="ai-card">
      <div className="ai-card__head">
        <span className="eyebrow">Smart Assist</span>
        <h2 className="ai-card__title">AI Recommendation</h2>
      </div>

      {loading ? (
        <p className="ai-card__text">Analyzing businesses...</p>
      ) : error ? (
        <p className="ai-card__error">{error}</p>
      ) : recommendation ? (
        <>
          {recommendedBusinessName ? (
            <p className="ai-card__pick">
              Recommended: {recommendedBusinessName}
            </p>
          ) : null}

          <p className="ai-card__text">{recommendation}</p>
        </>
      ) : (
        <p className="ai-card__text">No recommendation yet.</p>
      )}
    </section>
  );
}

export default AICard;