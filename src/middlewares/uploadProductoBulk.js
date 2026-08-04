const multer = require('multer');

const MAX_ZIP = 80 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ZIP },
  fileFilter(_req, file, cb) {
    if (file.fieldname === 'csv') {
      const ok = /\.csv$/i.test(file.originalname || '')
        || file.mimetype === 'text/csv'
        || file.mimetype === 'application/vnd.ms-excel';
      if (!ok) {
        cb(new Error('El CSV debe ser un archivo .csv'));
        return;
      }
    }
    if (file.fieldname === 'imagenes_zip') {
      const ok = /\.zip$/i.test(file.originalname || '')
        || file.mimetype === 'application/zip'
        || file.mimetype === 'application/x-zip-compressed';
      if (!ok) {
        cb(new Error('Las imágenes deben ir en un archivo .zip'));
        return;
      }
    }
    cb(null, true);
  },
});

function uploadProductoBulk(req, res, next) {
  upload.fields([
    { name: 'csv', maxCount: 1 },
    { name: 'imagenes_zip', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.uploadError = 'El ZIP no puede superar 80 MB.';
      } else {
        req.uploadError = err.message || 'Error al subir archivos.';
      }
    }
    next();
  });
}

module.exports = { uploadProductoBulk };
