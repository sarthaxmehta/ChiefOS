<div align="center">
  <img src="public/favicon.ico" alt="ChiefOS Logo" width="80" height="80">
  <h1 align="center">ChiefOS</h1>
  <p align="center">
    <strong>An Autonomous AI-Driven Executive Assistant & Operating System</strong>
  </p>
  <p align="center">
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
    <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"></a>
  </p>
</div>

<br />

> **ChiefOS is a paradigm shift from passive task management to an active, AI-driven operating system designed to eliminate the friction of daily planning.**

Instead of manually juggling tasks, estimating time slots, and playing "calendar tetris," users declare high-level objectives. ChiefOS autonomously decomposes these missions into bite-sized tasks, analyzes your biological prime times (focus windows), and deterministically maps them onto a dynamic, conflict-free calendar.

---

## ✨ Core Capabilities

### 1. The Daily Executive Briefing
Start your day with a mathematically optimized, AI-synthesized morning report.
* **Audio Briefing Engine:** Utilizes native Web Speech Synthesis to read out a personalized, conversational summary of your day's schedule, focus allocations, and weather context.
* **Visual Waveform UI:** A glowing, dynamic audio visualizer that reacts and pulses during playback.
* **Live Risk Metrics:** Pulls real-time context from the database to calculate execution risk, active cognitive load, and your optimal deep-work windows.

> *Screenshot Placeholder: Insert image of the Briefing Dashboard here (e.g. `![Briefing Dashboard](/docs/briefing.png)`)*

### 2. Autonomous Task Decomposition
Stop writing to-do lists. Input a macro-goal (e.g., "Prepare for Q3 Board Meeting"), and ChiefOS's AI Engine takes over.
* Automatically breaks down the mission into a sequential, ordered checklist.
* Assigns a realistic `estimatedMinutes` to combat the human planning fallacy.
* Assigns an `energyLevel` (High/Medium/Low) requirement to each sub-task to optimize placement on the calendar.

### 3. Constraint-Based Scheduling Engine
A proprietary algorithm that maps tasks onto a 24-hour calendar grid.
* **Energy Matching:** High-cognitive tasks are prioritized for your specific "Focus Windows" (e.g., Morning Deep Work).
* **Conflict Resolution:** Safely places tasks around your existing calendar events and meetings.
* **Liquid UI Calendar:** A beautifully crafted, monochromatic daily, weekly, and monthly calendar interface that dynamically resizes and handles drag-and-drop rescheduling.

> *Screenshot Placeholder: Insert image of the Calendar/Schedule View here (e.g. `![Calendar View](/docs/calendar.png)`)*

### 4. Mission Control Kanban Space
A visually striking, highly tactile task board organized into dynamic columns (Today, Future, Unplanned, Completed).
* **Liquid Glass Styling:** Layered 3D cards floating over recessed well lanes with distinct borders and top-edge light reflection lines.
* **Tactile Interactions:** Support for checkbox completion, hover deletion, and inline date rescheduling.

---

## 🧠 The AI Architecture (The "Brain")

ChiefOS is powered by a multi-agent backend architecture located in `src/lib/ai/`. We utilize **Google Gemini Pro** and **Groq** for high-speed, highly contextual JSON reasoning.

1. **Task Decomposition Engine (`task-decomposition.ts`):** Ingests raw strings, applies a strict system prompt regarding human cognitive load, and outputs a structured JSON schema representing a project breakdown.
2. **Scheduling Engine (`scheduling-engine.ts`):** A deterministic algorithm that reads the decomposed tasks, fetches existing PostgreSQL calendar events, and identifies available blocks of time, returning an array of precise start/end `DateTime` objects.
3. **Memory & Preference Engine (`memory-engine.ts`):** Learns your habits. It stores your preferred working hours (e.g., 9 AM to 6 PM) and focus mode preferences, injecting this context into every scheduling API call to ensure strict adherence to your lifestyle boundaries.
4. **Risk Engine (`risk-engine.ts`):** Analyzes your current daily load (task density vs. available free time) to output a stress/risk score (Low/Medium/High), warning you if you have over-planned your day.

---

## 🛠️ Tech Stack & Infrastructure

ChiefOS is built for extreme speed and enterprise-grade scalability.

* **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion.
* **Backend:** Next.js Server Actions, API Routes.
* **Database & ORM:** Serverless PostgreSQL hosted on **Supabase**, interacting via **Prisma ORM** for end-to-end type safety.
* **Authentication:** **NextAuth.js (Auth.js v5)** integrating **Google OAuth 2.0** for secure, frictionless, passwordless login.
* **Deployment:** Fully containerized via Docker and deployed on **Google Cloud Run**. Serverless execution allows the app to scale from zero, ensuring hyper-fast cold starts and robust handling of intensive AI-processing traffic.

---

## 🚀 Local Development Setup

To run ChiefOS locally on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ChiefOS.git
cd ChiefOS
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory. You will need API keys for Google OAuth, Gemini/Groq, and a PostgreSQL database.
```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@your-supabase-url.com:6543/postgres"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@your-supabase-url.com:5432/postgres"

# Authentication (NextAuth v5)
AUTH_SECRET="your-generated-secret"
AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Providers
GEMINI_API_KEY="your-gemini-key"
GROQ_API_KEY="your-groq-key"
```

### 4. Initialize Database
Push the Prisma schema to your PostgreSQL database and generate the local client:
```bash
npx prisma db push
npx prisma generate
```

### 5. Start the Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment

ChiefOS is optimized for deployment on **Google Cloud Run** utilizing **Google Cloud Build**. 

1. Ensure your Google Cloud CLI is authenticated (`gcloud auth login`).
2. Run the deployment command from the project root:
```bash
gcloud run deploy chiefos-web \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=...,AUTH_TRUST_HOST=true"
```
*See `gcp_deployment_guide.md` in the documentation for exact step-by-step instructions.*

---

## 📄 License & Restrictions

**All Rights Reserved.** 

This repository and its contents are strictly for review and portfolio presentation purposes. Any duplication, distribution, modification, or use of this codebase—specifically for submission in active hackathons, competitive events, or commercial applications—is **strictly prohibited** without express written consent from the owner.
