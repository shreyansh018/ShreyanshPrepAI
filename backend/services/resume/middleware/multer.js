import multer from "multer";

// Render and other free hosts use ephemeral filesystems, so keep the PDF in
// memory and parse it directly instead of writing to ./uploads.
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
});
