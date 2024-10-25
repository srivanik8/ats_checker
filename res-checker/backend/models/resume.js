// res-checker/backend/models/Resume.js
const mongoose = require('mongoose');

// Define a schema for the resume
const resumeSchema = new mongoose.Schema({
  file: {
    type: Buffer,
    required: true, // Ensure that the file is required
  },
  contentType: {
    type: String,
    required: true, // Ensure that the content type is required
  },
  matchedSkills: {
    type: [String], // Array of strings to store matched skills
    default: [], // Default to an empty array
  },
});

// Create a model from the schema
const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
