import React, { useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/webpack';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

// Set the workerSrc for PDF.js
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

const ATSChecker = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [score, setScore] = useState(null);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const extractTextFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + ' ';
    }

    return fullText;
  };

  const parseResume = (resumeText) => {
    const skills = extractSkills(resumeText);
    console.log("Extracted Skills:", skills); // Log extracted skills
    const experience = extractExperience(resumeText);
    console.log("Extracted Experience:", experience); // Log extracted experience
    const education = extractEducation(resumeText);
    console.log("Extracted Education:", education); // Log extracted education
    return { skills, experience, education };
  };

  const extractSkills = (text) => {
    // Simple regex to find skills (customize as needed)
    const skillRegex = /(?:Skills|Skillset):?\s*([\s\S]*?)(?:Experience|Education|$)/i;
    const match = text.match(skillRegex);
    return match ? match[1].split(',').map(skill => skill.trim()) : [];
  };

  const extractExperience = (text) => {
    // Simple regex to find experience (customize as needed)
    const experienceRegex = /(?:Experience|Work History):?\s*([\s\S]*?)(?:Education|$)/i;
    const match = text.match(experienceRegex);
    return match ? match[1].trim() : 'Not found';
  };

  const extractEducation = (text) => {
    // Simple regex to find education (customize as needed)
    const educationRegex = /(?:Education|Qualifications):?\s*([\s\S]*?)(?:Skills|Experience|$)/i;
    const match = text.match(educationRegex);
    return match ? match[1].trim() : 'Not found';
  };

  const calculateScore = (extractedSkills, jobDescription, experience, education) => {
    let score = 0;

    // Add base score for having both experience and education
    if (experience !== 'Not found') {
      score += 10; // Add 10 points for having experience
    }
    if (education !== 'Not found') {
      score += 10; // Add 10 points for having education
    }

    // Calculate skill matching score
    const jobSkills = jobDescription.split(',').map(skill => skill.trim());
    const matchedSkills = extractedSkills.filter(skill => jobSkills.includes(skill));
    
    // Add points for each matching skill
    score += matchedSkills.length * 5; // Add 5 points for each matching skill

    return score; // Return the total score
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !jobDescription) return;

    setIsLoading(true);
    try {
      const resumeText = await extractTextFromPdf(file);
      console.log("Extracted Resume Text:", resumeText); // Log extracted text
      const parsedInfo = parseResume(resumeText);
      console.log("Parsed Info:", parsedInfo); // Log parsed information
      const score = calculateScore(parsedInfo.skills, jobDescription, parsedInfo.experience, parsedInfo.education);
      console.log("Calculated Score:", score); // Log calculated score
      setScore(score);
      setExtractedInfo(parsedInfo);
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">ATS Resume Checker</h1>
      
      <div className="row">
        <div className="col-12 col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Upload Resume & Job Description</h5>
              <p>Get your resume ATS score instantly</p>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="mb-3">
                <div className="mb-3">
                  <label htmlFor="resume" className="form-label">
                    Upload Resume (PDF file)
                  </label>
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="jobDescription" className="form-label">
                    Job Description (comma-separated skills)
                  </label>
                  <textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    required
                    className="form-control"
                    rows="5"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Check Resume'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>ATS Score & Extracted Information</h5>
              <p>See how well your resume matches the job description</p>
            </div>
            <div className="card-body">
              {score !== null ? (
                <div className="mb-3">
                  <h6>ATS Score</h6>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${score}%` }}
                      aria-valuenow={score}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {score.toFixed(2)}%
                    </div>
                  </div>
                  {extractedInfo && (
                    <div className="mt-3">
                      <h6>Skills</h6>
                      <p>{extractedInfo.skills.join(', ')}</p>
                      <h6>Experience</h6>
                      <p>{extractedInfo.experience || 'Not found'}</p>
                      <h6>Education</h6>
                      <p>{extractedInfo.education || 'Not found'}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted">
                  Upload your resume and enter a job description to see your ATS score.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSChecker;
