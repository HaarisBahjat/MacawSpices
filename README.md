# SpiceWallah

A full-stack premium spice e-commerce platform with custom blend mixing and Razorpay payment integration.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS v3 + Framer Motion
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Cache/Cart**: Upstash Redis
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Payments**: Razorpay

## Project Structure
```
spiceWallah/
├── backend/          Express API
├── frontend/         React + Vite app
```

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Copy the `DATABASE_URL` and `DIRECT_URL` from Settings > Database > Connection string
3. Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from Settings > API

### 2. Upstash Redis
1. Create a free Redis DB at [upstash.com](https://upstash.com) (choose Mumbai region)
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 3. Razorpay
1. Create account at [razorpay.com](https://razorpay.com)
2. Go to Settings > API Keys → Generate Test Key
3. Copy `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### 4. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your credentials in .env

npm install
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

### 5. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

## Features
- 🌶️ **Product Catalog** — Browse spices with category filters, search, sort
- 🧪 **Spice Mixer** — Choose preset blend templates (Garam Masala, Biryani, Kerala), adjust quantity multiplier, see live price breakdown
- 🛒 **Cart** — Redis-backed persistent cart (7-day TTL)
- 💳 **Checkout** — Multi-step: address → review → Razorpay payment
- 📦 **Order Tracking** — Visual status timeline
- 👤 **Account** — Profile, orders history, saved blends, addresses
- 🔧 **Admin Panel** — Stats dashboard, order management (update status), product management

## Deployment
- **Frontend**: Deploy `frontend/` to Vercel
- **Backend**: Deploy `backend/` to Railway
- Set env variables on both platforms

## Env Files
- `backend/.env.example` → copy to `backend/.env`
- `frontend/.env.example` → copy to `frontend/.env`
