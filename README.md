# 🍔 ZAAVO — Campus Food & Fitness Delivery Platform

> **Premium food delivery for college students, hostel warriors, and gym beasts.**  
> Built like a funded startup. Fast. Scalable. Beautiful.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.6-010101?logo=socket.io)](https://socket.io)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Test Credentials](#-test-credentials)

---

## ✨ Features

### 🛒 Customer
- Browse 50+ campus restaurants with real-time availability
- Smart search with filters (cuisine, diet type, fitness goal, price)
- Food detail modal with full nutrition breakdown (protein, carbs, fat, calories)
- Cart with coupon system and wallet payments
- Real-time order tracking via Socket.io
- Wishlist and saved addresses
- Loyalty points + referral system
- Monthly meal subscriptions (Basic / Pro Athlete / Elite)

### 💪 Fitness
- Macro-tracked gym meals (Bulking, Cutting, Keto, Vegan, High Protein)
- AI-suggested meals based on fitness goal
- Per-serving nutrition facts (calories, protein, carbs, fat, fiber, sodium)
- Subscription plans with 30% savings

### 🍽 Restaurant Dashboard
- Live order management with status advancement (Accept → Prepare → Ready → Dispatch)
- Menu item management (add, edit, toggle availability)
- Revenue analytics and top-item charts
- Open/Closed toggle with auto-notification

### 🛵 Delivery Partner
- Real-time order assignment via Socket.io
- Live location broadcasting
- Earnings tracker (daily, weekly)
- Online/Offline toggle

### 🛠 Admin Console
- Platform-wide stats (GMV, users, orders, restaurants)
- Restaurant approval workflow
- User management with role control
- Coupon creation and management
- Broadcast push notifications
- Revenue analytics with charts
- Delivery partner oversight

---

## 🏗 Architecture

```
zaavo/
├── frontend/          # React + Vite + Tailwind (Customer App)
├── backend/           # Node.js + Express REST API
├── admin/             # React Admin Dashboard (standalone HTML)
├── restaurant/        # Restaurant Owner Dashboard (standalone HTML)
└── docs/              # API documentation
```

**Backend uses MVC pattern:**
```
backend/
├── controllers/       # Business logic
├── models/            # Mongoose schemas
├── routes/            # Express route definitions
├── middleware/        # Auth, error handling
├── sockets/           # Socket.io real-time handlers
└── scripts/           # Seed, migrations
```

---

## ⚡ Tech Stack

| Layer       | Technology                                        |
|-------------|--------------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, Framer Motion      |
| State       | Redux Toolkit + RTK Query                         |
| Backend     | Node.js, Express.js, MVC Architecture             |
| Database    | MongoDB Atlas, Mongoose                           |
| Auth        | JWT (access + refresh tokens), Google OAuth       |
| Real-time   | Socket.io (order tracking, notifications)         |
| Payments    | Razorpay (UPI, cards, wallets)                   |
| Storage     | Cloudinary (images)                               |
| Email       | Nodemailer + Gmail SMTP                           |
| Security    | Helmet, bcrypt, rate limiting, CORS               |

---

## 📂 Project Structure

```
zaavo/
├── index.html                    # 🌟 Full frontend demo (standalone)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── store/
│       │   └── index.js          # Redux store (auth, cart, orders, ui)
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Restaurants.jsx
│       │   ├── RestaurantDetail.jsx
│       │   ├── Fitness.jsx
│       │   ├── Cart.jsx
│       │   ├── OrderTracking.jsx
│       │   ├── Profile.jsx
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   └── Subscription.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── BottomNav.jsx
│       │   ├── FoodModal.jsx
│       │   ├── RestaurantCard.jsx
│       │   ├── FoodCard.jsx
│       │   └── CartToast.jsx
│       ├── hooks/
│       │   ├── useSocket.js
│       │   └── useAuth.js
│       └── services/
│           └── api.js
│
├── backend/
│   ├── server.js                 # Express + Socket.io entry
│   ├── package.json
│   ├── .env.example
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Restaurant.model.js   # + Food model
│   │   └── Order.model.js        # + Payment, Coupon, Review, Notification, DeliveryPartner, Subscription
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── order.controller.js
│   │   └── payment.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── restaurant.routes.js
│   │   ├── food.routes.js        # + order, payment, coupon, user, review, delivery, admin routes
│   ├── middleware/
│   │   └── auth.middleware.js    # protect, authorize, asyncHandler
│   ├── sockets/
│   │   └── socket.handler.js
│   └── scripts/
│       └── seed.js
│
├── admin/
│   └── index.html                # 🛠 Admin Dashboard (standalone)
│
└── restaurant/
    └── index.html                # 🍽 Restaurant Dashboard (standalone)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Razorpay account (test mode)
- Cloudinary account

### 1. Clone & Install

```bash
git clone https://github.com/your-username/zaavo.git
cd zaavo

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Start Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

**Frontend:** http://localhost:5173  
**Backend API:** http://localhost:5000/api  
**Health Check:** http://localhost:5000/health

### 5. Open Dashboards

- **Customer App:** Open `index.html` directly in browser (standalone demo)
- **Admin Dashboard:** Open `admin/index.html` in browser
- **Restaurant Dashboard:** Open `restaurant/index.html` in browser

---

## 🔐 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_secret_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=30d

# Razorpay (get from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Cloudinary (get from cloudinary.com)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=app_password_here

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## 📡 API Documentation

**Base URL:** `http://localhost:5000/api`

### Auth Endpoints

| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| POST   | `/auth/register`                | ❌   | Register new user        |
| POST   | `/auth/login`                   | ❌   | Login                    |
| POST   | `/auth/google`                  | ❌   | Google OAuth             |
| GET    | `/auth/me`                      | ✅   | Get current user         |
| POST   | `/auth/verify-otp`              | ✅   | Verify phone/email OTP   |
| POST   | `/auth/resend-otp`              | ✅   | Resend OTP               |
| POST   | `/auth/forgot-password`         | ❌   | Request password reset   |
| POST   | `/auth/reset-password/:token`   | ❌   | Reset password           |
| POST   | `/auth/refresh-token`           | ❌   | Refresh access token     |
| POST   | `/auth/logout`                  | ✅   | Logout                   |

### Restaurant Endpoints

| Method | Endpoint                          | Auth    | Description                   |
|--------|-----------------------------------|---------|-------------------------------|
| GET    | `/restaurants`                    | ❌      | List all (search, filter)     |
| GET    | `/restaurants/featured`           | ❌      | Featured restaurants          |
| GET    | `/restaurants/nearby`             | ❌      | Geo-query nearby              |
| GET    | `/restaurants/:id`                | ❌      | Get single restaurant         |
| GET    | `/restaurants/:id/menu`           | ❌      | Get restaurant menu           |
| POST   | `/restaurants`                    | Owner   | Create restaurant             |
| PUT    | `/restaurants/:id`                | Owner   | Update restaurant             |
| PATCH  | `/restaurants/:id/toggle`         | Owner   | Toggle open/close             |

### Order Endpoints

| Method | Endpoint                    | Auth      | Description              |
|--------|-----------------------------|-----------|--------------------------|
| POST   | `/orders`                   | Customer  | Place order              |
| GET    | `/orders/my`                | Customer  | My order history         |
| GET    | `/orders/:id`               | Customer  | Get order details        |
| PATCH  | `/orders/:id/status`        | Owner     | Update order status      |
| PATCH  | `/orders/:id/cancel`        | Customer  | Cancel order             |
| GET    | `/orders/restaurant/:id`    | Owner     | Restaurant's orders      |

### Payment Endpoints

| Method | Endpoint                     | Auth     | Description              |
|--------|------------------------------|----------|--------------------------|
| POST   | `/payments/create-order`     | Customer | Create Razorpay order    |
| POST   | `/payments/verify`           | Customer | Verify payment signature |
| POST   | `/payments/refund`           | Admin    | Process refund           |
| GET    | `/payments/history`          | Customer | Payment history          |
| POST   | `/payments/wallet/add`       | Customer | Add wallet balance       |

### Admin Endpoints (Admin role required)

| Method | Endpoint                          | Description                     |
|--------|-----------------------------------|---------------------------------|
| GET    | `/admin/dashboard`                | Platform stats                  |
| GET    | `/admin/users`                    | All users (paginated)           |
| PATCH  | `/admin/restaurants/:id/approve`  | Approve restaurant              |
| GET    | `/admin/orders`                   | All platform orders             |
| GET    | `/admin/analytics/revenue`        | Revenue analytics               |
| POST   | `/admin/broadcast`                | Push notification to all users  |

---

## 🧪 Test Credentials

After running `npm run seed`:

| Role               | Email                          | Password      |
|--------------------|--------------------------------|---------------|
| 🛡️ Super Admin     | `admin@zaavo.app`              | `Admin@2025`  |
| 🎓 Student         | `rohan@iitd.ac.in`             | `Student@123` |
| 💪 Gym Goer        | `priya.mehta@gmail.com`        | `Gym@2025`    |
| 🏠 Hostelite       | `arjun@nitw.ac.in`             | `Hostel@123`  |
| 🍽️ Restaurant Owner | `raj@proteinktchn.com`         | `Rest@2025`   |
| 🛵 Delivery Partner | `rahul.delivery@zaavo.com`     | `Rider@2025`  |

---

## 🌐 Deployment

### Vercel (Frontend)

```bash
cd frontend
npm run build
vercel --prod
```

### Render (Backend)

1. Push backend to GitHub
2. Create new Web Service on Render
3. Set Build Command: `npm install`
4. Set Start Command: `node server.js`
5. Add all environment variables in Render dashboard

### MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user
3. Whitelist IP: `0.0.0.0/0` (for development)
4. Copy connection string to `MONGO_URI`

---

## 🔌 Socket.io Events

| Event                      | Direction           | Description                          |
|----------------------------|---------------------|--------------------------------------|
| `order:track`              | Client → Server     | Join order tracking room             |
| `order:update`             | Server → Client     | Order status changed                 |
| `order:new`                | Server → Restaurant | New order received                   |
| `delivery:location_update` | Rider → Server      | Update rider GPS position            |
| `delivery:location`        | Server → Customer   | Rider location broadcast             |
| `delivery:toggle_status`   | Rider → Server      | Go online / offline                  |
| `delivery:accept_order`    | Rider → Server      | Rider accepts an order               |
| `notification:broadcast`   | Server → All        | Admin push notification              |
| `chat:message`             | Client ↔ Server     | In-order chat (customer ↔ rider)    |

---

## 🏆 Feature Roadmap

- [ ] AI meal recommendations (based on fitness goal + order history)
- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] PWA with offline support
- [ ] Campus zone delivery restrictions
- [ ] QR code menu for restaurant tables
- [ ] Group ordering for hostel rooms
- [ ] Calorie tracking dashboard
- [ ] WhatsApp order notifications
- [ ] Recipe recommendations from leftovers

---

## 📄 License

MIT License. Built with ❤️ for campus warriors everywhere.

---

*ZAAVO — "Fuel your grind, feed the beast."* 🍔💪
