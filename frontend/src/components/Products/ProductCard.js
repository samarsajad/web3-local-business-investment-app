function ProductCard({ product, onBuy, businessId }) {
  const imageUrl =
    product?.imageUrl ||
    `https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80&sig=${encodeURIComponent(
      product?.name || "product"
    )}`;

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <img className="product-card__image" src={imageUrl} alt={product.name} />
      </div>
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