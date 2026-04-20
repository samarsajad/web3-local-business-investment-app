import ProductCard from "../Products/ProductCard";
import { Link } from "react-router-dom";

function BusinessCard({
  business,
  products,
  onInvest,
  onBuy,
  isRecommended,
  canInvest,
  showProducts = true,
}) {
  const fundingGoal = Number(business.fundingGoal || 0);
  const raisedFunds = Number(
    business.totalFundsEth ??
      (typeof business.totalFunds === "number" ? business.totalFunds : 0)
  );
  const locationText = business.location || `${business.name} local business`;
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    locationText
  )}`;

  const safeGoal = fundingGoal > 0 ? fundingGoal : 1;
  const progress = Math.min((raisedFunds / safeGoal) * 100, 100);

  return (
    <article className={`business-card ${isRecommended ? "business-card--featured" : ""}`.trim()}>
      <div className="business-card__header">
        <Link
          to={`/business/${encodeURIComponent(business.docId || business.id)}`}
          className="business-card__title-link"
        >
          <h2 className="business-card__title">{business.name}</h2>
        </Link>

        {isRecommended && (
          <span className="business-card__badge">AI Recommended</span>
        )}
      </div>

      <p className="business-card__description">{business.description}</p>

      <div className="business-card__location">
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${business.name} location in Google Maps`}
          title="Open in Google Maps"
          className="business-card__location-icon"
        >
          📍
        </a>
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="business-card__location-link"
        >
          {locationText}
        </a>
      </div>

      <div className="business-card__funding">
        <div className="business-card__funding-head">
          <span>Funding Progress</span>
          <span>
            {raisedFunds.toFixed(2)} / {fundingGoal.toFixed(2)} Rs
          </span>
        </div>

        <div className="business-card__funding-track">
          <div
            className="business-card__funding-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <button
        onClick={onInvest}
        disabled={!canInvest}
        className={`business-card__invest ${isRecommended ? "business-card__invest--featured" : ""}`.trim()}
      >
        {canInvest ? "Invest" : "Login to invest"}
      </button>

      {showProducts && (
        <div className="business-card__products">
          {products?.map((product, i) => (
            <ProductCard
              key={i}
              product={product}
              businessId={business.id}
              onBuy={onBuy}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export default BusinessCard;