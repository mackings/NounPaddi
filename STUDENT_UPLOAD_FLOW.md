# Student Upload Flow Implementation Guide

## Overview
Students can now upload materials following a hierarchical flow: Faculty → Department → Course → Material Upload

## Implementation Status

### Completed
✅ Fixed upload card visibility (now shows with purple gradient background)
✅ Backend duplicate detection
✅ Auto-processing of summaries and questions
✅ Points reward system

### In Progress
🔄 Multi-step upload modal implementation

## Required Changes

### 1. Student Dashboard State Management

Add these state variables to StudentDashboard.js:

```javascript
const [uploadStep, setUploadStep] = useState(1); // 1-4 for each step
const [faculties, setFaculties] = useState([]);
const [departments, setDepartments] = useState([]);
const [newFaculty, setNewFaculty] = useState('');
const [newDepartment, setNewDepartment] = useState({ name: '', code: '' });
const [newCourse, setNewCourse] = useState({ name: '', code: '', creditUnits: 3 });
```

### 2. Step Navigation Functions

```javascript
const handleFacultySelect = async (facultyId) => {
  if (facultyId === 'new') {
    // Show create faculty form
    return;
  }
  setUploadForm({ ...uploadForm, facultyId });
  await fetchDepartments(facultyId);
  setUploadStep(2);
};

const handleDepartmentSelect = async (departmentId) => {
  if (departmentId === 'new') {
    // Show create department form
    return;
  }
  setUploadForm({ ...uploadForm, departmentId });
  await fetchCourses(departmentId);
  setUploadStep(3);
};

const handleCourseSelect = (courseId) => {
  if (courseId === 'new') {
    // Show create course form
    return;
  }
  setUploadForm({ ...uploadForm, courseId });
  setUploadStep(4);
};
```

### 3. Creation Functions

```javascript
const createFaculty = async () => {
  try {
    const response = await api.post('/faculties', { name: newFaculty });
    setFaculties([...faculties, response.data.data]);
    setUploadForm({ ...uploadForm, facultyId: response.data.data._id });
    setNewFaculty('');
    await fetchDepartments(response.data.data._id);
    setUploadStep(2);
  } catch (error) {
    setUploadError(error.response?.data?.message || 'Failed to create faculty');
  }
};

const createDepartment = async () => {
  try {
    const response = await api.post('/departments', {
      ...newDepartment,
      facultyId: uploadForm.facultyId
    });
    setDepartments([...departments, response.data.data]);
    setUploadForm({ ...uploadForm, departmentId: response.data.data._id });
    setNewDepartment({ name: '', code: '' });
    await fetchCourses(response.data.data._id);
    setUploadStep(3);
  } catch (error) {
    setUploadError(error.response?.data?.message || 'Failed to create department');
  }
};

const createCourse = async () => {
  try {
    const response = await api.post('/courses', {
      ...newCourse,
      departmentId: uploadForm.departmentId
    });
    setCourses([...courses, response.data.data]);
    setUploadForm({ ...uploadForm, courseId: response.data.data._id });
    setNewCourse({ name: '', code: '', creditUnits: 3 });
    setUploadStep(4);
  } catch (error) {
    setUploadError(error.response?.data?.message || 'Failed to create course');
  }
};
```

### 4. Modal UI Structure

The upload modal should have 4 steps:

**Step 1: Faculty Selection**
- List existing faculties
- "Create New Faculty" option
- If creating: text input for faculty name

**Step 2: Department Selection**
- List departments in selected faculty
- "Create New Department" option
- If creating: inputs for department name and code

**Step 3: Course Selection**
- List courses in selected department
- "Create New Course" option
- If creating: inputs for course name, code, and credit units

**Step 4: Material Upload**
- Material title input
- PDF file upload
- Submit button

### 5. Modal JSX Structure

```jsx
{showUploadModal && (
  <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
    <div className="modal-content upload-wizard" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Upload Material - Step {uploadStep}/4</h2>
        <button onClick={() => setShowUploadModal(false)}>×</button>
      </div>

      <div className="upload-steps">
        <div className={`step ${uploadStep >= 1 ? 'active' : ''}`}>Faculty</div>
        <div className={`step ${uploadStep >= 2 ? 'active' : ''}`}>Department</div>
        <div className={`step ${uploadStep >= 3 ? 'active' : ''}`}>Course</div>
        <div className={`step ${uploadStep >= 4 ? 'active' : ''}`}>Material</div>
      </div>

      {uploadStep === 1 && (
        <FacultySelectionStep />
      )}

      {uploadStep === 2 && (
        <DepartmentSelectionStep />
      )}

      {uploadStep === 3 && (
        <CourseSelectionStep />
      )}

      {uploadStep === 4 && (
        <MaterialUploadStep />
      )}
    </div>
  </div>
)}
```

### 6. CSS for Steps Indicator

```css
.upload-wizard {
  max-width: 700px;
}

.upload-steps {
  display: flex;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 2px solid #e2e8f0;
}

.upload-steps .step {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: #f7fafc;
  color: #718096;
  font-weight: 600;
  position: relative;
}

.upload-steps .step.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.upload-steps .step:not(:last-child)::after {
  content: '→';
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
}
```

## Benefits of This Approach

1. **Guided Flow**: Students are walked through the hierarchy step-by-step
2. **Flexibility**: Can create new faculties/departments/courses if they don't exist
3. **Prevent Orphaned Materials**: Ensures proper categorization
4. **Consistent Structure**: Maintains data integrity
5. **Better UX**: Clear progression through the upload process

## User Experience Flow

1. Student clicks "Upload Material" button
2. Step 1: Select existing faculty OR create new
3. Step 2: Select existing department in that faculty OR create new
4. Step 3: Select existing course in that department OR create new
5. Step 4: Upload PDF with title
6. System auto-generates summary and questions in background
7. Student earns 10 points

## Next Steps

1. Implement the step components
2. Add back/next navigation between steps
3. Add progress indicator
4. Test the full flow
5. Add validation at each step
6. Handle edge cases (empty lists, API errors)
