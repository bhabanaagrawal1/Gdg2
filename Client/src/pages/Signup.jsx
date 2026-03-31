import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import app from "../config/firebase";

const API_URL = import.meta.env.VITE_API_URL;

const Signup = () => {
  const navigate = useNavigate();

  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  //toggle state
  const [isSignup, setIsSignup] = useState(true);

  // common states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //GOOGLE AUTH (same for both)
  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      //Get Firebase ID token
      const token = await user.getIdToken();

      const res = await axios.post(
        `${API_URL}/api/auth/google`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        },
      );

      localStorage.setItem("token", res.data.accessToken);

      toast.success("Logged in with Google");
      navigate("/home");
    } catch (error) {
      console.error(error);
      toast.error("Google login failed");
    }
  };

  //EMAIL SIGNUP (OTP FLOW)
  const handleSignup = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/api/otp/sendotp`,
        {
          username,
          email,
          password,
        },
        { withCredentials: true },
      );

      toast.success(res.data.message || "OTP sent successfully");

      localStorage.setItem("email", email);

      navigate("/verifyotp");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    }
  };

  //LOGIN (NORMAL LOGIN)
  const handleLogin = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email,
          password,
        },
        { withCredentials: true },
      );

      toast.success(res.data.message || "Login successful");

      // store token if backend gives
      localStorage.setItem("token", res.data.accessToken);

      navigate("/home");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div>
      {/*TOGGLE BUTTON */}
      <button onClick={() => setIsSignup(!isSignup)}>
        {isSignup ? "Switch to Login" : "Switch to Signup"}
      </button>

      <h2>{isSignup ? "Signup" : "Login"}</h2>

      {/*Username only for signup */}
      {isSignup && (
        <>
          <input
            type="text"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />
          <br />
        </>
      )}

      {/*Email */}
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      {/*Password */}
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      {/*BUTTON BASED ON MODE */}
      {isSignup ? (
        <button onClick={handleSignup}>Verify Email</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}

      <div>OR</div>

      {/*GOOGLE AUTH */}
      <button onClick={handleGoogleAuth}>Continue with Google</button>
    </div>
  );
};

export default Signup;
