
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

// Lokasi absolut: project-root/storage/public
export const STORAGE_PUBLIC_DIR = fileURLToPath(
    new URL('../storage/public/', import.meta.url)
);

// Pastiian direktori tersedia
mkdirSync(STORAGE_PUBLIC_DIR, { recursive: true });

// Setting storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, STORAGE_PUBLIC_DIR);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${file.fieldname}-${Date.now()}${ext}`;

        cb(null, filename);
    }
});

// Validasi tipe file
function checkFileType(file, cb) {
    const allowedExtensions = /\.(jpe?g|png|gif)$/i;
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif'
    ];

    const extname = allowedExtensions.test(
        path.extname(file.originalname)
    );

    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }

    return cb(new Error('Only JPEG, PNG, and GIF images are allowed.'));
}

// Initialize upload
export const upload = multer({
    storage,
    limits: {
        fileSize: 1_000_000 // 1MB
    },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('image');

// Initialize for Cloudinary upload and filter
// Upload Cloudinary: file ditampung sementara di memory
export const uploadCloudinary = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1_000_000 // 1 MB
    },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('image');