import React from "react";

function InvestmentInsights({
  loading,
  error,
  investmentCount,
  lastInvestedBusinessName,
  nextRecommendedBusinessName,
  nextRecommendation,
  trendingBusinessName,
  trendingText,
}) {
  if (investmentCount < 1) {
    return null;
  }

  const forYouTitle = lastInvestedBusinessName && nextRecommendedBusinessName
    ? `Since you invested in ${lastInvestedBusinessName}, we recommend ${nextRecommendedBusinessName}.`
    : nextRecommendedBusinessName
    ? `We recommend ${nextRecommendedBusinessName} for your next move.`
    : "We found a next-step opportunity based on your investment pattern.";

  const trendingTitle = trendingBusinessName
    ? `${trendingBusinessName} is the most popular investment right now.`
    : "Most popular investment right now.";

  return (
    <section className="insights-board" aria-label="Personalized investment insights">
      <div className="insights-board__head">
        <span className="eyebrow">Personalized Signals</span>
        <h2 className="insights-board__title">Your Next Move</h2>
      </div>

      <div className="insights-grid">
        <article className="insight-tile insight-tile--for-you">
          <span className="insight-tile__label">For You</span>

          {loading ? (
            <p className="insight-tile__text">Analyzing your investment history...</p>
          ) : error ? (
            <p className="insight-tile__error">{error}</p>
          ) : (
            <>
              <p className="insight-tile__headline">{forYouTitle}</p>
              {nextRecommendation ? (
                <p className="insight-tile__text">{nextRecommendation}</p>
              ) : (
                <p className="insight-tile__text">Keep investing to sharpen this recommendation.</p>
              )}
            </>
          )}
        </article>

        <article className="insight-tile insight-tile--trending">
          <span className="insight-tile__label">Trending</span>
          <p className="insight-tile__headline">{trendingTitle}</p>
          <p className="insight-tile__text">
            {trendingText || "AI sees strong current momentum for this business."}
          </p>
        </article>
      </div>
    </section>
  );
}

export default InvestmentInsights;
