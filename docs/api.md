# SmartTailor REST API

## Auth

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

## Customer

```text
GET    /api/tailors
GET    /api/tailors/:id
POST   /api/measurements
GET    /api/measurements
PUT    /api/measurements/:id
POST   /api/orders
GET    /api/orders/my
GET    /api/orders/:id
POST   /api/payments/create-order
POST   /api/payments/verify
POST   /api/reviews
GET    /api/notifications
PATCH  /api/notifications/:id/read
```

## Tailor

```text
POST   /api/tailor/profile
GET    /api/tailor/dashboard
GET    /api/tailor/orders
PATCH  /api/tailor/orders/:id/status
POST   /api/tailor/customers/:customerId/measurements
GET    /api/tailor/payments
POST   /api/uploads/images
```

## Admin

```text
GET    /api/admin/dashboard
GET    /api/admin/users
PATCH  /api/admin/users/:id/status
GET    /api/admin/tailors
PATCH  /api/admin/tailors/:id/verify
GET    /api/admin/orders
GET    /api/admin/payments
```
