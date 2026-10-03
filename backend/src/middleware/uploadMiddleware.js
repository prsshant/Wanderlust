const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.resolve(
  process.env.UPLOAD_PATH || (process.env.VERCEL ? '/tmp/uploads' : 'uploads')
);
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Upload directory note:', e.message);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `doc-${uniqueSuffix}-${sanitizedName}`);
  }
});

// File filter for identity documents (Images and PDFs)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|pdf/;
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedExtensions.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    return cb(new Error('Only identity documents (PDF, JPG, JPEG, PNG, WEBP) are allowed!'));
  }
};

// Multer upload instance configured for multiple documents
const uploadDocuments = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per file
  },
  fileFilter: fileFilter
}).array('documents', 5); // Support up to 5 documents

module.exports = {
  uploadDocuments,
  uploadDir
};
