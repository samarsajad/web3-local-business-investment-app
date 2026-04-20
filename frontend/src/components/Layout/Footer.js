function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="container-wide footer-grid">
        <div>
          <div className="footer-brand">Community Local Economy</div>
          <p>
            A modern investment dashboard for local businesses, reward tokens, and verified NFT purchases.
          </p>
        </div>

        <div>
          <h3>Platform</h3>
          <a href="#overview">Overview</a>
          <a href="#businesses">Marketplace</a>
          <a href="#top">Back to top</a>
        </div>

        <div>
          <h3>Build</h3>
          <p>Wallet connection, Firebase auth, and on-chain investment flows.</p>
          <p>Designed for a clean, responsive local-first experience.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
