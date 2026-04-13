import axios from "axios";
import cheerio from "cheerio";

export const scrapeImages = async (url) => {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  let images = [];

  $("img").each((i, el) => {
    const src = $(el).attr("src");
    if (src) {
      images.push({
        url: src,
        source: "blog",
        link: link || baseUrl,
        alt: $(el).attr("alt"),
      });
    }
  });

  return images.slice(0, 5);
};
