# Final Year Project Plagiarism Checker API Documentation

## Overview
This API provides comprehensive plagiarism detection for student final year projects using Google's Gemini AI with strict academic integrity standards.

## Features
✅ **Database Comparison**: Checks against all previously submitted projects
✅ **Web Source Detection**: Uses Gemini AI to detect content from online sources
✅ **AI-Powered Analysis**: Deep analysis of originality, writing patterns, and citation issues
✅ **Strict Thresholds**:
   - 70%+ = PLAGIARIZED (Rejected)
   - 45-69% = SUSPICIOUS (Manual Review Required)
   - 25-44% = MODERATE CONCERNS (Proceed with Caution)
   - 0-24% = ORIGINAL (Approved)

## API Endpoints

### 1. Submit a Project (Draft)
**POST** `/api/projects/submit`

**Headers:**
```
Authorization: Bearer <student_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "AI-Powered Student Management System",
  "abstract": "This project develops an AI-powered student management system...",
  "fullText": "Full project text here (introduction, methodology, implementation, results, conclusion)...",
  "department": "department_id_here",
  "courseId": "course_id_here" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully. You can now check for plagiarism.",
  "data": {
    "_id": "project_id",
    "title": "AI-Powered Student Management System",
    "submissionStatus": "DRAFT",
    "plagiarismReport": {
      "status": "PENDING"
    },
    "createdAt": "2026-01-10T..."
  }
}
```

---

### 2. Check Plagiarism
**POST** `/api/projects/:projectId/check-plagiarism`

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Plagiarism check completed",
  "data": {
    "projectId": "project_id",
    "plagiarismReport": {
      "overallScore": 15,
      "status": "ORIGINAL",
      "verdict": "ORIGINAL WORK - Passed Plagiarism Check",
      "detailedAnalysis": "This project appears to be original work (15% similarity score). Strengths identified: unique methodology, original insights. Approved for submission pending final review.",
      "recommendations": [
        "Proceed with submission",
        "Double-check citation formatting",
        "Maintain academic integrity",
        "Keep documentation of your work process"
      ],
      "databaseMatches": 0,
      "webSources": 0,
      "checkedAt": "2026-01-10T..."
    }
  }
}
```

**If Plagiarized (70%+):**
```json
{
  "success": true,
  "data": {
    "plagiarismReport": {
      "overallScore": 85,
      "status": "PLAGIARIZED",
      "verdict": "SEVERE PLAGIARISM DETECTED - Project Rejected",
      "detailedAnalysis": "This project has been flagged for severe plagiarism with an overall score of 85%. Found 2 similar existing project(s). AI detected 5 red flags. This submission cannot be accepted.",
      "recommendations": [
        "Submit completely original work",
        "Properly cite all sources",
        "Rewrite content in your own words",
        "Consult with supervisor before resubmission"
      ],
      "databaseMatches": 2,
      "webSources": 3
    }
  }
}
```

---

### 3. Get Detailed Plagiarism Report
**GET** `/api/projects/:projectId/plagiarism-report`

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectTitle": "AI-Powered Student Management System",
    "studentName": "John Doe",
    "plagiarismReport": {
      "overallScore": 45,
      "status": "SUSPICIOUS",
      "verdict": "SUSPICIOUS - Requires Manual Review",
      "detailedAnalysis": "This project shows concerning similarity patterns (45%). Similar to 1 existing project(s). Suspicious patterns detected. Manual review by supervisor required before approval.",
      "webSources": [
        {
          "sourceType": "GitHub",
          "likelihood": 75,
          "reason": "Code structure matches common GitHub repositories",
          "indicators": [
            "Similar variable naming conventions",
            "Identical error handling patterns"
          ]
        }
      ],
      "databaseMatches": [
        {
          "projectTitle": "Student Information System",
          "studentName": "Jane Smith",
          "similarity": 52,
          "matchedSections": [
            "Database schema design",
            "Authentication module implementation"
          ],
          "analysis": "Significant overlap in methodology and code structure"
        }
      ],
      "checkedAt": "2026-01-10T..."
    }
  }
}
```

---

### 4. Finalize Submission
**PUT** `/api/projects/:projectId/finalize`

Only allowed if:
- Plagiarism check is complete
- Status is NOT "PLAGIARIZED"

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Project submitted successfully for review",
  "data": {
    "_id": "project_id",
    "submissionStatus": "SUBMITTED",
    "submittedAt": "2026-01-10T..."
  }
}
```

**If Plagiarized:**
```json
{
  "success": false,
  "message": "Cannot submit project flagged for plagiarism. Please revise and recheck."
}
```

---

### 5. Get My Projects
**GET** `/api/projects/my-projects`

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "project_id_1",
      "title": "AI-Powered Student Management System",
      "abstract": "...",
      "department": {
        "_id": "dept_id",
        "name": "Computer Science"
      },
      "submissionStatus": "SUBMITTED",
      "plagiarismReport": {
        "overallScore": 15,
        "status": "ORIGINAL"
      },
      "submittedAt": "2026-01-10T...",
      "createdAt": "2026-01-09T..."
    }
  ]
}
```

