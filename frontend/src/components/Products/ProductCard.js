function ProductCard({ product, onBuy, businessId }) {
  return (
    <div style={{
      background: "#fafafa",
      borderRadius: "12px",
      padding: "12px",
      border: "1px solid #eee",
      transition: "0.2s"
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      <h4>{product.name}</h4>
      <p style={{ fontWeight: "bold" }}>₹{product.price}</p>

      <button
        onClick={() => onBuy(businessId, product)}
        style={{
          width: "100%",
          padding: "6px",
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "6px"
        }}
      >
        Buy
      </button>
    </div>
  );
}

export default ProductCard;