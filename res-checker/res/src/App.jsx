import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/webpack';

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

const ATSChecker = () => {
  const [file, setFile] = useState(null);
  const [jobSkills, setJobSkills] = useState('');
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
    const sections = extractSections(resumeText);
    return {
      skills: sections.skills.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0),
      education: sections.education,
      experience: sections.experience,
      projects: sections.projects
    };
  };

  const extractSections = (text) => {
    const sections = {
      skills: '',
      education: '',
      experience: '',
      projects: ''
    };

    const sectionMarkers = {
      skills: /(?:SKILLS|Technical Skills|Core Competencies|TECHNICAL EXPERTISE)(?:|\s)/i,
      education: /(?:EDUCATION|Academic Background|QUALIFICATIONS)(?:|\s)/i,
      experience: /(?:EXPERIENCE|Work Experience|Professional Experience|Employment History)(?:|\s)/i,
      projects: /(?:PROJECTS|Key Projects|Personal Projects)(?:|\s)/i
    };

    const positions = [];
    for (const [section, regex] of Object.entries(sectionMarkers)) {
      const match = text.match(regex);
      if (match) {
        positions.push({
          section,
          index: match.index,
          end: match.index + match[0].length
        });
      }
    }

    positions.sort((a, b) => a.index - b.index);

    positions.forEach((pos, idx) => {
      const startIndex = pos.end;
      const endIndex = idx < positions.length - 1 ? positions[idx + 1].index : text.length;
      sections[pos.section] = text.slice(startIndex, endIndex).trim();
    });

    return sections;
  };

  const calculateScore = (resumeSkills, jobSkillsStr) => {
    const requiredSkills = jobSkillsStr
      .split(',')
      .map(skill => skill.trim().toLowerCase())
      .filter(skill => skill.length > 0);

    if (requiredSkills.length === 0) return { score: 0, matchedSkills: [], unmatchedSkills: [] };

    const matchedSkills = [];
    const unmatchedSkills = [];

    requiredSkills.forEach(reqSkill => {
      const found = resumeSkills.some(skill => 
        skill.toLowerCase().includes(reqSkill) ||
        reqSkill.includes(skill.toLowerCase())
      );
      if (found) {
        matchedSkills.push(reqSkill);
      } else {
        unmatchedSkills.push(reqSkill);
      }
    });

    const score = Math.round((matchedSkills.length / requiredSkills.length) * 100);

    return {
      score,
      matchedSkills,
      unmatchedSkills
    };
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !jobSkills) return;

    setIsLoading(true);
    try {
      const resumeText = await extractTextFromPdf(file);
      const parsedResume = parseResume(resumeText);
      const scoreResult = calculateScore(parsedResume.skills, jobSkills);
      
      setScore(scoreResult.score);
      setExtractedInfo({
        ...parsedResume,
        matchedSkills: scoreResult.matchedSkills,
        unmatchedSkills: scoreResult.unmatchedSkills
      });

      // Prepare data for backend
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('skills', JSON.stringify(parsedResume.skills));
      formData.append('score', scoreResult.score);
      formData.append('education', parsedResume.education);
      formData.append('experience', parsedResume.experience);
      formData.append('projects', parsedResume.projects);

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload resume');
      }
    } catch (error) {
      console.error("Error processing resume:", error);
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
    <div id="ats-checker" className="container mt-5">
      <nav className="navbar navbar-expand-lg navbar-light mb-4">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">ATS Checker</a>
          <div className="collapse navbar-collapse justify-content-end">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="#ats-scorer">ATS Scorer</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#history">History</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <h1 className="text-center mb-4">ATS Resume Checker</h1>
      
      <div className="row">
        <div className="col-12 col-md-6">
          <div className="card mb-4" style={{ backgroundColor: '#fff399'}}>
            <div className="card-header">
              <h5>Upload Resume & Required Skills</h5>
              <p>Get your resume ATS score instantly</p>
            </div>
            <div className="card-body" style={{ backgroundColor: '#fff399'}}>
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
                  <label htmlFor="jobSkills" className="form-label">
                    Job Description Skills (comma-separated)
                  </label>
                  <input
                    id="jobSkills"
                    type="text"
                    value={jobSkills}
                    onChange={(e) => setJobSkills(e.target.value)}
                    placeholder="e.g., Python, JavaScript, React, SQL"
                    className="form-control"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  style={{ padding: '0.4em 1em', fontSize: '1em' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Check Resume'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card mb-4" style={{ backgroundColor: '#fff399'}}>
            <div className="card-header">
              <h5>ATS Analysis Results</h5>
            </div>
            <div className="card-body" style={{ backgroundColor: '#fff399'}}>
              {score !== null ? (
                <div className="mb-3">
                  <h6>Skills Match Score</h6>
                  <div className="progress mb-3">
                    <div
                      className={`progress-bar ${score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-danger'}`}
                      role="progressbar"
                      style={{ width: `${score}%` }}
                      aria-valuenow={score}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {score}%
                    </div>
                  </div>
                  
                  {extractedInfo && (
                    <div className="mt-4">
                      <div className="mb-3">
                        <h6 className="text-success">Matched Skills ({extractedInfo.matchedSkills.length})</h6>
                        <p>{extractedInfo.matchedSkills.join(', ') || 'No matching skills found'}</p>
                      </div>
                      
                      <div className="mb-3">
                        <h6 className="text-danger">Missing Skills ({extractedInfo.unmatchedSkills.length})</h6>
                        <p>{extractedInfo.unmatchedSkills.join(', ') || 'No missing skills'}</p>
                      </div>

                      <div className="mb-3">
                        <h6>All Resume Skills</h6>
                        <p>{extractedInfo.skills.join(', ') || 'No skills found'}</p>
                      </div>

                      <div className="mb-3">
                        <h6>Education</h6>
                        <p>{extractedInfo.education || 'Not found'}</p>
                      </div>

                      <div className="mb-3">
                        <h6>Experience</h6>
                        <p>{extractedInfo.experience || 'Not found'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted">
                  Upload your resume and enter Job Description to see your ATS score.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-5 mb-5" id="history">
        <h1 className="text-center mb-4">Resume History</h1>
        <div className="row">
          {resumes.map((resume, index) => (
            <div className="col-12 col-md-6 col-lg-4 mb-4" key={index}>
              <div className="card">
                <div className="card-header">
                  <h5>Resume {index + 1}</h5>
                </div>
                <div className="card-body">
                  <h6>Skills Match Score: {resume.score}%</h6>
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
