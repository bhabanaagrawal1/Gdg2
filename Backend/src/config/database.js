import mongoose from 'mongoose'
import config from './config.js'

//database se connect karne ke liye function banaya
async function connectDB(){
    await mongoose.connect(config.MONGO_URI)
    console.log("Connected to DB");
}

export default connectDB;