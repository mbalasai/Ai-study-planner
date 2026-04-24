# Deployment Guide: StudyAI Planner (InsForge Architecture)

This project uses a Serverless Architecture with:
- **Frontend**: React + Vite
- **Backend/Database**: InsForge (PostgreSQL + Auth + AI)
- **Deployment Strategy**: Host frontend on **Vercel**

## 1. Database Configuration (InsForge)

Your InsForge database is already set up and linked to this workspace! The SQL schemas (Profiles, Subjects, Questions, Chat History) and RLS (Row Level Security) policies have been successfully imported into your `smart ai study planner` project.

You do not need to deploy a traditional backend API server. InsForge handles databases, authentication, and AI interactions globally out of the box securely via the `@insforge/sdk`.

## 2. Frontend Deployment (Vercel)

1. Push your updated code to GitHub.
2. Create an account on [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. In the Configuration page:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
5. Under **Environment Variables**, you MUST add the following:
   - `VITE_INSFORGE_URL` = `https://ruhpkm82.ap-southeast.insforge.app`
   - `VITE_INSFORGE_ANON_KEY` = `ik_5fce0719a9b62daa9b0dc0c8d068dc2d`
6. Click **Deploy**. Vercel will build your React application and give you a live production URL.

---
**Congratulations!** Your StudyAI Full Stack Application is now live without needing to host a custom Node.js backend.
