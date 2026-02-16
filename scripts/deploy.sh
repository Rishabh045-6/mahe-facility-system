#!/bin/bash

echo "🚀 Starting MAHE Facility Management System Deployment..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Build the project
echo "🔨 Building project..."
npm run build

# Step 3: Run tests (if any)
echo "🧪 Running tests..."
npm test

# Step 4: Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

# Step 5: Verify deployment
echo "✅ Deployment complete!"
echo "📱 App URL: https://your-app.vercel.app"
echo "📊 Dashboard: https://vercel.com/your-team/your-app"

echo "🎉 MAHE Facility Management System is now live!"