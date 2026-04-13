const generateOtp = () => {
    //generate 6 digit random number
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

export default generateOtp;