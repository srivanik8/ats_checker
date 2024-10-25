const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/resumeDB');

// Define a schema for the resume
const resumeSchema = new mongoose.Schema({
  file: Buffer,
  contentType: String,
});

const Resume = mongoose.model('Resume', resumeSchema);

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to upload resume
app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const newResume = new Resume({
      file: req.file.buffer,
      contentType: req.file.mimetype,
    });
    await newResume.save();
    res.status(201).send('Resume uploaded successfully');
  } catch (error) {
    res.status(500).send('Error uploading resume');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});