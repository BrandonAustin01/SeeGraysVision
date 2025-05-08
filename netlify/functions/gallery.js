const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        Allow: "GET, OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const results = await cloudinary.search
      .expression("folder:seegraysvision_uploads")
      .sort_by("created_at", "desc")
      .with_field("context")
      .with_field("tags")
      .max_results(100)
      .execute();

    const photos = results.resources.map((res) => ({
      public_id: res.public_id,
      url: res.secure_url,
      title:
        res.context?.custom?.title ||
        res.context?.caption ||
        res.context?.alt ||
        "",
      description:
        res.context?.custom?.description || res.context?.caption || "",
      tags: res.tags || [],
      uploaded_at: res.created_at,
    }));

    console.log("📦 Loaded photos from Cloudinary:", photos.length);
    console.log("📸 Sample photo:", photos[0]);

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(photos),
    };
  } catch (err) {
    console.error("❌ Cloudinary fetch error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        errorType: "CloudinaryError",
        errorMessage: err.message,
      }),
    };
  }
};
