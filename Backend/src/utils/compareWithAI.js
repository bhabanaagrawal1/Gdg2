import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export const compareWithAI = async (imagePath) => {
  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));

  const res = await axios.post(
    "http://127.0.0.1:5000/match",
    form,
    { headers: form.getHeaders() }
  );

  return res.data;
};