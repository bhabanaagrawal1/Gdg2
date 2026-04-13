import {Router} from 'express'
import * as otpController from "../controllers/otp.controller.js"

const otpRouter = Router();

//route for generating OTP
//post request issiliye kyunki client se data (email) bhejna hai
otpRouter.post("/sendotp",otpController.sendOtp);
otpRouter.post("/verifyotp",otpController.verifyOtp);

export default otpRouter;