---

### 6. Get All Projects (Admin Only)
**GET** `/api/projects/all?status=SUBMITTED&department=dept_id`

**Query Parameters:**
- `status` (optional): DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
- `department` (optional): Filter by department ID

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [...]
}
```

---

### 7. Review Project (Admin Only)
**PUT** `/api/projects/:projectId/review`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "submissionStatus": "APPROVED",
  "reviewerNotes": "Excellent original work. Approved for final submission."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project review updated",
  "data": {
    "_id": "project_id",
    "submissionStatus": "APPROVED",
    "reviewerNotes": "Excellent original work...",
    "reviewedBy": "admin_id"
  }
}
```

---

### 8. Delete Project
**DELETE** `/api/projects/:projectId`

Only allowed for DRAFT projects (own projects only)

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## Plagiarism Detection Details

### How It Works

1. **Database Check (40% weight)**
   - Compares against all previously submitted projects
   - Uses Gemini AI to calculate similarity percentage
   - Detects exact matches and paraphrased content
   - Identifies similar methodology and code snippets

2. **AI Analysis (35% weight)**
   - Analyzes writing style consistency
   - Detects citation issues
   - Identifies generic/common content
   - Flags suspicious vocabulary changes
   - Assesses technical depth and understanding

3. **Web Presence Analysis (25% weight)**
   - Detects content from GitHub repositories
   - Identifies tutorial/documentation copying
   - Flags common online project patterns
   - Analyzes StackOverflow code snippets

### Strict Thresholds

| Score Range | Status | Action |
|------------|--------|--------|
| 0-24% | ORIGINAL | ✅ Approved for submission |
| 25-44% | MODERATE CONCERNS | ⚠️ Review recommended |
| 45-69% | SUSPICIOUS | 🔍 Manual review REQUIRED |
| 70-100% | PLAGIARIZED | ❌ REJECTED - Cannot submit |

### What Gets Flagged

**Red Flags:**
- Exact text matches with existing projects
- Paraphrased content without citation
- Code copied from GitHub/tutorials
- Inconsistent writing style
- Missing citations for complex concepts
- Generic textbook examples without attribution
- Sudden vocabulary/formatting changes

**Strengths (Positive Indicators):**
- Unique methodology
- Original insights
- Consistent writing style
- Proper citations
- Personal analysis and interpretation
- Custom implementations

---

## Student Workflow

1. **Create Project Draft**
   ```
   POST /api/projects/submit
   ```

2. **Check for Plagiarism**
   ```
   POST /api/projects/{projectId}/check-plagiarism
   ```
   ⏱️ This takes 30-60 seconds

3. **Review Report**
   ```
   GET /api/projects/{projectId}/plagiarism-report
   ```

4. **If ORIGINAL or MODERATE:**
   - Finalize submission
   ```
   PUT /api/projects/{projectId}/finalize
   ```

5. **If SUSPICIOUS or PLAGIARIZED:**
   - Revise the project
   - Address flagged sections
   - Add proper citations
   - Resubmit and recheck

---

## Error Codes

- `400` - Bad Request (missing fields, invalid data)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (not your project, not admin)
- `404` - Not Found (project doesn't exist)
- `500` - Server Error (plagiarism check failed)

---

## Notes

- Each plagiarism check takes **30-60 seconds** due to comprehensive AI analysis
- Students can only check their **own projects**
- Admins can view **all projects** and reports
- Projects flagged as PLAGIARIZED **cannot be submitted**
- The system is **strict** - academic integrity is paramount
- All checks are logged with timestamps
- Database grows over time, improving detection accuracy

---

## Example Integration

```javascript
// Frontend example
const submitProject = async (projectData) => {
  // Step 1: Create draft
  const createResponse = await fetch('/api/projects/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(projectData)
  });

  const { data } = await createResponse.json();
  const projectId = data._id;

  // Step 2: Check plagiarism
  const checkResponse = await fetch(`/api/projects/${projectId}/check-plagiarism`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const report = await checkResponse.json();

  // Step 3: Show results to student
  if (report.data.plagiarismReport.status === 'ORIGINAL') {
    // Allow finalization
  } else if (report.data.plagiarismReport.status === 'PLAGIARIZED') {
    // Show error, require revision
  } else {
    // Show warning, recommend review
  }
};
```

---

## Support

For questions or issues:
- Check the detailed plagiarism report
- Review the recommendations provided
- Consult with your project supervisor
- Contact admin if you believe there's an error
