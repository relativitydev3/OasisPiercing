const multer = require('multer');
const path = require('path');

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      return cb(new Error('Formato no permitido. Usa JPG, JPEG, PNG o WEBP.'));
    }

    cb(null, true);
  },
});

function isValidImageMagic(buffer) {
  if (!buffer?.length) return false;

  const buf = buffer.subarray(0, 12);
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isWebp = buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';

  return isJpeg || isPng || isWebp;
}

function uploadProductoInpaint(req, res, next) {
  upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'mascara', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.uploadError = 'La imagen o la máscara no pueden superar 8 MB.';
      } else {
        req.uploadError = err.message || 'Error al subir los archivos.';
      }
      return next();
    }

    const imageFile = req.files?.imagen?.[0];
    const maskFile = req.files?.mascara?.[0];

    if (imageFile && !isValidImageMagic(imageFile.buffer)) {
      req.files.imagen = undefined;
      req.uploadError = 'El archivo de imagen no es válido.';
    }
    if (maskFile && !isValidImageMagic(maskFile.buffer)) {
      req.files.mascara = undefined;
      req.uploadError = 'El archivo de máscara no es válido.';
    }

    next();
  });
}

module.exports = { uploadProductoInpaint };
