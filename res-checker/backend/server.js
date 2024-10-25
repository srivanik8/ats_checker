const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect('mongodb+srv://user1:user1@cluster0.i1mot.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch(err => console.error('MongoDB connection error:', err));

// Define a schema for the uploaded data
const resumeSchema = new mongoose.Schema({
  file: Buffer, // Store the file as a buffer
  skills: [String], // Array of matching skills
  score: Number, // ATS Score
  education: String, // Education details
  experience: String // Experience details
});

// Create a model
const ResumeModel = mongoose.model('Resume', resumeSchema);

// Route to upload resume
app.post('/upload', upload.single('resume'), async (req, res) => {
  const { skills, score, education, experience } = req.body; // Extract skills, score, education, and experience from request
  const file = req.file.buffer; // Get the uploaded file buffer

  const newResume = new ResumeModel({ file, skills, score, education, experience }); // Create a new document
  await newResume.save(); // Save to MongoDB
  res.status(201).send('Resume uploaded successfully'); // Send response
});

// Function to extract text from PDF (you need to implement this)
async function extractTextFromPdf(buffer) {
  // Implement PDF extraction logic here
  // Return the extracted text
}

// Function to extract skills from text (you need to implement this)
function extractSkills(text) {
  // Implement skill extraction logic here
  // Return an array of skills
}

// Endpoint to get all resumes for history
app.get('/history', async (req, res) => {
  const resumes = await ResumeModel.find(); // Retrieve all documents
  res.json(resumes); // Send back the documents
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
