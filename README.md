# PillMaa 💊

A **production-quality medicine reminder application** built with React Native (Expo) + Node.js backend + Supabase PostgreSQL.

---

## 🏗️ Project Structure

```
PillMaa/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/       # Database, env, Clerk
│   │   ├── modules/      # auth/, reminders/
│   │   └── shared/       # errors, responses, middleware, utils
│   └── prisma/           # schema.prisma
│
└── mobile/           # React Native + Expo + TypeScript
    ├── app/
    │   ├── (auth)/       # login, signup
    │   ├── (tabs)/       # dashboard, profile
    │   └── reminder/     # create, edit, alarm
    └── src/
        ├── components/   # ui/, reminder/, animations/
        ├── services/     # api, auth, reminder
        ├── store/        # Zustand stores
        ├── hooks/        # useReminders, useNotifications, useAlarm
        ├── theme/        # colors, typography, spacing, shadows
        └── utils/        # notifications, dateHelpers
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android emulator) or physical device
- Supabase account + project
- Clerk account + app

---

## ⚙️ Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values:
# DATABASE_URL    — Supabase pooled connection
# DIRECT_URL      — Supabase direct connection  
# CLERK_SECRET_KEY
# CLERK_PUBLISHABLE_KEY
```

### 3. Run Prisma migrations
```bash
npm run prisma:push
# or for production:
npm run prisma:migrate
```

### 4. Generate Prisma client
```bash
npm run prisma:generate
```

### 5. Start dev server
```bash
npm run dev
# API available at http://localhost:3000
# Health: GET http://localhost:3000/health
```

---

## 📱 Mobile Setup

### 1. Install dependencies
```bash
cd mobile
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values:
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1  (Android emulator)
```

### 3. Add Inter font package
```bash
npx expo install @expo-google-fonts/inter
```

### 4. Start Expo dev server
```bash
npx expo start --android
```

---

## 🔑 Clerk Setup

This project uses Clerk app: `app_3E8Wdid2Sor0HNRAeXVPvXonbix`

1. Log into [dashboard.clerk.com](https://dashboard.clerk.com)
2. Go to your app → **API Keys**
3. Copy the **Publishable Key** → `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `mobile/.env`
4. Copy the **Secret Key** → `CLERK_SECRET_KEY` in `backend/.env`
5. Enable **Email/Password** sign-in in Clerk dashboard

---

## 🗄️ Supabase + Prisma Setup

Your Supabase project connection strings (replace `[YOUR-PASSWORD]`):

```env
DATABASE_URL="postgresql://postgres.lwjoamnuxiqlbqppfeca:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.lwjoamnuxiqlbqppfeca:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

Then run:
```bash
cd backend
npm run prisma:push    # Push schema to Supabase (development)
npm run prisma:generate # Generate Prisma client
```

---

## 📡 REST API

Base URL: `http://localhost:3000/api/v1`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | ❌ |
| `POST` | `/auth/sync` | Sync Clerk user to DB | ✅ |
| `GET` | `/auth/me` | Get current user | ✅ |
| `GET` | `/reminders` | List all reminders | ✅ |
| `POST` | `/reminders` | Create reminder | ✅ |
| `GET` | `/reminders/:id` | Get reminder | ✅ |
| `PUT` | `/reminders/:id` | Update reminder | ✅ |
| `DELETE` | `/reminders/:id` | Delete reminder | ✅ |
| `PATCH` | `/reminders/:id/complete` | Mark as taken | ✅ |

**Auth**: Bearer token from Clerk (`Authorization: Bearer <clerk_jwt>`)

### Response Format
```json
{
  "success": true,
  "message": "Reminder created successfully",
  "data": { ... }
}
```

---

## 🔔 Notification Setup (Android)

The app uses Expo Notifications with:
- `MAX` importance channel for reminders
- Vibration + sound on delivery
- Notification tap → opens alarm screen
- Snooze: re-schedules notification after N minutes
- Midnight cron: resets daily completions

**Required Android permissions** (configured in `app.json`):
- `SCHEDULE_EXACT_ALARM`
- `USE_EXACT_ALARM`  
- `RECEIVE_BOOT_COMPLETED`
- `VIBRATE`
- `WAKE_LOCK`
- `POST_NOTIFICATIONS`

**Add alarm sound**: Place `alarm.wav` in `mobile/assets/sounds/`

---

## 🎨 Design System

**Color palette**: Calming green (`#16a34a` primary) + white backgrounds
**Typography**: Inter font family, elder-friendly scale
**Animations**: Reanimated 3 — spring press, fade-in, pulse, slide-up
**Shadows**: Cross-platform iOS shadow + Android elevation

---

## 📁 Database Schema

```prisma
model User {
  id       String     @id @default(cuid())
  clerkId  String     @unique
  name     String
  email    String     @unique
  reminders Reminder[]
}

model Reminder {
  id             String     @id @default(cuid())
  medicineName   String
  dosage         String
  reminderTime   String     // "HH:MM"
  repeatType     RepeatType // DAILY | CUSTOM | TODAY_ONLY
  repeatDays     String[]   // ["MON","WED","FRI"]
  startDate      DateTime
  endDate        DateTime?
  snoozeCount    Int        @default(3)
  snoozeInterval Int        @default(5)
  isCompleted    Boolean    @default(false)
}
```

---

## 🛠️ Scripts

### Backend
```bash
npm run dev           # Start dev server with hot reload
npm run build         # Compile TypeScript
npm run prisma:studio # Open Prisma Studio UI
npm run lint          # ESLint
```

### Mobile
```bash
npx expo start --android   # Start Android dev build
npx expo start --ios       # Start iOS dev build
npm run type-check         # TypeScript check
npm run lint               # ESLint
```

---

## 🔒 Security Notes

- Never expose `CLERK_SECRET_KEY` in client-side code
- Use `EXPO_PUBLIC_` prefix for Expo env vars exposed to client
- Backend validates every request with Clerk JWT middleware
- All reminder endpoints verify user ownership before DB access

---

## 🗺️ Upgrade Path (Production)

For exact alarm behavior on Android 12+:
1. Migrate to native Android foreground service
2. Use `WorkManager` for background alarm scheduling
3. Implement `BroadcastReceiver` for boot persistence
4. Use `AlarmManager.setExactAndAllowWhileIdle()`

The current codebase is **architected** to support this migration without major refactoring.
