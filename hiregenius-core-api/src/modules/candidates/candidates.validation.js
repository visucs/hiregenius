const { z } = require('zod');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../../utils/ApiError');

// Ensure upload directory exists
const uploadDir = path.resolve(__dirname, '../../../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitized = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `resume-${Date.now()}-${sanitized}${ext}`);
  },
});

const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const allowedExtensions = ['.pdf', '.docx', '.doc'];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per Rules.md
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('File must be a PDF or DOCX document'));
    }
  },
});

/**
 * Middleware handling resume multipart upload with 5MB and PDF/DOCX checks
 */
function resumeUploadMiddleware(req, res, next) {
  // Support both 'resume' and 'file' field names
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return next(err);
    }

    const uploadedFile = req.files?.resume?.[0] || req.files?.file?.[0];
    if (!uploadedFile) {
      return next(ApiError.badRequest('Resume file is required'));
    }

    req.file = uploadedFile;
    return next();
  });
}

const candidateIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Candidate ID must be a positive integer'),
});

/**
 * Express middleware validator helper
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  candidateIdParamSchema,
  resumeUploadMiddleware,
  validate,
};
