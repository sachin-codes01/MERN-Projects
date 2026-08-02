# Vārtālāpaḥ — Real-time Chatting App

A full-stack real-time chat application built on the MERN stack (MongoDB, Express, React, Node.js) with Socket.IO. Sign in with Google and start talking instantly — one-to-one chats, group chats, photo and video sharing, typing indicators, online presence and read receipts, all delivered live over WebSockets.

## 🌐 Live Demo

🚀 **Live Website:** https://vartalapah-chatting-app-lac.vercel.app/

## 📸 Screenshot

<p align="center">
  <img src="./client/public/vartalapah.png" alt="Vārtālāpaḥ Chatting App Screenshot" width="100%" />
</p>

## Features

### Chat
- Google OAuth login — no manual registration, account created on first sign-in
- One-to-one private chats with any registered user
- Group chats with an admin, member add/remove, and group rename
- Photo and short video sharing, uploaded to Cloudinary (5 MB image / 20 MB video limits)
- Live typing indicator while the other person is writing
- Online / offline presence with a "last seen" timestamp
- Read receipts (blue tick) once a message is opened
- Edit and delete your own messages, reflected instantly on both sides
- Search users by name or email to start a new conversation

### Chat management
- Block and unblock users — a blocked user can no longer reach you, enforced on the server
- Pin important chats to the top of the sidebar
- Archive and hide conversations to keep the list clean
- Sidebar shows the latest message preview, unread state and timestamp for every chat

### Account
- Profile page showing account info (name, email, avatar) sourced from the Google account
- Light and dark theme toggle, persisted across sessions
- Account deletion using a soft delete, so the other person's chat history stays intact
- Session persists across page refreshes via an httpOnly cookie

## Tech Stack

### Frontend (`/client`)
- React + Vite
- React Router
- Tailwind CSS v4
- Material UI (MUI) components and icons
- Google OAuth (`@react-oauth/google`)
- Socket.IO client for real-time events
- Context API for auth, socket connection and theme

### Backend (`/server`)
- Node.js + Express
- MongoDB with Mongoose
- Socket.IO for real-time messaging, typing and presence
- Google OAuth verification + JWT session tokens stored in httpOnly cookies
- Cloudinary for image and video storage (via Multer + `multer-storage-cloudinary`)
- REST API with route-level middleware for authentication

## Project Structure

```text
Vartalapah-ChattingApp/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/              API client - single entry point for backend calls
│   │   ├── assets/           Fonts and poster images
│   │   ├── components/       chat/ and home/ UI components
│   │   ├── context/          Auth, Socket and Theme providers
│   │   ├── hooks/            useChatList, useMessages, useChatSocket, etc.
│   │   ├── pages/            Home, Login, Chat
│   │   └── utils/            Formatting and media validation helpers
│   ├── vercel.json           SPA rewrite for client-side routing
│   └── .env
│
└── server/
    ├── config/               MongoDB and Cloudinary setup
    ├── middleware/           JWT auth guard, error handler
    ├── models/               User, Group, Message
    ├── routes/               auth, users, messages, groups, upload
    ├── socket/               Socket.IO auth, rooms, typing, presence
    ├── utils/                Token, relations and group-room helpers
    ├── test-api.js           Automated API test suite
    ├── server.js
    └── .env
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- MongoDB (Local installation or MongoDB Atlas)
- A Cloudinary account (for media uploads)
- A Google Cloud project with an OAuth 2.0 Client ID configured

### 1. Clone the Repository

```bash
git clone https://github.com/sachin-codes01/MERN-Projects.git
cd MERN-Projects/Vartalapah-ChattingApp
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
GOOGLE_CLIENT_ID=your_google_oauth_client_id
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
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
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Start the frontend:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

> The frontend uses `strictPort`, so it always runs on `5173`. If that port is busy Vite fails loudly instead of silently moving to `5174` — which would break both CORS and Google login.

## Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

> Both `.env` files are excluded from version control using `.gitignore`.
> `VITE_API_URL` must not end with a trailing slash — the API client builds requests as `${VITE_API_URL}/api${path}`.

## Testing

```bash
cd server
npm test
```

Runs an automated API test suite covering auth, users, blocking, messages, groups, uploads and account deletion. The script creates its own test users, signs their JWTs directly (no Google login needed) and cleans up all test data from the database when it finishes.

A manual browser checklist is available in [TESTING.md](TESTING.md).

## Deployment

- **Frontend** is deployed on [Vercel](https://vercel.com) with the root directory set to `Vartalapah-ChattingApp/client`. Environment variables are set under Project Settings → Environment Variables, and a redeploy is required after any change since Vite bakes `VITE_*` values in at build time.
- **Backend** is deployed on [Render](https://render.com) with the root directory set to `Vartalapah-ChattingApp/server`. Environment variables are set under the service's Environment tab, which triggers an automatic redeploy on save.
- `NODE_ENV=production` must be set on Render so the session cookie is issued with `secure: true` and `sameSite: 'none'`, which is what makes cross-domain login work between Vercel and Render.
- `CLIENT_URL` on Render must match the deployed Vercel URL exactly, since it drives CORS for both the REST API and the Socket.IO connection.
- The Google Cloud Console OAuth Client must have the deployed frontend URL added under **Authorized JavaScript origins** for Google login to work in production.
- MongoDB Atlas must allow `0.0.0.0/0` under Network Access, because Render and Vercel do not use fixed outbound IPs.

Full step-by-step deployment instructions are in [DEPLOY.md](DEPLOY.md).

> The backend runs on Render's free tier, which sleeps after 15 minutes of inactivity. The first request after a sleep can take up to 50 seconds to wake the service.

## Tech Highlights

- MERN Stack Architecture
- Real-time Messaging with Socket.IO Rooms
- Google OAuth Authentication & JWT Session Handling via httpOnly Cookies
- Typing Indicators, Online Presence and Read Receipts
- Cloudinary Media Uploads with Type, Size and Duration Validation
- Group Chats with Admin-controlled Membership
- Block / Pin / Archive Relations through a Single Unified Endpoint
- Soft Delete to Preserve Conversation History
- Custom React Hooks for Chat State Management
- Light / Dark Theme with Context API
- Responsive UI with Tailwind CSS and MUI
- Automated API Test Suite

## License

This project is for personal and educational purposes. Feel free to fork and modify it for learning.
