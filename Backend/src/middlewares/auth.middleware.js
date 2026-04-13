import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extract token
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

    // 3. Check session in DB
    const session = await sessionModel.findById(decoded.sessionId);

    if (!session || session.revoked) {
      return res.status(401).json({
        message: "Session expired or revoked",
      });
    }

    if (session.expiresAt < Date.now()) {
        return res.status(401).json({
            message: "Session expired",
        });
    }

    // 4. Attach user
    req.user = {
      id: decoded.id,
      sessionId: decoded.sessionId,
    };

    next();

  } catch (error) {

    // Better error handling
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token expired",
      });
    }

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export default authMiddleware;