function Header({ balance, user, account }) {
  const balanceLabel = Number(balance) > 0 ? Number(balance).toFixed(2) : "0.00";
  const accountLabel = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "Wallet not connected";
  const userLabel = user?.displayName || user?.email || "Community investor";

  return (
    <section className="hero-banner" id="overview">
      <div className="hero-content">
        <div className="hero-copy">
          <span className="eyebrow">Local business finance hub</span>
          <h1>Invest in local businesses with a dashboard that feels current and clear.</h1>
          <p>
            Discover promising businesses, make confident investments, and unlock better
            value when you shop from the same local marketplace.
          </p>

          <div className="hero-pills">
            <span className="hero-pill">Signed in as {userLabel}</span>
            <span className="hero-pill">{accountLabel}</span>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <span>Your rewards</span>
            <strong>{balanceLabel} points available</strong>
          </div>
          <div className="hero-metric">
            <span>Best opportunity</span>
            <strong>AI highlights top local picks</strong>
          </div>
          <div className="hero-metric">
            <span>Neighborhood discovery</span>
            <strong>Map links for every business</strong>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <img
          className="hero-visual__image"
          src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80"
          alt="People reviewing investment charts in a modern workspace"
        />
      </div>
    </section>
  );
}

export default Header;