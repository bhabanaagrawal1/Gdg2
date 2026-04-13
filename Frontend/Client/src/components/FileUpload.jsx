import React, { useState } from "react";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [matches, setMatches] = useState([]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file");
    const token = localStorage.getItem("token");
    if (!token) return toast.error("Login required");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/upload/file`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMatches(data.matches);
      else toast.error(data.error || "Scan failed");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }
  };

  return (
    <div>
      <h2>Upload Image to Scan</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Scan</button>

      {matches.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Matches:</h3>
          {matches.map((m, idx) => (
            <div key={idx}>
              <p>
                {m.platform} - {m.similarity}%
              </p>
              <a href={m.link} target="_blank" rel="noopener noreferrer">
                <img src={m.url} alt={`match-${idx}`} width="200" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
