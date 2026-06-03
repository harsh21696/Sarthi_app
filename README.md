# 🌿 GramSaathi AI

**AI-powered assistant for rural citizens of India** — multilingual crop disease detection, government scheme finder, real-time weather alerts, and voice assistant.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Chat** | Multilingual chat in 6 Indian languages (Hindi, Tamil, Telugu, Marathi, Bengali, English) |
| 🌿 **Crop Doctor** | Upload crop images → AI diagnoses disease + treatment plan |
| 🌦️ **Weather Alerts** | Real-time weather + 7-day forecast + crop-specific disaster alerts |
| 🏛️ **Gov Schemes** | AI-powered search for PM Kisan, crop insurance, scholarships |
| 🎙️ **Voice Assistant** | Speech-to-text in your native language |
| 📧 **Email OTP** | Secure email verification on registration |
| 👨‍💼 **Admin Panel** | System stats, user management, analytics charts, API health monitor |
| 📱 **PWA** | Installable on Android/iOS/Desktop, offline support |

## 🛠️ Tech Stack

**Frontend:** React 19, Vite, TailwindCSS, Recharts, i18next (8 languages), PWA  
**Backend:** Node.js, Express.js, Prisma ORM  
**Database:** PostgreSQL 16  
**AI:** Groq (Llama 3.3 70B), Google Gemini 1.5 Flash  
**Email:** Nodemailer (Gmail SMTP)  
**Weather:** Open-Meteo API (free, no key needed)

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Groq API Key (free at [console.groq.com](https://console.groq.com))
- Gemini API Key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone & Setup
```bash
git clone https://github.com/yourusername/gramsaathi-ai.git
cd gramsaathi-ai
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env        # Fill in your credentials
npm install
npx prisma migrate dev      # Run DB migrations
npm run dev                 # Starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev                 # Starts on http://localhost:5173
```

## 🌐 Deployment

### Option A: Vercel (Frontend) + Railway (Backend) — Recommended

**Backend → Railway:**
1. Push code to GitHub
2. Connect repo to [Railway](https://railway.app)
3. Add a PostgreSQL plugin
4. Set all environment variables from `.env.example`
5. Railway auto-detects the `railway.json` and deploys

**Frontend → Vercel:**
1. Connect frontend folder to [Vercel](https://vercel.com)
2. Set `VITE_API_URL` to your Railway backend URL
3. Deploy — Vercel uses `vercel.json` automatically

### Option B: Docker Compose (Self-hosted)
```bash
cp backend/.env.example .env    # Fill in credentials
docker-compose up -d            # Starts DB + Backend
```

## 📁 Project Structure

```
gramsaathi-ai/
├── backend/
│   ├── prisma/            # DB schema + migrations
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # AI, Email, Weather services
│   │   ├── routes/        # Express routes
│   │   └── middleware/    # Auth, rate limiting
│   ├── Dockerfile
│   └── server.js
├── frontend/
│   ├── public/            # PWA manifest, icons, SW
│   ├── src/
│   │   ├── pages/         # All page components
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Auth context
│   │   └── i18n/          # 6-language translations
│   └── vercel.json
├── docker-compose.yml
└── railway.json
```

## 🔑 Environment Variables

See [`backend/.env.example`](backend/.env.example) for all required variables.

## 📸 Screenshots

_Dashboard with analytics, Admin panel, Weather page with crop alerts, OTP verification_

## 📄 License

MIT © 2025 — Built with ❤️ for rural India
