import sgMail from "@sendgrid/mail";
import config from "../config/config.js";

sgMail.setApiKey(config.SENDGRID_API_KEY);

const sendVerificationEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: config.SENDER_EMAIL,
      to: email,
      subject: "Email Verification",
      text: `
        Hello,

        Your OTP for verification is ${otp}.
        This OTP will expire in 5 minutes.

        If you did not request this, please ignore.

        Thanks,
        Team Shepsilon`,
    };
    await sgMail.send(mailOptions);

    console.log("Email sent via SendGrid");
  } catch (error) {
    console.error("Error sending email:", error);

    if (error.response) {
      console.error("SendGrid Details:", error.response.body);
    }
    throw error;
  }
};

export default sendVerificationEmail;
