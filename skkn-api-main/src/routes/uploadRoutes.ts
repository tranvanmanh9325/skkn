import { Router } from "express";
import multer from "multer";
import { cloudinaryStorage } from "../config/cloudinary";
import { uploadFile } from "../controllers/uploadController";

const router = Router();

// Single file per request; field name must be "file" on the client side
const upload = multer({ storage: cloudinaryStorage });

// POST /api/upload
router.post("/", upload.single("file"), uploadFile);

export default router;
