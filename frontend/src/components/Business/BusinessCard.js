import ProductCard from "../Products/ProductCard";

function BusinessCard({ business, products, onInvest, onBuy, isRecommended }) {
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

      {/* 🔥 INVEST BUTTON */}
      <button
        onClick={onInvest}
        style={{
          padding: "8px 14px",
          background: isRecommended ? "#22c55e" : "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "8px",
          marginTop: "10px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Invest
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