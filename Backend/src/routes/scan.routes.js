import express from "express";
import upload from "../middleware/multer.middleware.js";
import { scanImageFile } from "../controllers/scan.controller.js";

const router = express.Router();

router.post("/image", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const matches = await scanImageFile(req.file.path);
  fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
  res.json({ totalScanned: matches.length, matches });
});

export default router;