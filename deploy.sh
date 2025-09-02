#!/bin/bash

# Vercel Deployment Script for Frontend

echo "🚀 Starting Vercel deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🌐 Ready for Vercel deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Push this code to your Git repository"
    echo "2. Connect your repository to Vercel"
    echo "3. Set environment variables in Vercel dashboard:"
    echo "   - VITE_API_URL: Your production backend URL"
    echo "4. Deploy!"
else
    echo "❌ Build failed!"
    exit 1
fi
