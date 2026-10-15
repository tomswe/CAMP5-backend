import express from 'express';
import dotenv from 'dotenv';
import menuRoutes from './modules/menu/menu.routes.js'
dotenv.config()


const app = express();
const PORT = process.env.PORT || 8000

app.use(express.json())

// ROUTES
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/example', (req, res) => {
    res.send('This is an example route!');
});



// Menu Route
app.use('/api/v1/menu', menuRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} http://localhost:${PORT}`);
});