require('dotenv').config();


const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ExpressError = require("./utils/ExpressError.js");


const listingsRouter = require('./routes/listing.js');
const reviewsRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');

const cookieParser = require('cookie-parser');
app.use(cookieParser());


const dburl = process.env.ATLASDB_URL;
async function main() {
    try {
        await mongoose.connect(dburl);
        console.log(" Connected to MongoDB");
    } catch (err) {
        console.error(" MongoDB connection error:", err);
    }
}
main();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'))); // For serving images if needed
const cors = require('cors');
app.use(cors({
  origin: ['https://list-n-rent.vercel.app', 'http://localhost:3000'],
  credentials: true
}));



// API routes
app.use('/api/listings', listingsRouter);
app.use('/api/listings/:id/reviews', reviewsRouter);
app.use('/api/users', userRouter);
app.use('/api/bookings', require('./routes/booking.js'));


// Catch-all route for 404 errors
app.use((req, res, next) => {
    res.status(404).json({ error: "Page Not Found" });
});


// Error handling middleware (returns JSON)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong!";
    console.error("Error:", err);
    res.status(statusCode).json({ error: message });
});



app.listen(8080, () => {
    console.log('Server is running on port 8080');
});


