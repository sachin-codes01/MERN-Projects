# MDN Suppliment Website

A full-stack e-commerce platform for supplements and fitness nutrition, built on the MERN stack (MongoDB, Express, React, Node.js). Includes a customer-facing storefront and a full admin panel for managing products, orders, coupons, and users.

## 🌐 Live Demo

🚀 **Live Website:** https://mdn-my-daily-nutrition.vercel.app/

## 📸 Screenshot

<p align="center">
  <img src="./public/mdn.png" alt="MDN Suppliment Website Screenshot" width="100%" />
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

### Frontend (`/client`)
- React + Vite
- React Router
- Tailwind CSS
- Context API for auth, cart badge, and toast notifications

### Backend (`/server`)
- Node.js + Express
- MongoDB with Mongoose
- JWT-based authentication
- REST API with route-level middleware for auth and admin access control

## Project Structure

```text
MDN-Suppliment-Website/
├── client/                   
│   ├── public/
│   ├── src/
│   │   ├── api/              
│   │   ├── components/       
│   │   ├── context/          
│   │   ├── pages/            
│   │   ├── styles/
│   │   └── utils/
│   └── .env                  
│
└── server/                   
    ├── controller/           
    ├── middleware/           
    ├── models/               
    ├── routes/               
    ├── database.js
    ├── server.js
    └── .env                  
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- MongoDB (Local installation or MongoDB Atlas)

### 1. Clone the Repository

```bash
git clone https://github.com/sachin-codes01/MERN-Projects.git
cd MERN-Projects/MDN-Suppliment-Website
```

### 2. Backend Setup

Install dependencies:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

Install dependencies:

```bash
cd ../client
npm install
```

Create a `.env` file inside the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

## Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Frontend (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> Both `.env` files are excluded from version control using `.gitignore`.

## Tech Highlights

- MERN Stack Architecture
- JWT Authentication & Authorization
- Role-based Admin Dashboard
- RESTful API
- Responsive UI with Tailwind CSS
- Guest Cart with Login Synchronization
- Coupon Management System
- Order Tracking Timeline
- Search Functionality
- Context API State Management

## License

This project is for personal and educational purposes. Feel free to fork and modify it for learning.