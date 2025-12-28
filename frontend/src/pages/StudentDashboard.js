import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDate } from '../utils/dateHelper';
import {
  FiBook,
  FiFileText,
  FiGrid,
  FiAward,
  FiTrendingUp,
  FiClock,
  FiUpload,
  FiX,
  FiCheckCircle,
  FiArrowLeft
} from 'react-icons/fi';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState(1); // 1: Faculty, 2: Department, 3: Course, 4: Material
  const [uploadForm, setUploadForm] = useState({
    title: '',
    facultyId: '',
    departmentId: '',
    courseId: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [uploadStats, setUploadStats] = useState(null);
  const [newFaculty, setNewFaculty] = useState('');
  const [newDepartment, setNewDepartment] = useState({ name: '', code: '' });
  const [newCourse, setNewCourse] = useState({ name: '', code: '', creditUnits: 3 });

  useEffect(() => {
    fetchStats();
    fetchFaculties();
    fetchUploadStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stats/student');
      setStats(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await api.get('/faculties');
      setFaculties(response.data.data || []);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const fetchDepartments = async (facultyId) => {
    try {
      const response = await api.get(`/faculties/${facultyId}/departments`);
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchCourses = async (departmentId) => {
    try {
      const response = await api.get(`/courses/department/${departmentId}`);
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchUploadStats = async () => {
    try {
      const response = await api.get('/materials/my-stats');
      setUploadStats(response.data.data);
    } catch (error) {
      console.error('Error fetching upload stats:', error);
    }
  };

  const handleFacultySelect = async (facultyId) => {
    setUploadForm({ ...uploadForm, facultyId, departmentId: '', courseId: '' });
    setUploadError(null);
    if (facultyId && facultyId !== 'new') {
      await fetchDepartments(facultyId);
      setUploadStep(2);
    }
  };

  const handleDepartmentSelect = async (departmentId) => {
    setUploadForm({ ...uploadForm, departmentId, courseId: '' });
    setUploadError(null);
    if (departmentId && departmentId !== 'new') {
      await fetchCourses(departmentId);
      setUploadStep(3);
    }
  };

  const handleCourseSelect = (courseId) => {
    setUploadForm({ ...uploadForm, courseId });
    setUploadError(null);
    if (courseId && courseId !== 'new') {
      setUploadStep(4);
    }
  };

  const createFaculty = async () => {
    if (!newFaculty.trim()) {
      setUploadError('Please enter a faculty name');
      return;
    }
    try {
      const response = await api.post('/faculties', { name: newFaculty });
      await fetchFaculties();
      setUploadForm({ ...uploadForm, facultyId: response.data.data._id });
      setNewFaculty('');
      await fetchDepartments(response.data.data._id);
      setUploadStep(2);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to create faculty');
    }
  };

  const createDepartment = async () => {
    if (!newDepartment.name.trim() || !newDepartment.code.trim()) {
      setUploadError('Please enter department name and code');
      return;
    }
    try {
      const response = await api.post('/departments', {
        ...newDepartment,
        facultyId: uploadForm.facultyId
      });
      await fetchDepartments(uploadForm.facultyId);
      setUploadForm({ ...uploadForm, departmentId: response.data.data._id });
      setNewDepartment({ name: '', code: '' });
      await fetchCourses(response.data.data._id);
      setUploadStep(3);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to create department');
    }
  };

  const createCourse = async () => {
    if (!newCourse.courseName.trim() || !newCourse.courseCode.trim()) {
      setUploadError('Please enter course name and code');
      return;
    }
    try {
      const response = await api.post('/courses', {
        ...newCourse,
        departmentId: uploadForm.departmentId
      });
      await fetchCourses(uploadForm.departmentId);
      setUploadForm({ ...uploadForm, courseId: response.data.data._id });
      setNewCourse({ courseName: '', courseCode: '', creditUnits: 3 });
      setUploadStep(4);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('courseId', uploadForm.courseId);

      const response = await api.post('/materials/student-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadSuccess(response.data.message);
      setUploadForm({ title: '', facultyId: '', departmentId: '', courseId: '', file: null });
      setUploadStep(1);
      fetchUploadStats();
      fetchStats();

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadModal = () => {
    setShowUploadModal(false);
    setUploadStep(1);
    setUploadForm({ title: '', facultyId: '', departmentId: '', courseId: '', file: null });
    setUploadError(null);
    setUploadSuccess(null);
    setNewFaculty('');
    setNewDepartment({ name: '', code: '' });
    setNewCourse({ courseName: '', courseCode: '', creditUnits: 3 });
  };

  if (loading) {
    return (
      <div className="student-dashboard-container">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>My Learning Dashboard</h1>
            <p>Track your progress and explore study materials</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div className="stat-icon">
              <FiBook />
            </div>
            <div className="stat-details">
              <h3>{stats?.overview?.totalCourses || 0}</h3>
              <p>Available Courses</p>
            </div>
          </div>

          <div className="stat-card stat-card-purple">
            <div className="stat-icon">
              <FiFileText />
            </div>
            <div className="stat-details">
              <h3>{stats?.overview?.totalMaterials || 0}</h3>
              <p>Study Materials</p>
            </div>
          </div>

          <div className="stat-card stat-card-green">
            <div className="stat-icon">
              <FiFileText />
            </div>
            <div className="stat-details">
              <h3>{stats?.overview?.totalSummaries || 0}</h3>
              <p>Summaries Available</p>
              <span className="stat-badge">{stats?.overview?.materialWithSummaries || 0}% of materials</span>
            </div>
          </div>

          <div className="stat-card stat-card-orange">
            <div className="stat-icon">
              <FiGrid />
            </div>
            <div className="stat-details">
              <h3>{stats?.overview?.totalQuestions || 0}</h3>
              <p>Practice Questions</p>
              <span className="stat-badge">{stats?.overview?.avgQuestionsPerCourse || 0} per course</span>
            </div>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="progress-section">
          <div className="progress-card">
            <h2>
              <FiTrendingUp /> Learning Progress
            </h2>
            <div className="progress-items">
              <div className="progress-item">
                <div className="progress-item-header">
                  <span>Materials with Summaries</span>
                  <strong>{stats?.overview?.materialWithSummaries || 0}%</strong>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill progress-fill-blue"
                    style={{ width: `${stats?.overview?.materialWithSummaries || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-item-header">
                  <span>Available Practice Questions</span>
                  <strong>{stats?.overview?.totalQuestions || 0} questions</strong>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill progress-fill-green"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Materials */}
          <div className="progress-card">
            <h2>
              <FiClock /> Recently Added Materials
            </h2>
            <div className="recent-materials-list">
              {stats?.recentMaterials && stats.recentMaterials.length > 0 ? (
                stats.recentMaterials.map((material) => (
                  <Link
                    key={material._id}
                    to={`/course/${material.courseId?._id}`}
                    className="recent-material-item"
                  >
                    <div className="recent-material-icon">
                      <FiFileText />
                    </div>
                    <div className="recent-material-content">
                      <h4>{material.title}</h4>
                      <p>{material.courseId?.courseCode} - {material.courseId?.courseName}</p>
                      <span className="recent-material-date">
                        <FiClock size={12} />
                        {formatDate(material.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="empty-message">No materials available yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Upload Stats */}
        {uploadStats && uploadStats.totalUploads > 0 && (
          <div className="upload-stats-section">
            <h2><FiAward /> My Contributions</h2>
            <div className="upload-stats-grid">
              <div className="upload-stat">
                <h3>{uploadStats.totalUploads}</h3>
                <p>Materials Uploaded</p>
              </div>
              <div className="upload-stat">
                <h3>{uploadStats.totalPoints}</h3>
                <p>Points Earned</p>
              </div>
              <div className="upload-stat">
                <h3>{uploadStats.completed}</h3>
                <p>Processed</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <Link to="/explore" className="quick-action-card">
              <FiBook size={32} />
              <h3>Explore Courses</h3>
              <p>Browse available courses and study materials</p>
            </Link>

            <Link to="/practice" className="quick-action-card">
              <FiGrid size={32} />
              <h3>Practice Questions</h3>
              <p>Test your knowledge with practice questions</p>
            </Link>

            <button
              onClick={() => {
                setShowUploadModal(true);
                setUploadStep(1);
              }}
              className="quick-action-card upload-card"
            >
              <FiUpload size={32} />
              <h3>Upload Material</h3>
              <p>Share course materials and earn points</p>
            </button>
          </div>
        </div>

        {/* Upload Modal - Multi-Step */}
        {showUploadModal && (
          <div className="modal-overlay" onClick={resetUploadModal}>
            <div className="modal-content upload-wizard" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upload Material - Step {uploadStep}/4</h2>
                <button onClick={resetUploadModal} className="modal-close">
                  <FiX />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="upload-steps">
                <div className={`step ${uploadStep >= 1 ? 'active' : ''}`}>Faculty</div>
                <div className={`step ${uploadStep >= 2 ? 'active' : ''}`}>Department</div>
                <div className={`step ${uploadStep >= 3 ? 'active' : ''}`}>Course</div>
                <div className={`step ${uploadStep >= 4 ? 'active' : ''}`}>Material</div>
              </div>

              <div className="upload-form">
                {/* Step 1: Faculty Selection */}
                {uploadStep === 1 && (
                  <div className="step-content">
                    <h3>Select or Create Faculty</h3>
                    <p className="step-description">Choose an existing faculty or create a new one</p>

                    <div className="selection-grid">
                      {faculties.map((faculty) => (
                        <button
                          key={faculty._id}
                          className={`selection-card ${uploadForm.facultyId === faculty._id ? 'selected' : ''}`}
                          onClick={() => handleFacultySelect(faculty._id)}
                        >
                          <FiBook size={24} />
                          <span>{faculty.name}</span>
                        </button>
                      ))}
                      <button
                        className="selection-card create-new"
                        onClick={() => handleFacultySelect('new')}
                      >
                        <FiUpload size={24} />
                        <span>Create New Faculty</span>
                      </button>
                    </div>

                    {faculties.length === 0 && uploadForm.facultyId !== 'new' && (
                      <div className="empty-message">
                        <FiBook size={48} />
                        <p>No faculties available. Click "Create New Faculty" above to get started!</p>
                      </div>
                    )}

                    {uploadForm.facultyId === 'new' && (
                      <div className="create-form">
                        <h4>Create New Faculty</h4>
                        <input
                          type="text"
                          value={newFaculty}
                          onChange={(e) => setNewFaculty(e.target.value)}
                          placeholder="Enter faculty name (e.g., Science, Arts)"
                          className="form-input"
                        />
                        <div className="form-actions">
                          <button
                            onClick={() => setUploadForm({ ...uploadForm, facultyId: '' })}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                          <button onClick={createFaculty} className="btn btn-primary">
                            Create & Continue
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Department Selection */}
                {uploadStep === 2 && (
                  <div className="step-content">
                    <h3>Select or Create Department</h3>
                    <p className="step-description">Choose an existing department or create a new one</p>

                    <div className="selection-grid">
                      {departments.map((dept) => (
                        <button
                          key={dept._id}
                          className={`selection-card ${uploadForm.departmentId === dept._id ? 'selected' : ''}`}
                          onClick={() => handleDepartmentSelect(dept._id)}
                        >
                          <FiBook size={24} />
                          <span>{dept.name}</span>
                          <small>{dept.departmentCode}</small>
                        </button>
                      ))}
                      <button
                        className="selection-card create-new"
                        onClick={() => handleDepartmentSelect('new')}
                      >
                        <FiUpload size={24} />
                        <span>Create New Department</span>
                      </button>
                    </div>

                    {departments.length === 0 && uploadForm.departmentId !== 'new' && (
                      <div className="empty-message">
                        <FiBook size={48} />
                        <p>No departments in this faculty. Click "Create New Department" above to get started!</p>
                      </div>
                    )}

                    {uploadForm.departmentId === 'new' && (
                      <div className="create-form">
                        <h4>Create New Department</h4>
                        <input
                          type="text"
                          value={newDepartment.name}
                          onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                          placeholder="Department name (e.g., Computer Science)"
                          className="form-input"
                        />
                        <input
                          type="text"
                          value={newDepartment.code}
                          onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value })}
                          placeholder="Department code (e.g., CS)"
                          className="form-input"
                        />
                        <div className="form-actions">
                          <button
                            onClick={() => setUploadForm({ ...uploadForm, departmentId: '' })}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                          <button onClick={createDepartment} className="btn btn-primary">
                            Create & Continue
                          </button>
                        </div>
                      </div>
                    )}

                    <button onClick={() => setUploadStep(1)} className="btn btn-secondary btn-back">
                      <FiArrowLeft size={16} /> Back to Faculty
                    </button>
                  </div>
                )}

                {/* Step 3: Course Selection */}
                {uploadStep === 3 && (
                  <div className="step-content">
                    <h3>Select or Create Course</h3>
                    <p className="step-description">Choose an existing course or create a new one</p>

                    <div className="selection-grid">
                      {courses.map((course) => (
                        <button
                          key={course._id}
                          className={`selection-card ${uploadForm.courseId === course._id ? 'selected' : ''}`}
                          onClick={() => handleCourseSelect(course._id)}
                        >
                          <FiBook size={24} />
                          <span>{course.courseCode}</span>
                          <small>{course.courseName}</small>
                        </button>
                      ))}
                      <button
                        className="selection-card create-new"
                        onClick={() => handleCourseSelect('new')}
                      >
                        <FiUpload size={24} />
                        <span>Create New Course</span>
                      </button>
                    </div>

                    {courses.length === 0 && uploadForm.courseId !== 'new' && (
                      <div className="empty-message">
                        <FiBook size={48} />
                        <p>No courses in this department. Click "Create New Course" above to get started!</p>
                      </div>
                    )}

                    {uploadForm.courseId === 'new' && (
                      <div className="create-form">
                        <h4>Create New Course</h4>
                        <input
                          type="text"
                          value={newCourse.courseCode}
                          onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                          placeholder="Course code (e.g., BIO101)"
                          className="form-input"
                        />
                        <input
                          type="text"
                          value={newCourse.courseName}
                          onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                          placeholder="Course name (e.g., Introduction to Biology)"
                          className="form-input"
                        />
                        <input
                          type="number"
                          value={newCourse.creditUnits}
                          onChange={(e) => setNewCourse({ ...newCourse, creditUnits: parseInt(e.target.value) })}
                          placeholder="Credit units"
                          className="form-input"
                          min="1"
                          max="6"
                        />
                        <div className="form-actions">
                          <button
                            onClick={() => setUploadForm({ ...uploadForm, courseId: '' })}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                          <button onClick={createCourse} className="btn btn-primary">
                            Create & Continue
                          </button>
                        </div>
                      </div>
                    )}

                    <button onClick={() => setUploadStep(2)} className="btn btn-secondary btn-back">
                      <FiArrowLeft size={16} /> Back to Department
                    </button>
                  </div>
                )}

                {/* Step 4: Material Upload */}
                {uploadStep === 4 && (
                  <form onSubmit={handleUploadSubmit} className="step-content">
                    <h3>Upload Course Material</h3>

                    <div className="form-group">
                      <label>Material Title</label>
                      <input
                        type="text"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                        placeholder="e.g., Biology 101 - Chapter 1 Notes"
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>PDF File</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                        required
                      />
                      {uploadForm.file && (
                        <p className="file-selected">{uploadForm.file.name}</p>
                      )}
                    </div>

                    {uploadError && (
                      <div className="upload-error">
                        <FiX /> {uploadError}
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="upload-success">
                        <FiCheckCircle /> {uploadSuccess}
                      </div>
                    )}

                    <div className="modal-actions">
                      <button
                        type="button"
                        onClick={() => setUploadStep(3)}
                        className="btn btn-secondary"
                        disabled={uploading}
                      >
                        Back to Course
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploading || !uploadForm.file || !uploadForm.title}
                      >
                        {uploading ? 'Uploading...' : 'Upload Material'}
                      </button>
                    </div>

                    <div className="upload-info">
                      <p><strong>Note:</strong> Our AI will automatically generate summaries and practice questions. You'll earn 10 points!</p>
                    </div>
                  </form>
                )}

                {uploadError && uploadStep < 4 && (
                  <div className="upload-error">
                    <FiX /> {uploadError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
