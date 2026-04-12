function Header({ balance }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px"
    }}>
      <h2>Local Economy</h2>

      <div style={{
        background: "#fff",
        padding: "8px 12px",
        borderRadius: "10px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
      }}>
        💰 {balance} LRT
      </div>
    </div>
  );
}

export default Header;