import axios from "axios";

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export const fetchUnsplashImages = async (query) => {
  const res = await axios.get(
    `https://api.unsplash.com/search/photos`,
    {
      params: { query, per_page: 10 },
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`
      }
    }
  );

  return res.data.results.map(img => ({
    url: img.urls?.regular,
    source: "unsplash",
    link: img.links?.html,
    author: img.user?.name,
    description: img.alt_description
  })).filter(img => img.url && img.link);
};