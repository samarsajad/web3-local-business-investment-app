function ProductCard({ product, onBuy, businessId }) {
  return (
    <article className="product-card">
      <h4 className="product-card__name">{product.name}</h4>
      <p className="product-card__price">Rs {product.price}</p>

      <button
        onClick={() => onBuy(businessId, product)}
        className="product-card__buy"
      >
        Buy
      </button>
    </article>
  );
}

export default ProductCard;