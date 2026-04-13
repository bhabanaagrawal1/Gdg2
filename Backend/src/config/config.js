import dotenv from 'dotenv';


//jab tak config nahi karte jo .env mai hai wo access nahi hoga
dotenv.config();

//check dotenv mai chiz exist karta hai ya nahi
if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI is not defined in environment variables");
}

//check JWT_SECRET exist karta hai ya nahi
if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not present in environment variables");
}


if(!process.env.SENDGRID_API_KEY){
    throw new Error("SENDGRID_API_KEY is not present in environment variables");
}

if(!process.env.SENDER_EMAIL){
    throw new Error("SENDER_EMAIL is not present in environment variables");
}

//config object banaya jo help karega mujhe to access environment variables and export it
const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDER_EMAIL: process.env.SENDER_EMAIL
}

export default config;