import ProductCard from "../Products/ProductCard";
import { Link } from "react-router-dom";
import { HiOutlineLocationMarker } from "react-icons/hi";

const ETH_TO_INR_RATE = Number(process.env.REACT_APP_ETH_TO_INR || 300000);

function formatInr(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(value) || 0));
}

function BusinessCard({
  business,
  products,
  onInvest,
  onBuy,
  isRecommended,
  canInvest,
  showProducts = true,
}) {
  const fundingGoalRs = Number(business.fundingGoalRs ?? business.fundingGoal ?? 0);
  const raisedFundsEth = Number(
    business.totalFundsEth ??
      (typeof business.totalFunds === "number" ? business.totalFunds : 0)
  );
  const raisedFundsRs = raisedFundsEth * ETH_TO_INR_RATE;
  const locationText = business.location || `${business.name} local business`;
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(locationText)}`;
  const imageUrl =
    business.imageUrl ||
    `https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80&sig=${encodeURIComponent(
      business.name || "local-business"
    )}`;

  const safeGoal = fundingGoalRs > 0 ? fundingGoalRs : 1;
  const progress = Math.min((raisedFundsRs / safeGoal) * 100, 100);

  return (
    <article className={`business-card ${isRecommended ? "business-card--featured" : ""}`.trim()}>
      <div className="business-card__content">
        <div className="business-card__copy">
          <div className="business-card__header">
            <Link
              to={`/business/${encodeURIComponent(business.docId || business.id)}`}
              className="business-card__title-link"
            >
              <h2 className="business-card__title">{business.name}</h2>
            </Link>

            {isRecommended && <span className="business-card__badge">AI Recommended</span>}
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
  <HiOutlineLocationMarker size={20} />
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
                Rs {formatInr(raisedFundsRs)} / Rs {formatInr(fundingGoalRs)}
              </span>
            </div>

           

            <div className="business-card__funding-track">
              <div className="business-card__funding-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <button
            onClick={onInvest}
            disabled={!canInvest}
            className={`business-card__invest ${isRecommended ? "business-card__invest--featured" : ""}`.trim()}
          >
            {canInvest ? "Invest" : "Login to invest"}
          </button>
        </div>

        <div className="business-card__media">
          <img className="business-card__image" src={imageUrl} alt={`${business.name} preview`} />
        </div>
      </div>

      {showProducts && (
        <div className="business-card__products">
          {products?.map((product, i) => (
            <ProductCard key={i} product={product} businessId={business.id} onBuy={onBuy} />
          ))}
        </div>
      )}
    </article>
  );
}

export default BusinessCard;