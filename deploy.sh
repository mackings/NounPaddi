#!/bin/bash

# NounPaddi Quick Deployment Script
# This script helps you deploy both frontend and backend to Vercel

echo "🚀 NounPaddi Deployment Script"
echo "================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI is ready!"
echo ""

# Ask user what they want to deploy
echo "What would you like to deploy?"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both (recommended for first deployment)"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📦 Deploying Backend..."
        cd backend
        vercel --prod
        ;;
    2)
        echo ""
        echo "📦 Deploying Frontend..."
        cd frontend
        vercel --prod
        ;;
    3)
        echo ""
        echo "📦 Deploying Backend first..."
        cd backend
        vercel --prod

        echo ""
        echo "⏳ Waiting 10 seconds for backend to be ready..."
        sleep 10

        echo ""
        echo "📦 Now deploying Frontend..."
        cd ../frontend
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Important Next Steps:"
echo "1. Make sure you've added all environment variables in Vercel Dashboard"
echo "2. Update FRONTEND_URL in backend environment variables"
echo "3. Update REACT_APP_API_URL in frontend environment variables"
echo "4. Test your deployment thoroughly"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
