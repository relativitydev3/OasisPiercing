const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { productosImagesDir } = require('../utils/paths');

fs.mkdirSync(productosImagesDir, { recursive: true });

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productosImagesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'producto';

    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      return cb(new Error('Formato no permitido. Usa JPG, JPEG, PNG o WEBP.'));
    }

    cb(null, true);
  },
});

function isValidImageMagic(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);

    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isWebp = buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';

    return isJpeg || isPng || isWebp;
  } finally {
    fs.closeSync(fd);
  }
}

function discardInvalidUpload(file) {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlink(file.path, () => {});
  }
}

function uploadProductoImage(req, res, next) {
  upload.single('imagen')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.uploadError = 'La imagen no puede superar 5 MB.';
      } else {
        req.uploadError = err.message || 'Error al subir la imagen.';
      }
      return next();
    }

    if (req.file && !isValidImageMagic(req.file.path)) {
      discardInvalidUpload(req.file);
      req.file = undefined;
      req.uploadError = 'El archivo no es una imagen válida (JPG, PNG o WEBP).';
    }

    next();
  });
}

module.exports = { uploadProductoImage };
