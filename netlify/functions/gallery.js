const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async () => {
  try {
    const result = await cloudinary.search
      .expression("folder:seegraysvision_uploads")
      .sort_by("uploaded_at", "desc")
      .max_results(100)
      .execute();

    // Map Cloudinary result to your frontend format
    const photos = result.resources.map((res) => ({
      public_id: res.public_id,
      url: res.secure_url,
      title: res.context?.custom?.title || "", // optional
      tags: res.tags || [],
      description: res.context?.custom?.description || "",
      uploaded_at: res.created_at,
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(photos),
    };
  } catch (err) {
    console.error("Gallery fetch error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to load gallery." }),
    };
  }
};
