# ChiefOS 🧠

> **⚠️ Active Development:** This project is currently in the active building phase. Core visual layouts, scheduling systems, and design aesthetics have been constructed; backend AI features are currently sandboxed as core engines are finalized.

ChiefOS is a premium, state-of-the-art agentic operating system dashboard designed for seamless schedule orchestration, task management, and executive daily briefings. It features a bespoke "Liquid Glass" design system, responsive layout systems, and morphing micro-animations.

---

## ✨ Features implemented

### 1. Daily Briefing Dashboard (`/dashboard/briefing`)
An elegant "Morning Report" dashboard summarizing your day's schedule density and focus allocations:
* **Audio Briefing Simulator**: A mock AI voice summary player equipped with a glowing, dynamic audio waveform visualizer that reacts and pulses during playback.
* **At-a-Glance Metrics**: Structured cards pulling live context from database risk and productivity engines:
  * *Optimal Focus*: Calculates your optimal deep work period.
  * *Active Load*: Live count of scheduled pending missions.
  * *Execution Risk*: Real-time color-coded indicators (Low, Medium, High stress levels).

### 2. Task Space Kanban (`/dashboard/missions`)
A visually striking, highly tactile task board organized into four dynamic columns:
* **Lanes**: Today's Plan, Future Plan, Unplanned Tasks, and Completed.
* **Liquid Glass Styling**: Layered 3D cards floating over recessed well lanes with distinct borders, top-edge light reflection lines, and vibrant color-guide accents.
* **Micro-interactions**: Support for checkbox completion, hover deletion, and inline date rescheduling.

### 3. Chief AI Chat Space (`/dashboard/chief`)
A minimal, sophisticated conversation playground to interact with the Chief AI core:
* **Grand Greeting Animation**: Personalized greetings that write turn-by-turn character-by-character on load, complete with a pulsing cursor.
* **Sleek Input Capsule**: Single-row text input bar removing toolbar clutter.
* **Liquid Gradient Flow**: Ambient colored gradient blobs morphing and floating continuously behind a satin-frosted overlay.

### 4. Interactive Scheduler (`/dashboard/schedule`)
A customized 24-hour calendar layout mapping day, week, and month views.

---

## 🛠️ Tech Stack

* **Framework**: Next.js (App Router, Tailwind CSS v4, TypeScript)
* **Animations**: Framer Motion
* **Database & ORM**: SQLite & Prisma
* **Integrations**: Vercel AI SDK & Lucide Icons

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` or `.env.local` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
```

### 3. Initialize Database
Generate the client library and run migrations:
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to inspect the application dashboard.

---

## 📄 License & Restrictions

**All Rights Reserved.** 

This repository and its contents are strictly for review and portfolio presentation purposes (e.g., resume demonstration). Any duplication, distribution, modification, or use of this codebase—specifically for submission in active hackathons, competitive events, or commercial applications—is **strictly prohibited** without express written consent from the owner.

