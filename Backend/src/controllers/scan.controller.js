import fs from "fs";
import path from "path";
import axios from "axios";
import pLimit from "p-limit";
import FormData from "form-data";
import { fetchYouTubeImages } from "../services/youtubeService.js";
import { fetchPixabayImages } from "../services/pixabayService.js";
import { fetchUnsplashImages } from "../services/unsplashService.js";

const TEMP_DIR = path.join(process.cwd(), "temp");
const CONCURRENCY = 5; // number of images to process in parallel

const compareWithAI = async (userImage, targetImage) => {
  const form = new FormData();
  form.append("query_image", fs.createReadStream(userImage));
  form.append("target_image", fs.createReadStream(targetImage));

  const res = await axios.post(`${process.env.AI_MATCH_URL}/compare`, form, { headers: form.getHeaders() });
  return res.data.similarity || 0;
};

export const scanImageFile = async (filePath) => {
  try {
    const [ytImages, pixabayImages, unsplashImages] = await Promise.all([
      fetchYouTubeImages(),
      fetchPixabayImages(),
      fetchUnsplashImages(),
    ]);

    const allImages = [...ytImages, ...pixabayImages, ...unsplashImages].slice(0, 50);
    const limit = pLimit(CONCURRENCY);

    const results = await Promise.all(
      allImages.map((img) =>
        limit(async () => {
          if (!img.url) return null;
          const tempPath = path.join(TEMP_DIR, `${Date.now()}-${Math.random()}.jpg`);

          try {
            const response = await axios.get(img.url, { responseType: "stream" });
            const writer = fs.createWriteStream(tempPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
              writer.on("finish", resolve);
              writer.on("error", reject);
            });

            const similarity = await compareWithAI(filePath, tempPath);
            fs.existsSync(tempPath) && fs.unlinkSync(tempPath);

            if (similarity > 0.2) {
              return {
                platform: img.source,
                url: img.url,
                link: img.link || img.url,
                similarity: +(similarity * 100).toFixed(2),
              };
            }
            return null;
          } catch {
            fs.existsSync(tempPath) && fs.unlinkSync(tempPath);
            return null;
          }
        })
      )
    );

    return results.filter(Boolean);
  } catch (err) {
    console.error("Scan error:", err.message);
    return [];
  }
};