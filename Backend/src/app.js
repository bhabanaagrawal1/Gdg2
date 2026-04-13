//express ko import kiya
import express from 'express';
//morgan->ek logger tool that records what is happening in my application
import morgan from 'morgan';
import authRouter from './routes/auth.routes.js';
import otpRouter from './routes/otp.routes.js';
import uploadRouter from './routes/upload.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

//server ka instance banaya
const app = express();

// Security
app.disable("x-powered-by");

// CORS (IMPORTANT)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

//middlewares:-
//jo allow karega mere server ko to read json sent by client
app.use(express.json());
app.use(morgan("dev"));
//jo allow karega mere server ko to read cookies sent by client
//cookie matlab ki client ke browser mai kuch data store karna, jaise ki token, taki jab bhi client request bheje toh server us token ko read karke verify kar sake ki user authenticated hai ya nahi, isliye cookie parser middleware use kiya jata hai taki server cookies ko easily read kar sake
app.use(cookieParser());

//For any request that starts with /api/auth, use authRouter to handle it.
app.use("/api/auth",authRouter);
app.use("/api/otp",otpRouter);
app.use("/api/upload",uploadRouter);


// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
});

//app ko export kiya
export default app

