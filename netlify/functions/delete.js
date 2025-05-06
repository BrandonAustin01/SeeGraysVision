const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_SECRET = process.env.UPLOAD_SECRET;
const metadataPath = path.join(__dirname, "../../docs/data/photos.json");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const { public_id, uploadKey } = JSON.parse(event.body);

    if (uploadKey !== UPLOAD_SECRET) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    // If deletion failed on Cloudinary side
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error("Cloudinary deletion failed");
    }

    // Update local metadata
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      const updated = metadata.filter((photo) => photo.public_id !== public_id);
      fs.writeFileSync(metadataPath, JSON.stringify(updated, null, 2));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, deleted_id: public_id }),
    };
  } catch (err) {
    console.error("❌ Deletion failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to delete image or update metadata",
      }),
    };
  }
};
