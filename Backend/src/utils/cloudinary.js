import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFile = async (filePath) => {
  try {
    if (!filePath) throw new Error("File path required");
    const result = await cloudinary.uploader.upload(filePath, { resource_type: "auto" });
    fs.existsSync(filePath) && fs.unlinkSync(filePath);
    return result.secure_url;
  } catch (err) {
    fs.existsSync(filePath) && fs.unlinkSync(filePath);
    console.error("Cloudinary upload error:", err.message);
    return null;
  }
};

export default uploadFile;