import ProductCard from "../Products/ProductCard";

function BusinessCard({ business, products, onInvest, onBuy }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
    }}>
      <h2>{business.name}</h2>
      <p style={{ color: "#666" }}>{business.description}</p>

      <button
        onClick={onInvest}
        style={{
          padding: "8px 14px",
          background: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "8px",
          marginTop: "10px"
        }}
      >
        Invest
      </button>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "15px",
        marginTop: "15px"
      }}>
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