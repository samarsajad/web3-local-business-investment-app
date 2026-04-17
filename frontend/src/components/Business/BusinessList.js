import BusinessCard from "./BusinessCard";

{businesses.map((biz) => (
  <BusinessCard
    key={biz.id}
    business={biz}
    products={products[biz.id]}
    onInvest={invest}
    onBuy={handlePurchase}
  />
))}