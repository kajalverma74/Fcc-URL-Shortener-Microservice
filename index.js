// Importing required modules
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
const urlparser = require('url');

// Initialize Express app
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.DB_URL);
const db = client.db("urlshortner");
const urls = db.collection("urls"); // Fetch the database URL from .env file

app.use(cors()); // Enable CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`)); // Serve static files

// MongoDB Connection
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Successfully connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// POST route to handle URL shortening
app.post('/api/shorturl', (req, res) => {
  const url = req.body.url;

  dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
    if (!address) {
      res.json({ error: "invalid URL" });
    } else {
      try {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount + 1,
        };
        const result = await urls.insertOne(urlDoc);
        console.log(result);
        res.json({ original_url: url, short_url: urlCount + 1 });
      } catch (error) {
        console.error('Error saving URL:', error);
        res.status(500).json({ error: 'Database operation failed' });
      }
    }
  });
});


app.get("/api/shorturl/:short_url", async (req, res) =>{
  const shorturl = req.params.short_url
  const urlDoc = await urls.findOne({ short_url: +shorturl})
  res.redirect(urlDoc.url)
})
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
