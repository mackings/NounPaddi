# Quick Deployment Reference

## Prerequisites Checklist

- [ ] Vercel account created
- [ ] MongoDB Atlas cluster created
- [ ] Cloudinary account created
- [ ] Google Gemini API key obtained
- [ ] Git repository ready

## Environment Variables

### Backend
Copy these to Vercel:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=random-secret-string-here
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend
Copy to Vercel:
```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

## Deployment Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy Backend
cd backend
vercel --prod

# Deploy Frontend
cd frontend
vercel --prod
```

## MongoDB Atlas Setup

1. Create cluster
2. Database Access → Add user
3. Network Access → Add IP (0.0.0.0/0 for all)
4. Connect → Get connection string

## Post-Deployment

1. Test signup/login
2. Upload a PDF material
3. Generate summary
4. Generate questions
5. Verify all features work

## Troubleshooting

**CORS Error?**
- Add FRONTEND_URL to backend env vars
- Redeploy backend

**MongoDB Connection Failed?**
- Check Network Access in MongoDB Atlas
- Verify connection string

**Build Failed?**
- Check environment variables
- Review Vercel logs

---

For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)
