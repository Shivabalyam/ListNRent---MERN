require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');

const listingsRouter = require('./routes/listing.js');
const reviewsRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');
const bookingRouter = require('./routes/booking.js'); // make sure this exists

// Trust proxy so secure cookies work behind Render/Proxies
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const dburl = process.env.ATLASDB_URL;
async function main() {
    try {
        await mongoose.connect(dburl);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
main();

// ---------- CORS SETUP ----------
const cors = require('cors');

const FRONTEND_URL = process.env.FRONTEND_ORIGIN || 'https://list-n-rent-85m60xgjn-shivabalyams-projects.vercel.app';

// Public routes (no credentials needed)
app.use('/api/listings', cors({
    origin: FRONTEND_URL,
    credentials: false
}));

// Authenticated routes (cookies or JWT)
app.use(['/api/users', '/api/bookings', '/api/listings/:id/reviews'], cors({
    origin: FRONTEND_URL,
    credentials: true
}));

// ---------- API ROUTES ----------
app.use('/api/listings', listingsRouter);
app.use('/api/listings/:id/reviews', reviewsRouter);
app.use('/api/users', userRouter);
app.use('/api/bookings', bookingRouter);

// ---------- 404 HANDLER ----------
app.use((req, res, next) => {
    res.status(404).json({ error: "Page Not Found" });
});

// ---------- ERROR HANDLER ----------
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong!";
    console.error("Error:", err);
    res.status(statusCode).json({ error: message });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
