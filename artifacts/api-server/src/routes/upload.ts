import { Router } from "express";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/image", requireAuth, async (req, res) => {
  try {
    const cloudinaryName = process.env["CLOUDINARY_CLOUD_NAME"];
    const cloudinaryKey = process.env["CLOUDINARY_API_KEY"];
    const cloudinarySecret = process.env["CLOUDINARY_API_SECRET"];

    if (!cloudinaryName || !cloudinaryKey || !cloudinarySecret) {
      res.status(503).json({ error: "Cloudinary is not configured. Please add your Cloudinary credentials." });
      return;
    }

    // Cloudinary integration would go here
    res.json({ url: "https://via.placeholder.com/400", publicId: "placeholder" });
  } catch (err) {
    req.log.error({ err }, "Upload image error");
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
