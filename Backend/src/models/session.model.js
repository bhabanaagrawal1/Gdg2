import mongoose from "mongoose";

//session matlab hai ki user ne login kar liya hai aur ab wo authenticated hai
//sessionSchema -> user reference store karega taki pata chal sake ki session kis user ke liye hai, aur session expire hone ka time bhi store karega taki pata chal sake ki session valid hai ya expired
const sessionSchema = new mongoose.Schema(
  {
    //user define is required because we need to know which user this session belongs to, without user reference we won't be able to associate the session with any user, and it will be meaningless to have a session without knowing which user it belongs to, isliye user reference ko required banaya gaya hai
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    //refreshTokenHash store karega hashed version of refresh token, taki security bani rahe, agar refresh token database mai plain text mai store kiya jaye toh security risk ho sakta hai, isliye usko hash karke store karna chahiye, taki agar database compromised ho jaye toh attackers ko refresh token ka actual value nahi milega
    refreshTokenHash: {
      type: String,
      required: [true, "Refresh token hash is required"],
      index: true, //index banaya gaya hai refreshTokenHash field par taki uske basis par fast lookup ho sake, jab bhi koi refresh token aayega toh usko hash karke database mai stored hash ke saath compare karna hoga, agar index nahi hoga toh database ko pura scan karna padega matching hash ko find karne ke liye, jo ki inefficient hoga, isliye index banaya gaya hai refreshTokenHash field par taki fast lookup ho sake
    },
    //ip address store karega user ke login hone ka, taki pata chal sake ki user kis IP address se login kar raha hai, isse security monitoring ke liye use kiya ja sakta hai, agar kisi suspicious IP address se login attempt hota hai toh usko detect kiya ja sakta hai
    ip: {
      type: String,
      required: [true, "IP address is required"],
    },
    //user agent store karega user ke login hone ka, taki pata chal sake ki user kis device se login kar raha hai, isse security monitoring ke liye use kiya ja sakta hai, agar kisi suspicious device se login attempt hota hai toh usko detect kiya ja sakta hai
    userAgent: {
      type: String,
      required: [true, "User agent is required"], //version of browser, operating system, device type etc. store karta hai user agent, isse pata chal sakta hai ki user kis device se login kar raha hai
    },
    //revoked matlab hai ki session ko invalidate kar diya gaya hai, agar user logout karta hai toh session revoke kar diya jata hai, taki us session ka refresh token use karke access token generate na kiya ja sake, isliye revoked field ko default false set kiya gaya hai, jab user logout karega toh usko true set kar diya jayega
    revoked: {
      type: Boolean,
      default: false,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => Date.now() + 7 * 24 * 60 * 60 * 1000,
      index: { expires: 0 },//TTL index banaya gaya hai expiresAt field par taki MongoDB automatically expired sessions ko delete kar de, jab expiresAt ka time current time se chota ho jata hai toh MongoDB us document ko delete kar dega, isse database clean rahega aur expired sessions automatically remove ho jayenge
    },
  },
  {
    //timestamps option use kiya gaya hai taki createdAt aur updatedAt fields automatically create ho jaye, createdAt field store karega ki session kab create hua tha, updatedAt field store karega ki session kab last time update hua tha, isse pata chal sakta hai ki session kitna purana hai aur usko kab revoke karna chahiye
    timestamps: true,
  },
);

sessionSchema.index({ user: 1, revoked: 1 });

const sessionModel = mongoose.model("Session", sessionSchema);

export default sessionModel;