import express from 'express';
import dotenv from 'dotenv';
import menuRoutes from './modules/menu/menu.routes.js'
import cors from 'cors'
import helmet from 'helmet';
dotenv.config()


const app = express();
const PORT = process.env.PORT || 8000

app.use(cors({
    origin: 'localhost:5173',
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE']
}))

app.use(helmet())

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} http://localhost:${PORT}`);
});