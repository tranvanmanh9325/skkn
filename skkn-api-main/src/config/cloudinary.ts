import * as dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Load .env before reading any process.env — critical in scripts and
// test contexts where the host process hasn't pre-loaded the variables.
// In production Docker the env is injected via docker-compose env_file,
// so dotenv.config() is a no-op (existing keys are never overwritten).
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Cloudinary storage engine for multer.
 * Imported lazily by uploadRoutes so the config above runs first.
 * Uploads to the "skkn_attachments" folder.
 * `resource_type: "auto"` lets Cloudinary detect the file type.
 */
import { CloudinaryStorage } from "multer-storage-cloudinary";

export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "skkn_attachments",
    // "raw" = lưu file nguyên bản không transform — đúng cho PDF, Word, Excel.
    // "auto" có thể phân loại PDF thành "image" khiến URL dạng /image/upload/ không download được.
    resource_type: "raw",
    use_filename: true,
    unique_filename: true,
  } as Record<string, unknown>,
});

export default cloudinary;
