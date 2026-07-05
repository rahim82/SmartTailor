# 🧵 SmartTailor — Digital Boutique Sewing & Tracking Platform

SmartTailor is a premium MERN stack SaaS marketplace connecting local boutique tailoring shops with customers. It replaces manual paper-based workshop registers with structured tracking, custom measurements, and automated notifications.

---

## 🌟 Key Features

### 🛍️ Client & Customer Marketplace
- **Boutique Discovery**: Browse verified shops, filter by city or service specialty, and inspect portfolios.
- **Custom Fabric Uploads**: Customers can upload images of their fabric when ordering. Built-in **Cloudinary base64 fallback** ensures uploads succeed in development.
- **Dynamic Catalog Pricing**: Garment type selections automatically load the chosen tailor's customized service rates. Stitching charge inputs lock to enforce the tailor's catalog prices.
- **Measurement Profiles**: Save multiple customer measurement profiles (Inches/CM for Chest, Waist, Shoulder, Length, etc.) to quickly apply to new stitching orders.

### 📐 Tailor Dashboard & Visual Catalog Editor
- **Work Orders Tracking**: Visual pipeline tracking orders through workshop milestones: `Pending` ➜ `Cutting` ➜ `Stitching` ➜ `Trial` ➜ `Ready` ➜ `Completed`.
- **Visual Catalog & Rate List Editor**: Tailors can configure, add, update, and remove custom tailoring services and prices dynamically.
- **SMS & WhatsApp Alerts**: Automated twilio-integrated SMS notifications for order confirmations and workshop status updates. Features a **console fallback logger** in development mode.
- **One-Click WhatsApp Share**: Direct link helper lets tailors ping customers directly on personal WhatsApp chats with pre-formatted update templates.

### 🛡️ Admin Verification Queue
- **Boutique Verification**: Secure admin portal to inspect newly registered shops, view documents/location details, and verify or reject them.
- **System Metrics**: Visual counts tracking registered tailors, verification queues, and system performance.

### 📱 Responsive & Pro-Level Visual Design
- **Mobile Card Lists**: Automatically replaces wide tables on mobile screens with responsive card lists for touch-friendly layouts.
- **Master-Detail Modals**: Collapses order details into clean popups on screens `< lg` instead of forcing scrolling.
- **Aesthetic Mesh Grid**: Visual background with a soft linen weave gradient texture, custom Outfit/Plus Jakarta Sans typography, and interactive input glow highlights.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide React, React Router.
- **Backend**: Node.js, Express.js, JWT Authentication, Twilio REST API, Cloudinary SDK.
- **Database**: MongoDB (Atlas) / Mongoose ODM.

---

## ⚙️ Project Structure

```
├── client/           # React + Vite Frontend
│   ├── src/
│   │   ├── components/  # PageShell, StatCard, OrderTable, Collapsible Header
│   │   ├── context/     # Auth Context for State & JWT storage
│   │   ├── pages/       # LandingPage, Customer, Tailor, Admin Dashboards
│   │   └── styles.css   # Custom Linen Fabric Weave & Input Focus design
└── server/           # Express + MongoDB Backend
    ├── src/
    │   ├── config/      # Database Atlas & Env configurations
    │   ├── controllers/ # Auth, Tailors, Orders controller endpoints
    │   ├── models/      # User, Tailor Boutique, Measurements Schemas
    │   ├── services/    # Twilio SMS fallback & Cloudinary upload helper
    │   └── scripts/     # Database Seeder script
```

---

## 🚦 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** local instance or Atlas connection string

### 2. Installation
Install dependencies in both directories:
```bash
npm run install:all
```

### 3. Environment Variables
Create a `.env` file in the `server` directory. Template is available in `server/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smarttailor
JWT_SECRET=supersecretjwtsecretkey
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name> # (Optional, falls back to base64)
TWILIO_ACCOUNT_SID= # (Optional, falls back to console log logs)
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### 4. Database Seeding
Populate initial mock data (Admin, Tailor Boutique, Customer, and Rate Catalogs):
```bash
npm run seed --prefix server
```

### 5. Running the Application
Launch both backend APIs and Vite client concurrently:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend APIs**: `http://localhost:5000`

---

## 🧪 Demo Recruiter Credentials

Use these seeded accounts to test different roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `smarttailor275@gmail.com` | `Rahim@2002` |
| **Customer** | `customer@smarttailor.test` | `password123` |
| **Tailor** | `tailor@smarttailor.test` | `password123` |
