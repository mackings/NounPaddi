# Quick Setup Guide for NounPaddi

## Prerequisites Check
- [ ] Node.js installed (check: `node --version`)
- [ ] MongoDB installed or Atlas account created
- [ ] Cloudinary account created
- [ ] Hugging Face account created

## 5-Minute Setup

### Step 1: Get Your API Keys

**MongoDB** (Choose one):
- **Local**: Just install MongoDB and it will run on `mongodb://localhost:27017`
- **Cloud (Atlas)**: 
  - Go to https://mongodb.com/cloud/atlas
  - Create free cluster
  - Copy connection string

**Cloudinary** (Required):
1. Go to https://cloudinary.com
2. Sign up (free)
3. Dashboard → Copy these three values:
   - Cloud Name
   - API Key  
   - API Secret

**Hugging Face** (Required):
1. Go to https://huggingface.co
2. Sign up (free)
3. Settings → Access Tokens → New Token
4. Copy the token

### Step 2: Configure Backend

```bash
cd backend
cp .env.example .env
nano .env  # or use any text editor
```

Paste your values:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nounpaddi
JWT_SECRET=paste_any_random_long_string_here
CLOUDINARY_CLOUD_NAME=paste_here
CLOUDINARY_API_KEY=paste_here
CLOUDINARY_API_SECRET=paste_here
HUGGINGFACE_API_KEY=paste_here
```

### Step 3: Install & Run

**Option A: Automatic (Recommended)**
```bash
# From project root
./start.sh
```

**Option B: Manual**

Terminal 1 (Backend):
```bash
cd backend
npm install
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm install
npm start
```

### Step 4: Create Admin Account

1. Open http://localhost:3000
2. Click "Sign Up"
3. Fill in your details
4. After signup, open MongoDB Compass or shell
5. Change your account to admin:
   ```javascript
   use nounpaddi
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```
6. Logout and login again

### Step 5: Add Sample Data (Optional but Recommended)

In MongoDB:
```javascript
// Add Faculty
db.faculties.insertOne({
  name: "Science",
  description: "Faculty of Science"
});

// Get the faculty ID and add Department
db.departments.insertOne({
  name: "Computer Science",
  facultyId: ObjectId("the_faculty_id_from_above"),
  description: "CS Department"
});

// Get the department ID and add Course
db.courses.insertOne({
  courseCode: "CSC101",
  courseName: "Introduction to Computer Science",
  departmentId: ObjectId("the_department_id_from_above"),
  creditUnits: 3
});
```

## You're Done! 🎉

- **Admin Panel**: http://localhost:3000/admin/upload
- **Student View**: http://localhost:3000/explore

## Common Issues

### "Cannot connect to MongoDB"
- Start MongoDB: `mongod` (if local)
- Or check your Atlas connection string

### "Cloudinary upload failed"
- Double-check your credentials
- Make sure there are no extra spaces

### "AI generation failed"
- Verify Hugging Face API key
- Free tier limit: 30 requests/hour
- Wait 2 minutes if you hit the limit

### Port already in use
- Backend: Change PORT in .env
- Frontend: React will ask to use different port

## Test the Full Flow

1. **Login as Admin**
2. **Upload Material**: 
   - Select a course
   - Upload a PDF
3. **Generate Summary**
4. **Generate Questions**
5. **Logout**
6. **Login as Student**
7. **Explore Courses**
8. **Take Practice Exam**

---

Need help? Check the main README.md for detailed documentation.
