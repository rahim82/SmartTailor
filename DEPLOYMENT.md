# Deployment Guide: SmartTailor

This guide provides step-by-step instructions to deploy the SmartTailor application using **Vercel** for the frontend client and **Render** for the backend server.

---

## 1. Push to GitHub

Ensure all your code is pushed to a private or public GitHub repository.

```bash
git init
git add .
git commit -m "Initialize SmartTailor production build config"
# Link to your repository
git remote add origin https://github.com/your-username/smarttailor.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy Backend (Express) on Render

1. Go to [Render](https://render.com/) and log in.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `smarttailor-backend`
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Advanced** to add **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: *Your MongoDB Atlas connection URI* (from your Atlas dashboard)
   - `JWT_SECRET`: *A secure random string* (e.g. generated via `openssl rand -hex 32`)
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app` (You can update this after deploying the Vercel frontend)
   - `CLOUDINARY_CLOUD_NAME`: *Your Cloudinary Cloud Name*
   - `CLOUDINARY_API_KEY`: *Your Cloudinary API Key*
   - `CLOUDINARY_API_SECRET`: *Your Cloudinary API Secret*
   - `TWILIO_ACCOUNT_SID`: *(Optional) Twilio Account SID*
   - `TWILIO_AUTH_TOKEN`: *(Optional) Twilio Auth Token*
   - `TWILIO_PHONE_NUMBER`: *(Optional) Twilio Phone Number*
6. Click **Deploy Web Service**. Render will build and start your server. Copy the generated Web Service URL (e.g., `https://smarttailor-backend.onrender.com`).

---

## 3. Deploy Frontend (React + Vite) on Vercel

1. Go to [Vercel](https://vercel.com/) and log in.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com/api` (The URL copied from your Render backend deployment, appended with `/api`)
   - `VITE_SOCKET_URL`: `https://your-backend-app.onrender.com` (The URL copied from your Render backend deployment without trailing slash)
6. Click **Deploy**. Vercel will build and host your frontend. Copy your live Vercel URL (e.g., `https://your-frontend-app.vercel.app`).

---

## 4. Final Connection Hookup

Once the Vercel frontend is deployed:
1. Go back to your **Render Web Service** dashboard.
2. Navigate to **Environment**.
3. Update the `CLIENT_URL` environment variable value to match your live Vercel frontend URL (e.g., `https://your-frontend-app.vercel.app`).
4. Save the changes. Render will automatically redeploy the service.

Congratulations! Your SmartTailor application is now fully deployed and live in production!
