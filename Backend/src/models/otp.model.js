import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String, //hashed OTP
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String, // hashed password
        required: true
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 300 // auto delete after 5 minutes
    }
})

const otpModel = mongoose.model("OTP",otpSchema);

export default otpModel;