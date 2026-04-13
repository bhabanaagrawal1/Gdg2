import axios from "axios";

const API_KEY = process.env.YOUTUBE_API_KEY;

export const fetchYouTubeImages = async (query) => {
  const res = await axios.get(
    "https://www.googleapis.com/youtube/v3/search",
    {
      params: {
        key: API_KEY,
        q: query,
        part: "snippet",
        maxResults: 5
      }
    }
  );

  return res.data.items.map(item => {
  const videoId = item.id.videoId;

  return {
    url: item.snippet.thumbnails.high.url,
    source: "youtube",
    link: `https://www.youtube.com/watch?v=${videoId}`,
    title: item.snippet.title
  };
}).filter(item => item.url && item.link);
};