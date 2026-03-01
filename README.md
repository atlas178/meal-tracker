# NutriTrack - Meal Tracker App

A full-stack meal tracking application built with React, Express, and SQLite. Track your daily nutrition, set macro goals, view weekly analytics, and share progress with family members.

## Features

- **User Authentication** - Signup/login with JWT and bcrypt password hashing
- **Daily Dashboard** - Visual macro tracking with progress rings and bars
- **Meal Logging** - Search from 30+ common foods or add custom foods
- **Weekly Analytics** - Charts showing calorie and macro trends (powered by Recharts)
- **Meal History** - Browse and search past meals by date and food name
- **Profile & Goals** - Set custom calorie, protein, carbs, and fat goals
- **Family Sharing** - Create family groups, invite members, view each other's progress

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router, Recharts
- **Backend**: Node.js, Express, JWT authentication
- **Database**: SQLite (via better-sqlite3)
- **Build Tool**: Vite

## Quick Start

### Prerequisites

- Node.js 18+

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

The backend `.env` file is pre-configured for local development. To customize:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env as needed
```

### 3. Start the app

In two terminals:

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
meal-tracker/
├── backend/
│   ├── src/
│   │   ├── db/schema.js          # SQLite schema & seed data
│   │   ├── middleware/auth.js     # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js           # Login, signup, profile
│   │   │   ├── meals.js          # CRUD meals, daily/weekly summaries
│   │   │   ├── foods.js          # Search, create, delete foods
│   │   │   └── families.js       # Family groups, invite, member progress
│   │   └── index.js              # Express server entry
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # Auth context
│   │   ├── pages/                # Route pages
│   │   ├── utils/                # API client, date helpers
│   │   ├── App.jsx               # Router & auth guards
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile & goals |
| GET | `/api/foods/search?q=` | Search food database |
| GET | `/api/foods` | List all foods |
| POST | `/api/foods` | Create custom food |
| GET | `/api/meals?date=` | Get meals (by date or range) |
| GET | `/api/meals/daily-summary?date=` | Daily macro totals |
| GET | `/api/meals/weekly-summary` | Weekly macro totals by day |
| POST | `/api/meals` | Log a meal |
| PUT | `/api/meals/:id` | Update a meal |
| DELETE | `/api/meals/:id` | Delete a meal |
| GET | `/api/families` | List user's families |
| POST | `/api/families` | Create a family |
| POST | `/api/families/join` | Join via invite code |
| GET | `/api/families/:id/members` | List family members |
| GET | `/api/families/:id/members/:uid/summary` | Member's daily summary |
| DELETE | `/api/families/:id/leave` | Leave a family |
