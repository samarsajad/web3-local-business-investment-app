import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

function Login({ setUser, className = "" }) {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
      });
      setUser(user);

      alert("Login successful!");
    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };

  return (
    <button
      type="button"
      className={`nav-auth-button ${className}`.trim()}
      onClick={handleLogin}
    >
      Login with Google
    </button>
  );
}

export default Login;