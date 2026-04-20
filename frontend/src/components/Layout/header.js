function Header({ balance, user, account }) {
  const balanceLabel = Number(balance) > 0 ? Number(balance).toFixed(2) : "0.00";
  const accountLabel = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "Wallet not connected";
  const userLabel = user?.displayName || user?.email || "Community investor";

  return (
    <section className="hero-banner" id="overview">
      <div className="hero-copy">
        <span className="eyebrow">Local business finance hub</span>
        <h1>Invest in local businesses with a dashboard that feels current and clear.</h1>
        <p>
          Track reward tokens, compare AI recommendations, and complete purchases with
          a secure NFT minting flow.
        </p>

        <div className="hero-pills">
          <span className="hero-pill">Signed in as {userLabel}</span>
          <span className="hero-pill">{accountLabel}</span>
        </div>
      </div>

      <div className="hero-metrics">
        <div className="hero-metric">
          <span>Reward balance</span>
          <strong>{balanceLabel} LRT</strong>
        </div>
        <div className="hero-metric">
          <span>Live mode</span>
          <strong>On-chain + Firestore</strong>
        </div>
        <div className="hero-metric">
          <span>Purchase flow</span>
          <strong>Backend verified NFT minting</strong>
        </div>
      </div>
    </section>
  );
}

export default Header;