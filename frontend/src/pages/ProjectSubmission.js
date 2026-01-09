import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiUpload, FiCheckCircle, FiAlertTriangle, FiXCircle, FiLoader, FiTrash2, FiEye, FiEdit } from 'react-icons/fi';
import './ProjectSubmission.css';

const ProjectSubmission = () => {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [usePDF, setUsePDF] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    fullText: '',
    department: '',
    courseId: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects/my-projects');
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchCourses = async (departmentId) => {
    try {
      const response = await api.get(`/courses/department/${departmentId}`);
      setCourses(response.data.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setFormData({ ...formData, department: deptId, courseId: '' });
    if (deptId) {
      fetchCourses(deptId);
    } else {
      setCourses([]);
    }
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('File size must be less than 10MB');
      return;
    }

    setPdfFile(file);

    try {
      setUploadingPDF(true);
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await api.post('/projects/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { title, abstract, fullText, numPages, wordCount } = response.data.data;

      setFormData(prev => ({
        ...prev,
        title,
        abstract,
        fullText,
      }));

      alert(`PDF uploaded successfully!\n\nPages: ${numPages}\nWords: ${wordCount}\n\nPlease review the extracted text and make any necessary corrections.`);
    } catch (error) {
      console.error('PDF upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload PDF');
      setPdfFile(null);
    } finally {
      setUploadingPDF(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.abstract || !formData.fullText || !formData.department) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/projects/submit', formData);
      await fetchProjects();
      setShowModal(false);
      setFormData({
        title: '',
        abstract: '',
        fullText: '',
        department: '',
        courseId: '',
      });
      setPdfFile(null);
      setUploadingPDF(false);
      setUsePDF(true);
      alert('Project created successfully! You can now check for plagiarism.');
    } catch (error) {
      console.error('Error submitting project:', error);
      alert(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPlagiarism = async (projectId) => {
    if (!window.confirm('This will check your project for plagiarism. This process takes 30-60 seconds. Continue?')) {
      return;
    }

    try {
      setChecking(true);
      const response = await api.post(`/projects/${projectId}/check-plagiarism`);
      await fetchProjects();

      const report = response.data.data.plagiarismReport;
      alert(`Plagiarism Check Complete!\n\nScore: ${report.overallScore}%\nStatus: ${report.status}\n\n${report.verdict}`);
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      alert(error.response?.data?.message || 'Failed to check plagiarism');
    } finally {
      setChecking(false);
    }
  };

  const handleViewReport = async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/plagiarism-report`);
      setSelectedProject(response.data.data);
      setShowReport(true);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Failed to fetch plagiarism report');
    }
  };

  const handleFinalizeSubmission = async (projectId) => {
    if (!window.confirm('Are you sure you want to submit this project for final review? You cannot edit it after submission.')) {
      return;
    }

    try {
      await api.put(`/projects/${projectId}/finalize`);
      await fetchProjects();
      alert('Project submitted successfully for review!');
    } catch (error) {
      console.error('Error finalizing submission:', error);
      alert(error.response?.data?.message || 'Failed to submit project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      await fetchProjects();
      alert('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPdfFile(null);
    setUploadingPDF(false);
    setUsePDF(true);
    setFormData({
      title: '',
      abstract: '',
      fullText: '',
      department: '',
      courseId: '',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ORIGINAL':
        return <FiCheckCircle className="status-icon success" />;
      case 'SUSPICIOUS':
        return <FiAlertTriangle className="status-icon warning" />;
      case 'PLAGIARIZED':
        return <FiXCircle className="status-icon danger" />;
      case 'CHECKING':
        return <FiLoader className="status-icon checking spin" />;
      default:
        return <FiUpload className="status-icon pending" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ORIGINAL':
        return 'status-success';
      case 'SUSPICIOUS':
        return 'status-warning';
      case 'PLAGIARIZED':
        return 'status-danger';
      case 'CHECKING':
        return 'status-checking';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="project-submission-container">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Final Year Project Submission</h1>
            <p>Submit your project and check for plagiarism using AI</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <FiUpload /> New Project
          </button>
        </div>

        {/* Project List */}
        <div className="projects-grid">
          {projects.length === 0 ? (
            <div className="no-projects">
              <FiUpload size={64} />
              <p>No projects yet. Create your first project to get started!</p>
              <button onClick={() => setShowModal(true)} className="btn btn-primary">
                Create Project
              </button>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project._id} className="project-card">
                <div className="project-header">
                  <h3>{project.title}</h3>
                  <span className={`submission-status ${project.submissionStatus.toLowerCase()}`}>
                    {project.submissionStatus}
                  </span>
                </div>

                <div className="project-meta">
                  <span><strong>Department:</strong> {project.department?.name}</span>
                  {project.courseId && (
                    <span><strong>Course:</strong> {project.courseId.courseName}</span>
                  )}
                  <span><strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="project-abstract">
                  <p>{project.abstract.substring(0, 150)}...</p>
                </div>

                {/* Plagiarism Status */}
                <div className={`plagiarism-status ${getStatusClass(project.plagiarismReport.status)}`}>
                  {getStatusIcon(project.plagiarismReport.status)}
                  <div className="status-info">
                    <span className="status-label">{project.plagiarismReport.status}</span>
                    {project.plagiarismReport.overallScore > 0 && (
                      <span className="status-score">{project.plagiarismReport.overallScore}% Similarity</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="project-actions">
                  {project.plagiarismReport.status === 'PENDING' && (
                    <button
                      onClick={() => handleCheckPlagiarism(project._id)}
                      className="btn btn-primary btn-sm"
                      disabled={checking}
                    >
                      {checking ? 'Checking...' : 'Check Plagiarism'}
                    </button>
                  )}

                  {project.plagiarismReport.status !== 'PENDING' && project.plagiarismReport.status !== 'CHECKING' && (
                    <button
                      onClick={() => handleViewReport(project._id)}
                      className="btn btn-secondary btn-sm"
                    >
                      <FiEye /> View Report
                    </button>
                  )}

                  {(project.plagiarismReport.status === 'ORIGINAL' || project.plagiarismReport.status === 'SUSPICIOUS') &&
                   project.submissionStatus === 'DRAFT' && (
                    <button
                      onClick={() => handleFinalizeSubmission(project._id)}
                      className="btn btn-success btn-sm"
                    >
                      Submit for Review
                    </button>
                  )}

                  {project.submissionStatus === 'DRAFT' && (
                    <button
                      onClick={() => handleDeleteProject(project._id)}
                      className="btn btn-danger btn-sm"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Project Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Submit New Project</h2>
                <button onClick={handleCloseModal} className="close-btn">×</button>
              </div>

              <form onSubmit={handleSubmit} className="project-form">
                {/* Upload Method Toggle */}
                <div className="upload-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${usePDF ? 'active' : ''}`}
                    onClick={() => setUsePDF(true)}
                  >
                    <FiUpload size={18} /> Upload PDF
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${!usePDF ? 'active' : ''}`}
                    onClick={() => setUsePDF(false)}
                  >
                    <FiEdit size={18} /> Manual Entry
                  </button>
                </div>

                {/* PDF Upload Section */}
                {usePDF && (
                  <div className="pdf-upload-section">
                    <div className="form-group">
                      <label>Upload Project PDF *</label>
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          id="pdf-upload"
                          accept=".pdf"
                          onChange={handlePDFUpload}
                          className="file-input"
                          disabled={uploadingPDF}
                        />
                        <label htmlFor="pdf-upload" className="file-input-label">
                          <FiUpload size={24} />
                          <span>
                            {pdfFile ? pdfFile.name : 'Click to upload or drag PDF here'}
                          </span>
                          <small>Maximum file size: 10MB</small>
                        </label>
                      </div>
                      {uploadingPDF && (
                        <div className="upload-progress">
                          <div className="spinner"></div>
                          <span>Extracting text from PDF...</span>
                        </div>
                      )}
                    </div>

                    {pdfFile && !uploadingPDF && (
                      <div className="info-box success">
                        <FiCheckCircle />
                        <p>
                          <strong>PDF uploaded successfully!</strong><br />
                          Review the extracted information below and edit if needed before submitting.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label>Project Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter your project title"
                    required
                    disabled={uploadingPDF}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Department *</label>
                    <select
                      value={formData.department}
                      onChange={handleDepartmentChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Course (Optional)</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                      disabled={!formData.department}
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.courseCode} - {course.courseName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Abstract *</label>
                  <textarea
                    value={formData.abstract}
                    onChange={(e) => setFormData({...formData, abstract: e.target.value})}
                    placeholder="Enter project abstract (200-500 words)"
                    rows="6"
                    required
                    disabled={uploadingPDF}
                  />
                  <small>{formData.abstract.length} characters</small>
                </div>

                <div className="form-group">
                  <label>Full Project Text *</label>
                  <textarea
                    value={formData.fullText}
                    onChange={(e) => setFormData({...formData, fullText: e.target.value})}
                    placeholder="Paste your complete project text here (Introduction, Methodology, Implementation, Results, Conclusion, etc.)"
                    rows="15"
                    required
                    disabled={uploadingPDF}
                  />
                  <small>{formData.fullText.length} characters</small>
                </div>

                <div className="info-box">
                  <FiAlertTriangle />
                  <p><strong>Important:</strong> {usePDF ? 'Upload your complete project PDF file. ' : ''}After submission, your project will be checked for plagiarism using AI.
                  Make sure all content is original and properly cited. Projects with 70%+ similarity will be rejected.</p>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading || uploadingPDF}>
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Plagiarism Report Modal */}
        {showReport && selectedProject && (
          <div className="modal-overlay" onClick={() => setShowReport(false)}>
            <div className="modal-content large report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Plagiarism Report</h2>
                <button onClick={() => setShowReport(false)} className="close-btn">×</button>
              </div>

              <div className="report-content">
                <div className="report-header">
                  <h3>{selectedProject.projectTitle}</h3>
                  <span className="student-name">by {selectedProject.studentName}</span>
                </div>

                <div className={`report-score ${getStatusClass(selectedProject.plagiarismReport.status)}`}>
                  <div className="score-circle">
                    <span className="score-number">{selectedProject.plagiarismReport.overallScore}%</span>
                    <span className="score-label">Similarity</span>
                  </div>
                  <div className="verdict-box">
                    {getStatusIcon(selectedProject.plagiarismReport.status)}
                    <h4>{selectedProject.plagiarismReport.status}</h4>
                    <p>{selectedProject.plagiarismReport.verdict}</p>
                  </div>
                </div>

                <div className="report-section">
                  <h4>Detailed Analysis</h4>
                  <p>{selectedProject.plagiarismReport.detailedAnalysis}</p>
                </div>

                {selectedProject.plagiarismReport.databaseMatches?.length > 0 && (
                  <div className="report-section">
                    <h4>Similar Projects Found ({selectedProject.plagiarismReport.databaseMatches.length})</h4>
                    {selectedProject.plagiarismReport.databaseMatches.map((match, index) => (
                      <div key={index} className="match-item">
                        <div className="match-header">
                          <strong>{match.projectTitle || 'Untitled Project'}</strong>
                          <span className="similarity-badge">{match.similarity}% Similar</span>
                        </div>
                        <p className="match-student">Student: {match.studentName}</p>
                        {match.matchedSections && match.matchedSections.length > 0 && (
                          <div className="matched-sections">
                            <strong>Matched Sections:</strong>
                            <ul>
                              {match.matchedSections.map((section, i) => (
                                <li key={i}>{section}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedProject.plagiarismReport.webSources?.length > 0 && (
                  <div className="report-section">
                    <h4>Potential Web Sources ({selectedProject.plagiarismReport.webSources.length})</h4>
                    {selectedProject.plagiarismReport.webSources.map((source, index) => (
                      <div key={index} className="source-item">
                        <div className="source-header">
                          <strong>{source.sourceType}</strong>
                          <span className="likelihood-badge">{source.likelihood}% Likelihood</span>
                        </div>
                        <p>{source.reason}</p>
                        {source.indicators && source.indicators.length > 0 && (
                          <div className="indicators">
                            <strong>Indicators:</strong>
                            <ul>
                              {source.indicators.map((indicator, i) => (
                                <li key={i}>{indicator}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="report-footer">
                  <small>
                    Report generated on: {new Date(selectedProject.plagiarismReport.checkedAt).toLocaleString()}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSubmission;
