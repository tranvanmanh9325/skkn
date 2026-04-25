import { RequestHandler } from "express";

export const uploadFile: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No file provided." });
    return;
  }

  // Log toàn bộ file object để xác nhận đúng property names
  console.log("[DEBUG upload] req.file keys:", Object.keys(req.file));
  console.log("[DEBUG upload] file.path:", (req.file as any).path);
  console.log("[DEBUG upload] file.filename:", (req.file as any).filename);
  console.log("[DEBUG upload] file.secure_url:", (req.file as any).secure_url);

  const file = req.file as Express.Multer.File & {
    path: string;       // Cloudinary secure_url (multer-storage-cloudinary v4)
    filename: string;   // Cloudinary public_id
    secure_url?: string; // some versions expose this directly
  };

  // Ưu tiên secure_url nếu tồn tại trực tiếp, fallback về path
  const fileUrl = file.secure_url ?? file.path;

  // multer đọc originalname theo Latin-1, cần decode lại thành UTF-8 để hiển thị đúng tiếng Việt
  const fileName = Buffer.from(file.originalname, "latin1").toString("utf8");

  console.log("[DEBUG upload] fileUrl to be saved:", fileUrl);
  console.log("[DEBUG upload] fileName decoded:", fileName);

  res.status(200).json({
    secure_url: fileUrl,
    public_id: file.filename,
    fileName,
    fileSize: file.size,
  });
};

