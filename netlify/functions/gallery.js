// netlify/functions/gallery.js

const fs = require("fs");
const path = require("path");

exports.handler = async function () {
  const metadataPath = path.join(__dirname, "../../docs/data/photos.json");

  try {
    const rawData = fs.readFileSync(metadataPath, "utf-8");
    const parsed = JSON.parse(rawData);

    // Normalize: ensure array of valid photo entries
    const photos = Array.isArray(parsed)
      ? parsed.filter((photo) => photo.url)
      : Object.values(parsed).filter((photo) => photo.url);

    // Patch format: always return uniform structure
    const cleanPhotos = photos.map((photo) => ({
      public_id: photo.public_id || "",
      url: photo.url,
      title: photo.title || "",
      tags: Array.isArray(photo.tags)
        ? photo.tags
        : typeof photo.tags === "string"
        ? photo.tags.split(",").map((t) => t.trim())
        : [],
      description: photo.description || "",
      uploaded_at: photo.uploaded_at || null,
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(cleanPhotos),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to load gallery metadata.",
        detail: err.message,
      }),
    };
  }
};
