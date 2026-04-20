import Login from "../Login";

function Navbar({ user, account, setUser, onConnectWallet, onLogout }) {
  const accountLabel = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : user
    ? "Connect wallet"
    : "Login to connect";

  return (
    <header className="site-header" id="top">
      <div className="navbar container-wide">
        <a className="brand" href="#top" aria-label="Community Local Economy home">
          <span className="brand-mark">LE</span>
          <span className="brand-copy">
            <strong>Community Local Economy</strong>
            <span>Invest locally with web3 rails</span>
          </span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          <a href="#overview">Overview</a>
          <a href="#businesses">Businesses</a>
          <a href="#footer">Contact</a>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className={`nav-chip ${!user ? "nav-chip--disabled" : ""}`.trim()}
            onClick={onConnectWallet}
            disabled={!user}
          >
            <span className="nav-chip__label">Wallet</span>
            <span className="nav-chip__value">{accountLabel}</span>
          </button>

          {user ? (
            <button
              type="button"
              className="nav-auth-button nav-auth-button--ghost"
              onClick={onLogout}
            >
              Sign out
            </button>
          ) : (
            <Login setUser={setUser} className="nav-auth-button" />
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
