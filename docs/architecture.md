# SmartTailor Architecture

```text
React + Tailwind + Vite
        |
REST API + Socket.io
        |
Node.js + Express
        |
MongoDB Atlas + Mongoose
        |
Razorpay | Cloudinary | Notifications
        |
Vercel frontend + Render backend
```

## Frontend

- Role-based routes for customer, tailor, and admin.
- React Query-ready API layer.
- Tailwind CSS mobile-first layouts.
- Socket.io client for live order updates.

## Backend

- Express REST API.
- JWT auth with role authorization.
- Mongoose models.
- Socket.io for real-time order updates.
- Razorpay signature verification.
- Cloudinary signed/server uploads.

## Core Roles

- Customer: orders, measurements, payments, reviews.
- Tailor: profile, orders, measurements, payments.
- Admin: user management, tailor verification, platform monitoring.
