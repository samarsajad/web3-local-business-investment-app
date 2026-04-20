import ProductCard from "../Products/ProductCard";

function BusinessCard({ business, products, onInvest, onBuy, isRecommended, canInvest }) {
  const fundingGoal = Number(business.fundingGoal || 0);
  const raisedFunds = Number(
    business.totalFundsEth ??
      (typeof business.totalFunds === "number" ? business.totalFunds : 0)
  );

  const safeGoal = fundingGoal > 0 ? fundingGoal : 1;
  const progress = Math.min((raisedFunds / safeGoal) * 100, 100);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: isRecommended
          ? "0 6px 20px rgba(34,197,94,0.25)"  
          : "0 4px 12px rgba(0,0,0,0.05)",
        border: isRecommended ? "2px solid #22c55e" : "none",
        transition: "0.3s ease",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>{business.name}</h2>

        {isRecommended && (
          <span
            style={{
              background: "#22c55e",
              color: "white",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            ⭐ AI Recommended
          </span>
        )}
      </div>

      <p style={{ color: "#666" }}>{business.description}</p>

      <div
        style={{
          marginTop: "12px",
          padding: "12px",
          borderRadius: "10px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            fontSize: "13px",
            color: "#334155",
            fontWeight: 600,
          }}
        >
          <span>Funding Progress</span>
          <span>
            {raisedFunds.toFixed(2)} / {fundingGoal.toFixed(2)} ETH
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: "8px",
            borderRadius: "999px",
            background: "#e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: "999px",
              background: "linear-gradient(90deg, #22c55e, #16a34a)",
              transition: "width 0.35s ease",
            }}
          />
        </div>
      </div>

      {/* 🔥 INVEST BUTTON */}
      <button
        onClick={onInvest}
        disabled={!canInvest}
        style={{
          padding: "8px 14px",
          background: !canInvest
            ? "#94a3b8"
            : isRecommended
            ? "#22c55e"
            : "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "8px",
          marginTop: "10px",
          cursor: canInvest ? "pointer" : "not-allowed",
          fontWeight: "bold",
          opacity: canInvest ? 1 : 0.8,
        }}
      >
        {canInvest ? "Invest" : "Login to invest"}
      </button>

      {/* 🔥 PRODUCTS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "15px",
          marginTop: "15px",
        }}
      >
        {products?.map((product, i) => (
          <ProductCard
            key={i}
            product={product}
            businessId={business.id}
            onBuy={onBuy}
          />
        ))}
      </div>
    </div>
  );
}

export default BusinessCard;