const fs = require("fs");
const path = require("path");
const Busboy = require("busboy");

const UPLOAD_SECRET = process.env.UPLOAD_SECRET;
const uploadDir = path.join(__dirname, "../../docs/assets/img/uploads");
const metadataPath = path.join(__dirname, "../../docs/data/photos.json");

// Ensure directories and metadata file exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(metadataPath)) fs.writeFileSync(metadataPath, "[]", "utf8");

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
    let filename = null;
    let filePath = null;

    busboy.on("file", (fieldname, file, originalFilename) => {
      filename = path.basename(originalFilename);
      filePath = path.join(uploadDir, filename);
      file.pipe(fs.createWriteStream(filePath));
    });

    busboy.on("field", (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on("finish", () => {
      if (fields.uploadKey !== UPLOAD_SECRET) {
        return resolve({
          statusCode: 401,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Unauthorized upload key" }),
        });
      }

      const photoEntry = {
        filename,
        title: fields.title || "",
        tags: fields.tags || "",
        description: fields.description || "",
      };

      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      metadata.push(photoEntry);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      resolve({
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: true, filename }),
      });
    });

    busboy.end(buffer);
  });
};
