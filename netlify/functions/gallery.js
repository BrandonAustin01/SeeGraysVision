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
const metadataPath = path.join(__dirname, "../../docs/data/photos.json");

// Ensure metadata file exists
if (!fs.existsSync(metadataPath)) {
  fs.writeFileSync(metadataPath, "[]", "utf8");
}

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
      headers: { Allow: "POST, OPTIONS" },
      body: "Method Not Allowed",
    };
  }

  const buffer = Buffer.from(
    event.body,
    event.isBase64Encoded ? "base64" : "utf8"
  );

  return await new Promise((resolve, reject) => {
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
        const result = await cloudinary.uploader.upload(tempFilePath, {
          folder: "seegraysvision_uploads",
        });

        const tagsArray = fields.tags
          ? fields.tags.split(",").map((t) => t.trim())
          : [];

        const photoEntry = {
          public_id: result.public_id,
          url: result.secure_url,
          title: fields.title || "",
          tags: tagsArray,
          description: fields.description || "",
          uploaded_at: new Date().toISOString(),
        };

        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        metadata.push(photoEntry);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

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
