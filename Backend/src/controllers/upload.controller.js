import uploadFile from "../utils/cloudinary.js";
import { scanImageFile } from "./scan.controller.js";

export const handleFileUpload = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;

    // Upload to Cloudinary
    const cloudUrl = await uploadFile(filePath);
    if (!cloudUrl) return res.status(500).json({ error: "Failed to upload file" });

    let matches = [];
    if (req.file.mimetype.startsWith("image/")) {
      matches = await scanImageFile(filePath); // now with concurrency
    }

    res.status(200).json({
      message: "File uploaded successfully",
      url: cloudUrl,
      matches,
    });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: "Upload or scan failed" });
  }
};