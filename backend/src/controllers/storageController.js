const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOADS_DIR = path.resolve(__dirname, "../../data/uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Upload deed document locally
 * Supports JSON base64 upload or binary
 */
function uploadDocument(req, res) {
  try {
    const { filename, mimeType, base64Data } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: "Missing document file data (base64Data required)." });
    }

    const cleanFilename = (filename || "deed_document.pdf").replace(/[^a-zA-Z0-9_.-]/g, "_");
    const cleanMime = mimeType || "application/pdf";

    // Strip data URL prefix if present (e.g. data:application/pdf;base64,...)
    const base64Pure = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const buffer = Buffer.from(base64Pure, "base64");

    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ error: "File exceeds 25MB maximum size limit." });
    }

    // Generate cryptographic hash (deterministic content addressing)
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const cid = `bafk-${sha256.slice(0, 32)}`;

    const filePath = path.join(UPLOADS_DIR, cid);
    const metaPath = path.join(UPLOADS_DIR, `${cid}.meta.json`);

    fs.writeFileSync(filePath, buffer);
    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        {
          cid,
          filename: cleanFilename,
          mimeType: cleanMime,
          size: buffer.length,
          uploadedAt: new Date().toISOString(),
          uploader: req.user ? req.user.username : "citizen",
        },
        null,
        2
      )
    );

    return res.status(201).json({
      success: true,
      cid,
      filename: cleanFilename,
      size: buffer.length,
      storageType: "local-cadastral-adapter",
      url: `/api/storage/document/${cid}`,
    });
  } catch (err) {
    console.error("Storage upload error:", err);
    return res.status(500).json({ error: "Failed to store document: " + err.message });
  }
}

/**
 * Retrieve deed document by CID/Hash
 */
function getDocument(req, res) {
  try {
    const { cid } = req.params;

    // Prevent directory traversal
    const safeCid = path.basename(cid);
    const filePath = path.join(UPLOADS_DIR, safeCid);
    const metaPath = path.join(UPLOADS_DIR, `${safeCid}.meta.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found in cadastral document store." });
    }

    let mimeType = "application/pdf";
    let filename = `${safeCid}.pdf`;

    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        mimeType = meta.mimeType || mimeType;
        filename = meta.filename || filename;
      } catch (e) {
        // Fallback
      }
    }

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return res.sendFile(filePath);
  } catch (err) {
    console.error("Storage fetch error:", err);
    return res.status(500).json({ error: "Failed to retrieve document." });
  }
}

module.exports = {
  uploadDocument,
  getDocument,
};
