# MDN Suppliment Website

A full-stack e-commerce platform for supplements and fitness nutrition, built on the MERN stack (MongoDB, Express, React, Node.js). Includes a customer-facing storefront and a full admin panel for managing products, orders, coupons, and users.

<p align="center">
  <img src="./public/mdn.png" alt="MDN Suppliment Website Logo" width="100%" />
</p>

## Features

### Customer
- Browse products by section (Best Sellers, New Arrivals, Fitness Combos) and category
- Product detail pages with variant selection (flavor, weight) and reviews
- Guest cart (no login required) that syncs to a persistent cart after login
- Coupon codes applied at checkout
- Multiple saved shipping addresses
- Order placement (Cash on Delivery) and order tracking with a visual status timeline
- Order cancellation for eligible orders
- Toast notifications for cart, checkout, and order actions
- Search across products

### Admin
- Product management (add, edit, categories)
- Order management — update status, tracking number, courier partner, estimated delivery / delivered dates, with required-field validation for key statuses
- Coupon management
- User management

## Tech Stack

**Frontend (`/client`)**
- React + Vite
- React Router
- Tailwind CSS
- Context API for auth, cart badge, and toast notifications

**Backend (`/server`)**
- Node.js + Express
- MongoDB with Mongoose
- JWT-based authentication
- REST API with route-level middleware for auth and admin access control

## Project Structure

```
MDN-Suppliment-Website/
├── client/                # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Auth, Cart Badge, Toast providers
│   │   ├── pages/         # Route-level pages (including admin/)
│   │   ├── styles/
│   │   └── utils/
│   └── .env                # Frontend environment variables (not committed)
│
└── server/                # Express backend
    ├── controller/        # Route controllers (admin + customer-facing)
    ├── middleware/         # Auth middleware
    ├── models/             # Mongoose schemas
    ├── routes/             # Express routers
    ├── database.js
    ├── server.js
    └── .env                # Backend environment variables (not committed)
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local instance or a hosted URI, e.g. MongoDB Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/sachin-codes01/MERN-Projects.git
cd MERN-Projects/MDN-Suppliment-Website
```

### 2. Backend setup

```bash
cd server
npm install
```

Create a `.env` file in `server/` with:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Run the backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd ../client
npm install
```

Create a `.env` file in `client/` with:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
```

The app should now be running locally, with the frontend calling the backend API.

## Environment Variables

`.env` files are excluded from version control via `.gitignore`. Refer to the variables listed above for `server/` and `client/` when setting up your own local environment.

## License

This project is for personal/educational use. Add a license here if you plan to open-source it (e.g. MIT).