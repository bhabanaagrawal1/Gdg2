import otpModel from "../models/otp.model.js";
import userModel from "../models/user.model.js";
import generateOtp from "../utils/generateOtp.js";
import sendVerificationEmail from "../services/verifyEmail.service.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";

export const sendOtp = async (req, res) => {
  try {
    //fetch kiya frontend se
    const { username, email, password } = req.body;

    // validation
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    //email format check kiya
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //emailRegex.test(email) -> agar email regex ke pattern ko match karta hai toh true return karega otherwise false return karega
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    //password length check kiya
    if (password.length < 6) {
      //400 -> bad request, client ne galat data bheja hai toh server usko process nahi karega and error message bhejega
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    //password ka strength check kiya, password mai at least 1 uppercase, 1 lowercase, 1 number and 1 special character hona chahiye
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    //passwordRegex.test(password) -> agar password regex ke pattern ko match karta hai toh true return karega otherwise false return karega
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character",
      });
    }

    //Check if user already exists
    const existingUser = await userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    await otpModel.deleteMany({ email }); //agar user ne pehle se otp request kiya hai toh purane otp ko delete kar diya jaye taki database mai sirf latest otp hi store ho
    //generate OTP


    const otp = generateOtp();
    //password ko hash kar diya
    //salt->random string that is added to the password before hashing it, it makes it more secure by making it harder for attackers to use precomputed hash tables (rainbow tables) to crack the passwords
    const hashedPassword = await bcrypt.hash(password, 10); //10 -> salt: attack ko delay karta hai


    //Store new OTP
    await otpModel.create({
      email,
      otp,
      username,
      password: hashedPassword,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    //sendVerificationEmail mai createdAt pass karne ki zarurat nahi hai kyunki otpModel mai createdAt ka default value Date.now hai, jab bhi koi naya document create hoga toh createdAt automatically current date and time set ho jayega, isliye hum sendVerificationEmail function ko sirf email aur otp pass karenge

    //expireAt pass karne ki zarurat nahi hai kyunki otpModel mai expireAt ka default value Date.now + 5 minutes hai, jab bhi koi naya document create hoga toh expireAt automatically current date and time + 5 minutes set ho jayega, isliye hum sendVerificationEmail function ko sirf email aur otp pass karenge
    await sendVerificationEmail(email, otp);

    //200 -> success, request successful thi aur server ne response bhej diya hai
    res.status(200).json({
      message: "OTP sent to email successfully",
    });

  } catch (error) {
  console.error("Error in sendOtp controller:", error.message);

  if (error.response) {
    console.error("SendGrid Error:", error.response.body);
  }

  res.status(500).json({
    message: "Internal server error",
  });
}
};

import mongoose from "mongoose"; // ⚠️ add this at top if not already

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const record = await otpModel.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    //Create user
    const user = await userModel.create({
      username: record.username,
      email: record.email,
      password: record.password,
      verified: true,
    });

    //Create a temp session ID first
    const sessionId = new mongoose.Types.ObjectId();

    //Generate tokens
    const refreshToken = jwt.sign(
      { id: user._id, sessionId },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const accessToken = jwt.sign(
      { id: user._id, sessionId },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    //Hash refresh token BEFORE saving
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    //Now create session (FIXED)
    await sessionModel.create({
      _id: sessionId,
      user: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      refreshTokenHash,
    });

    //Set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await otpModel.deleteMany({ email });

    res.status(201).json({
      message: "User verified & logged in",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Error in verifyOtp:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
