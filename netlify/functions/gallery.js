// netlify/functions/gallery.js

const cloudinary = require("cloudinary").v2;
const Busboy = require("busboy");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_SECRET = process.env.UPLOAD_SECRET;

exports.handler = async (event) => {
  // ✅ Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  // ✅ Handle GET: fetch live gallery from Cloudinary
  if (event.httpMethod === "GET") {
    try {
      const results = await cloudinary.search
        .expression("folder:seegraysvision_uploads")
        .sort_by("created_at", "desc")
        .max_results(100)
        .execute();

      const photos = results.resources.map((res) => ({
        public_id: res.public_id,
        url: res.secure_url,
        title: res.context?.custom?.title || "",
        description: res.context?.custom?.description || "",
        tags: res.tags || [],
        uploaded_at: res.created_at,
      }));

      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(photos),
      };
    } catch (err) {
      console.error("Cloudinary fetch error:", err);
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          errorType: "CloudinaryError",
          errorMessage: err.message,
        }),
      };
    }
  }

  // ✅ Reject unsupported methods
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        Allow: "GET, POST, OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: "Method Not Allowed",
    };
  }

  // ✅ Handle POST: file upload
  const buffer = Buffer.from(
    event.body,
    event.isBase64Encoded ? "base64" : "utf8"
  );

  return await new Promise((resolve) => {
    const busboy = new Busboy({
      headers: {
        "content-type":
          event.headers["content-type"] || event.headers["Content-Type"],
      },
    });

    let fields = {};
    let tempFilePath = null;

    busboy.on("file", (fieldname, file, filename) => {
      const tmpdir = os.tmpdir();
      tempFilePath = path.join(tmpdir, filename);
      const writeStream = fs.createWriteStream(tempFilePath);
      file.pipe(writeStream);
      file.on("end", () => writeStream.end());
    });

    busboy.on("field", (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on("finish", async () => {
      if (fields.uploadKey !== UPLOAD_SECRET) {
        return resolve({
          statusCode: 401,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Unauthorized upload key" }),
        });
      }

      try {
        const tagsArray = fields.tags
          ? fields.tags.split(",").map((t) => t.trim())
          : [];

        // ✅ Upload to Cloudinary with tags + context
        const result = await cloudinary.uploader.upload(tempFilePath, {
          folder: "seegraysvision_uploads",
          tags: tagsArray,
          context: {
            custom: {
              title: fields.title || "",
              description: fields.description || "",
            },
          },
        });

        // ✅ Reload to ensure tags/context persisted
        const reloaded = await cloudinary.api.resource(result.public_id, {
          resource_type: "image",
          tags: true,
          context: true,
        });

        const photoEntry = {
          public_id: reloaded.public_id,
          url: reloaded.secure_url,
          title: reloaded.context?.custom?.title || "",
          tags: reloaded.tags || [],
          description: reloaded.context?.custom?.description || "",
          uploaded_at: reloaded.created_at,
        };

        resolve({
          statusCode: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ success: true, photo: photoEntry }),
        });
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        resolve({
          statusCode: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Upload failed" }),
        });
      }
    });

    busboy.end(buffer);
  });
};
