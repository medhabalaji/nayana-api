require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // We need this to find your frontend folder

const app = express();

app.use(cors());
app.use(express.json());

// This line tells your server to host the UI files in your frontend/public folder
app.use(express.static(path.join(__dirname, 'frontend/public')));

// When you go to localhost:5000, it will serve your index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Nayana API running on http://localhost:${PORT}`);
});