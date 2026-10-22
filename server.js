import express from 'express';
import dotenv from 'dotenv';
import menuRoutes from './modules/menu/menu.routes.js'
import cors from 'cors'
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path'
import fs from 'node:fs'
import cloudinary from './config/cloudinary.config.js';
import { uploadCloudinary } from './config/multer.config.js';
import { Readable } from 'node:stream';
import { redisClient } from './config/redis.config.js';
import { invalidateImagesCache } from './utils/cache.js'
dotenv.config()


const app = express();
const PORT = process.env.PORT || 8000
const APP_URL = process.env.BASE_URL || `http://localhost:${PORT}`

app.use(cors({
    origin: 'localhost:5173',
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
}))

app.use(helmet())
app.use(cookieParser())
// Batasi Backend agar tidak bisa diakses oleh Postman
// app.use((req, res, next) => {
//     const userAgent = req.headers['user-agent'] || '';

//     if (userAgent.includes('PostmanRuntime') || userAgent.includes('Postman')) {
//         return res.status(403).json({ error: 'Access denied: Automated clients not allowed.' });
//     }

//     next();
// });


// Pakai Middlewaree Express JSON untuk kita bisa mengolah tipe file yang dikirim dengan format json
// file.json akan masuk ke request body
app.use(express.json())

// ROUTES
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/example', (req, res) => {
    res.send('This is an example route!');
});



// Menu Route
// Middleware untuk wrapping route
app.use('/api/v1/menu', menuRoutes)

import authRoutes from './modules/auth/auth.routes.js'
import { STORAGE_PUBLIC_DIR, upload } from './config/multer.config.js';
import { db } from './config/db.config.js';
app.use('/api/v1/auth', authRoutes)

// Setting folder lokal untuk diekspos agar bisa diakses
app.use('/image', express.static(STORAGE_PUBLIC_DIR));


// File upload ke local storage
app.post('/api/v1/image-upload', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            const isFileTooLarge = err.code === 'LIMIT_FILE_SIZE';

            return res.status(400).json({
                success: false,
                message: isFileTooLarge
                    ? 'File size exceeds the 1 MB limit.'
                    : 'File upload failed.',
                error: err.message || String(err)
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file selected.'
            });
        }

        const file = req.file;

        // Path URL selalu menggunakan separator /
        const imagePath = path.posix.join('image', file.filename);
        const imageUrl = `${APP_URL}/${imagePath}`;

        try {
            const query = `
                INSERT INTO images (
                    image_path,
                    image_url,
                    provider,
                    provider_id,
                    original_name,
                    mime_type,
                    size
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING
                    id,
                    image_path,
                    image_url,
                    provider,
                    provider_id,
                    original_name,
                    mime_type,
                    size,
                    created_at
            `;

            const values = [
                imagePath,
                imageUrl,
                'local',
                null,
                file.originalname,
                file.mimetype,
                file.size
            ];

            const result = await db.query(query, values);
            await invalidateImagesCache();
            return res.status(201).json({
                success: true,
                message: 'Image uploaded successfully.',
                data: result.rows[0]
            });
        } catch (dbError) {
            console.error('Image database error:', dbError);

            // Hapus file jika penyimpanan metadata gagal
            try {
                await fs.unlink(file.path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }

            return res.status(500).json({
                success: false,
                message: 'Image uploaded, but database save failed.'
            });
        }
    });
});



app.get('/api/v1/all-image', async (req, res) => {
    const cacheKey = 'images:all';

    try {
        // 1. Cek cache di Redis
        try {
            const cachedImages = await redisClient.get(cacheKey);

            if (cachedImages) {
                return res.status(200).json({
                    success: true,
                    source: 'redis',
                    images: JSON.parse(cachedImages),
                    error: ''
                });
            }
        } catch (redisError) {
            console.error('Redis cache read error:', redisError);
        }

        // 2. Jika cache kosong, ambil dari PostgreSQL
        const { rows } = await db.query(`
            SELECT *
            FROM images
            ORDER BY created_at DESC
        `);

        // 3. Simpan hasil query ke Redis selama 60 detik
        try {
            await redisClient.set(
                cacheKey,
                JSON.stringify(rows),
                { EX: 60 }
            );
        } catch (redisError) {
            console.error('Redis cache write error:', redisError);
        }

        return res.status(200).json({
            success: true,
            source: 'postgresql',
            images: rows,
            error: ''
        });

    } catch (error) {
        console.error('Fetch images error:', error);

        return res.status(500).json({
            success: false,
            images: [],
            error: 'Failed to fetch images.'
        });
    }
});




app.post('/api/v1/image-upload-cloudinary', (req, res) => {
    uploadCloudinary(req, res, async (err) => {
        if (err) {
            const isFileTooLarge = err.code === 'LIMIT_FILE_SIZE';

            return res.status(400).json({
                success: false,
                message: isFileTooLarge
                    ? 'File size exceeds the 1 MB limit.'
                    : 'File upload failed.',
                error: err.message || String(err)
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file selected.'
            });
        }

        const file = req.file;
        let uploadedImage;

        try {
            // Upload buffer dari Multer ke Cloudinary
            uploadedImage = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'images',
                        resource_type: 'image',
                        use_filename: true,
                        unique_filename: true
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );

                Readable.from([file.buffer]).pipe(stream);
            });

            // URL dan nama file berasal dari Cloudinary
            const imageUrl = uploadedImage.secure_url;
            const imagePath = uploadedImage.public_id;

            // Simpan metadata ke PostgreSQL
            const query = `
                INSERT INTO images (
                    image_path,
                    image_url,
                    provider,
                    provider_id,
                    original_name,
                    mime_type,
                    size
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const values = [
                imagePath,
                imageUrl,
                'cloudinary',
                uploadedImage.public_id,
                file.originalname,
                file.mimetype,
                file.size
            ];

            const { rows } = await db.query(query, values);
            await invalidateImagesCache();
            return res.status(201).json({
                success: true,
                message: 'Image uploaded to Cloudinary successfully.',
                data: rows[0]
            });
        } catch (error) {
            console.error('Cloudinary upload error:', error);

            // Jika upload Cloudinary sukses tetapi insert DB gagal,
            // hapus aset Cloudinary untuk menghindari file yatim.
            if (uploadedImage?.public_id) {
                try {
                    await cloudinary.uploader.destroy(
                        uploadedImage.public_id,
                        { resource_type: 'image' }
                    );
                } catch (cleanupError) {
                    console.error('Cloudinary cleanup error:', cleanupError);
                }
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to upload image or save metadata.'
            });
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} http://localhost:${PORT}`);
});