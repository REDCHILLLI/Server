const express = require('express');
const mongoose = require('mongoose');
const geolib = require('geolib');

const app = express();
app.use(express.json());

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/locationDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define a schema for location data
const locationSchema = new mongoose.Schema({
    inTime: Date,
    outTime: Date,
    coordinates: {
        latitude: Number,
        longitude: Number
    }
});

const Location = mongoose.model('Location', locationSchema);

// Static location
const staticLocation = {
    latitude: 12.9715987,  // Example latitude
    longitude: 77.594566,  // Example longitude
};

// Function to calculate distance
const calculateDistance = (coords1, coords2) => {
    return geolib.getDistance(coords1, coords2);
};

// API endpoint to receive location data from the mobile app
app.post('/location', async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).send('Invalid location data');
    }

    const mobileLocation = { latitude, longitude };
    const distance = calculateDistance(staticLocation, mobileLocation);

    let locationEntry = await Location.findOne().sort({ inTime: -1 });

    if (distance <= 200) {
        if (!locationEntry || locationEntry.outTime) {
            locationEntry = new Location({
                inTime: new Date(),
                coordinates: mobileLocation,
            });
            await locationEntry.save();
            return res.status(200).send('In-time recorded');
        }
    } else {
        if (locationEntry && !locationEntry.outTime) {
            locationEntry.outTime = new Date();
            await locationEntry.save();
            return res.status(200).send('Out-time recorded');
        }
    }

    res.status(200).send('Location processed');
});

// Start the server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
