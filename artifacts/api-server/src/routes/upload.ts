import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const uploadsDir = path.resolve(process.cwd(), "artifacts/api-server/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (JPEG, PNG, WebP, GIF, AVIF)."));
    }
  },
});

router.post("/image", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded." });
    return;
  }
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
