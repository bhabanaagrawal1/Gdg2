import mongoose from "mongoose";

//userSchema define kar diya
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

//don't use "user" -> mongoose apne aap "User" ko pluralize karke "users" bana dega aur database mai "users" collection create karega, isliye model name capital letter se start karna chahiye taki easily identify kar sake ki yeh ek model hai
const userModel = mongoose.model("User",userSchema);

export default userModel;