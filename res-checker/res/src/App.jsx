import React, { useState, useEffect } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/webpack';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

const ATSChecker = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [score, setScore] = useState(null);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resumes, setResumes] = useState([]);

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
    const experience = extractExperience(resumeText);
    const education = extractEducation(resumeText);
    return { skills, experience, education };
  };

  const extractSkills = (text) => {
    const skillRegex = /(?:Skills|Skillset):?\s*([\s\S]*?)(?:Experience|Education|$)/i;
    const match = text.match(skillRegex);
    return match ? match[1].split(',').map(skill => skill.trim()) : [];
  };

  const extractExperience = (text) => {
    const experienceRegex = /(?:Experience|Work History):?\s*([\s\S]*?)(?:Education|$)/i;
    const match = text.match(experienceRegex);
    return match ? match[1].trim() : 'Not found';
  };

  const extractEducation = (text) => {
    const educationRegex = /(?:Education|Qualifications):?\s*([\s\S]*?)(?:Skills|Experience|$)/i;
    const match = text.match(educationRegex);
    return match ? match[1].trim() : 'Not found';
  };

  const calculateScore = (extractedSkills, jobDescription, experience, education) => {
    let score = 0;

    if (experience !== 'Not found') {
      score += 10; // Add 10 points for having experience
    }
    if (education !== 'Not found') {
      score += 10; // Add 10 points for having education
    }

    const jobSkills = jobDescription.split(',').map(skill => skill.trim());
    const matchedSkills = extractedSkills.filter(skill => jobSkills.includes(skill));
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
      const parsedInfo = parseResume(resumeText);
      const score = calculateScore(parsedInfo.skills, jobDescription, parsedInfo.experience, parsedInfo.education);
      setScore(score);
      setExtractedInfo(parsedInfo);

      // Prepare data to send to the backend
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('skills', JSON.stringify(parsedInfo.skills));
      formData.append('score', score);
      formData.append('education', parsedInfo.education);
      formData.append('experience', parsedInfo.experience);

      // Send data to the backend
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload resume');
      }

      console.log('Resume uploaded successfully');
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await fetch('http://localhost:5000/history');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <a className="navbar-brand mx-auto" href="#">ATS Checker</a>
          <div className="collapse navbar-collapse justify-content-end">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="#ats-checker">Resume Checker</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#history">History</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mt-5" id="ats-checker">
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
                <h5>ATS Score</h5>
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

      <div className="container mt-5" id="history">
        <h1 className="text-center mb-4">Resume History</h1>
        <div className="row">
          {resumes.map((resume, index) => (
            <div className="col-12 col-md-6 col-lg-4 mb-4" key={index}>
              <div className="card">
                <div className="card-header">
                  <h5>Resume {index + 1}</h5>
                </div>
                <div className="card-body">
                  <h6>ATS Score: {resume.score}</h6>
                  <h6>Skills:</h6>
                  <p>{resume.skills.join(', ')}</p>
                  <h6>Education:</h6>
                  <p>{resume.education}</p>
                  <h6>Experience:</h6>
                  <p>{resume.experience}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ATSChecker;
