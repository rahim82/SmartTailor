# MongoDB Database Design

## Collections

- `users`: login identity and role.
- `tailors`: business profile for tailor users.
- `measurements`: reusable customer measurement profiles.
- `orders`: tailoring order lifecycle and pricing.
- `payments`: Razorpay and cash payment records.
- `notifications`: persisted user notifications.
- `reviews`: customer feedback.

## Important Indexes

- `users.email`, `users.phone`: unique.
- `orders.customerId`, `orders.tailorId`, `orders.status`, `orders.dueDate`.
- `measurements.customerId`, `measurements.garmentType`.
- `tailors.location.city`, `tailors.verificationStatus`, `tailors.ratingAvg`.
