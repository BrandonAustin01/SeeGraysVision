const cloudinary = require("cloudinary").v2;
const Busboy = require("busboy");
const fs = require("fs");
const os = require("os");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_SECRET = process.env.UPLOAD_SECRET;
const isDev = process.env.CONTEXT === "dev";
const metadataPath = path.join(__dirname, "../../docs/data/photos.json");

const ALLOWED_TAGS = ["headshots", "scenery", "events", "portraits"];

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST, OPTIONS", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

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
      console.log("📥 Received fields:", fields);

      if (fields.uploadKey !== UPLOAD_SECRET) {
        console.warn("🛑 Unauthorized upload attempt.");
        return resolve({
          statusCode: 401,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Unauthorized upload key" }),
        });
      }

      try {
        let tagsArray = fields.tags
          ? fields.tags
              .split(",")
              .map((t) => t.trim().toLowerCase())
              .filter((tag) => ALLOWED_TAGS.includes(tag))
          : [];

        console.log("🏷️ Normalized tags:", tagsArray);

        if (tagsArray.length === 0) {
          return resolve({
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
              error:
                "No valid tags provided. Allowed tags: headshots, scenery, events, portraits",
            }),
          });
        }

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

        console.log("✅ Upload completed. Fetching reloaded metadata...");

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

        if (isDev) {
          try {
            if (!fs.existsSync(metadataPath)) {
              fs.writeFileSync(metadataPath, "[]", "utf8");
            }
            const current = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
            current.push(photoEntry);
            fs.writeFileSync(metadataPath, JSON.stringify(current, null, 2));
            console.log("📝 Metadata saved locally.");
          } catch (metaErr) {
            console.warn("⚠️ Failed to update photos.json:", metaErr.message);
          }
        }

        console.log("✅ Final photo entry:", photoEntry);

        resolve({
          statusCode: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ success: true, photo: photoEntry }),
        });
      } catch (err) {
        console.error("❌ Cloudinary upload failed:", err);
        resolve({
          statusCode: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Upload to Cloudinary failed." }),
        });
      }
    });

    busboy.end(buffer);
  });
};
