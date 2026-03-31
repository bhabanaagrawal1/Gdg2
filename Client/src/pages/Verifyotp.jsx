import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Verifyotp = () => {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const email = localStorage.getItem("email");

  if (!email) {
    toast.error("No email found. Signup again.");
    return;
  }
  const verifyOTP = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/api/otp/verifyotp`,
        {
          email,
          otp,
        },
        { withCredentials: true },
      );

      toast.success(res.data.message || "Verified successfully");

      console.log(email, otp);
      localStorage.setItem("token", res.data.accessToken);
      localStorage.removeItem("email");

      //Navigate ONLY after success
      navigate("/home");
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Enter OTP"
          onChange={(e) => setOtp(e.target.value)}
        />
        <br />

        <button onClick={verifyOTP}>Verify OTP</button>
      </div>
    </div>
  );
};

export default Verifyotp;