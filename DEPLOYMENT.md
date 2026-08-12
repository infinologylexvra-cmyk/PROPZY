# 🚀 Deployment Guide for PROPZY

This project is built using **Next.js 15 (App Router)** and **MongoDB Atlas**. Follow this guide to deploy it to production seamlessly.

---

## 📋 Required Environment Variables

When deploying to any cloud platform (e.g., Vercel, Netlify, Railway), configure the following environment variables in your project settings:

| Environment Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `MONGODB_URI` | Production MongoDB connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/propzy` |
| `JWT_SECRET` | Secret key for signing JWT auth tokens | Any long random string (e.g. `c98a3f7e21b44e59...`) |
| `NEXTAUTH_SECRET` | Alternative alias for `JWT_SECRET` | Same as `JWT_SECRET` |
| `NEXT_PUBLIC_APP_URL` | Public production domain URL | `https://your-domain.vercel.app` |
| `ADMIN_ID` | Master Admin email for portal access | `admin@propzy.com` |
| `ADMIN_PASSWORD` | Master Admin portal password | Strong custom password |


---

## 🌐 Deploying to Vercel (Recommended)

Vercel is the official platform for Next.js applications and provides zero-config deployment.

### Option A: Via Vercel Dashboard (GitHub Integration)
1. Push your code to GitHub (`git push -u origin main`).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** → **Project**.
3. Import your **PROPZY** repository.
4. Expand **Environment Variables** and add all variables listed above.
5. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

---

## 🍃 MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, add IP `0.0.0.0/0` to allow connections from your deployment platform.
3. Under **Database Access**, create a user with read/write access to your database.
4. Copy the connection string and set `MONGODB_URI` in your host's environment variables.
5. (Optional) Seed demo data after deployment by triggering:
   ```bash
   curl https://<your-deployed-domain>/api/seed
   ```

---

## 🛠 Pre-Deployment Checklist

- [x] Production build passes cleanly (`npm run build`).
- [x] TypeScript validation succeeds without errors.
- [x] Environment variables configured on server platform.
- [x] Database IP whitelist configured on MongoDB Atlas (`0.0.0.0/0`).
