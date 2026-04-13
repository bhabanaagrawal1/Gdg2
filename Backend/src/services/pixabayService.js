import axios from "axios";

const API_KEY = process.env.PIXABAY_API_KEY;

export const fetchPixabayImages = async (query) => {
  const res = await axios.get(
    `https://pixabay.com/api/`,
    {
      params: {
        key: API_KEY,
        q: query,
        image_type: "photo"
      }
    }
  );

  return res.data.hits.map(img => ({
  url: img.largeImageURL,   // better quality for AI
  source: "pixabay",
  link: img.pageURL,
  tags: img.tags,
  user: img.user
})).filter(img => img.url && img.link);
};