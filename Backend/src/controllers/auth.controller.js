//password ko hash format mai store karne ke liye in-built
import bcrypt from "bcrypt";
//yahan se conformation milta hai ki token apke server ne create kiya hai ya nahi
//if nahi then server access nahi dega data ko
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import admin from "../config/firebaseAdmin.js";

//login function banaya jo frontend se data lega, usko process karega and response bhejega
import mongoose from "mongoose"; // ⚠️ add if not already

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (!user.verified) {
      return res.status(403).json({
        message: "Please verify your email via OTP first",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // ✅ Create sessionId first
    const sessionId = new mongoose.Types.ObjectId();

    // ✅ Generate tokens
    const refreshToken = jwt.sign(
      { id: user._id, sessionId },
      config.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const accessToken = jwt.sign(
      { id: user._id, sessionId },
      config.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // ✅ Hash refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    // ✅ Now create session (FIXED)
    await sessionModel.create({
      _id: sessionId,
      user: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      revoked: false,
      refreshTokenHash,
    });

    // ✅ Set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    //req.user.id authMiddleware se aata hai, authMiddleware mai jwt.verify() function use kiya hai token verify karne ke liye, agar token valid hai toh decoded payload req.user mai store ho jata hai, isliye yahan req.user.id se user ka id mil jata hai

    //findById() function use kiya hai user ko database mai find karne ke liye, select("-password") use kiya hai taki password field response mai na aaye
    const user = await userModel.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        message: "No refresh token provided",
      });
    }

    //Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    const session = await sessionModel.findById(decoded.sessionId);

    if (!session || session.revoked) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    // 3. Compare token with DB hash
    const isValid = await bcrypt.compare(token, session.refreshTokenHash);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    //Generate new tokens (ROTATION)
    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
        sessionId: session._id, //session id ko refresh token ke payload mai include kiya hai taki jab bhi refresh token verify kiya jaye toh uske sath session id bhi verify ho jaye, isse security bani rahegi, agar refresh token valid hai lekin session id invalid hai toh server access nahi dega data ko, isliye session id ko refresh token ke payload mai include karna chahiye
      },
      config.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        sessionId: session._id,
      },
      config.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // 5. Update session with new refresh token
    session.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await session.save();

    // 6. Set new cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 7. Send response
    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(401).json({
      message: "Invalid refresh token",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        message: "No refresh token provided",
      });
    }

    // 1. Verify token
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    // 2. Find session
    const session = await sessionModel.findById(decoded.sessionId);

    if (!session || session.revoked) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    // 3. Compare token with DB hash (IMPORTANT FIRST)
    const isValid = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // 4. Revoke session (AFTER validation)
    session.revoked = true;
    await session.save();

    // 5. Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};

export const logoutAll = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token not found",
      });
    }

    // 1. Verify token
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    // 2. Validate current session
    const session = await sessionModel.findById(decoded.sessionId);

    if (!session || session.revoked) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    // 3. Compare refresh token with hash
    const isValid = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // 4. Revoke ALL sessions (single query 🚀)
    const result = await sessionModel.updateMany(
      { user: decoded.id, revoked: false },
      { revoked: true },
    );

    if (result.modifiedCount === 0) {
      return res.status(401).json({
        message: "No active sessions found",
      });
    }

    // 5. Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Delete all sessions
    await sessionModel.deleteMany({ user: userId });

    // 2. Delete user
    await userModel.findByIdAndDelete(userId);

    // 3. Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      message: "User account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const idToken = authHeader.split(" ")[1];

    //Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { email, name } = decoded;

    //Find or create user
    let user = await userModel.findOne({ email });

    if (!user) {
      user = await userModel.create({
        username: name,
        email,
        password: "", // Google user
        verified: true,
      });
    }

    //Create sessionId first
    const sessionId = new mongoose.Types.ObjectId();

    //Generate tokens
    const refreshToken = jwt.sign(
      { id: user._id, sessionId },
      config.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const accessToken = jwt.sign(
      { id: user._id, sessionId },
      config.JWT_SECRET,
      { expiresIn: "15m" },
    );

    //Hash refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    //Create session (FIXED)
    await sessionModel.create({
      _id: sessionId,
      user: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      refreshTokenHash,
    });

    //Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // FIX THIS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Google login successful",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
};
