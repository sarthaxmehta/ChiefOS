<div align="center">
  <img src="./public/logo.png" alt="ChiefOS Logo" width="120" height="120">
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

## 🧠 The AI Architecture & Pipeline (The "Brain")

ChiefOS does not rely on simple, single-prompt wrapper scripts. It operates on a structured, multi-engine pipeline engineered to transition natural language inputs into precise, database-backed state updates. The entire system is built on top of a zero-dependency orchestration pipeline situated in `src/lib/ai/`.

### System Architecture & Pipeline Data Flow

The diagram below illustrates how an incoming user message flows through the core components of the ChiefOS "Brain":

```mermaid
graph TD
    User([User Prompt / Chat Input]) --> CE[ChiefEngine Orchestrator]
    
    %% Step 1: Fast-path or Intent parsing
    CE -->|1. Check Simple Greetings| FP{Greeting?}
    FP -->|Yes| FastPath[Bypass AI: Return conversational reply]
    FP -->|No| IE[IntentEngine]
    
    %% Step 2: Model fallback provider
    IE -->|2. Query LLM JSON Schema| MP[ModelProvider]
    MP -->|Primary: Groq LLaMA-3| MP
    MP -->|Fallback: Gemini 1.5 Flash| MP
    
    %% Step 3: Action Planning & Execution
    IE -->|3. Structured Intent JSON| AP[ActionPlanner]
    
    %% Action Planner dependencies
    AP -->|Calculates Time Windows| SE[SchedulingEngine]
    AP -->|Recursion Spawn| RE[RecurringEngine]
    AP -->|Decomposes Macro Tasks| TDE[TaskDecompositionEngine]
    AP -->|Commits DB Changes| DB[(Supabase PostgreSQL)]
    
    %% Step 4: Context Gathering
    CE -->|4. Risk Analysis| RKE[RiskEngine]
    CE -->|4. Productivity Patterns| ME[MemoryEngine]
    
    %% Step 5: Streaming Response Synthesis
    CE -->|5. Compile Context| RG[ResponseGenerator]
    RKE -.-> RG
    ME -.-> RG
    AP -.-> RG
    RG -->|6. Stream Synthesized Reply| Stream([Conversational UI Response])
```

---

### Detailed Engine Modules

Every directory inside `src/lib/ai/` represents a dedicated, specialized layer of the execution stack:

#### 1. `ChiefEngine` (The Orchestrator)
Located in `chief-engine.ts`, this is the entry point for all message executions. It controls the lifecycle of a request:
* **Fast-Path Logic:** Instantly resolves basic conversational greetings (e.g., "Hi", "Hello") without spinning up LLM processing, drastically reducing latency and rate-limit consumption.
* **Context Resolution:** Pulls user session configurations (working hours, focus windows) and passes them downstream.
* **Pipeline Synchronization:** Sequentially routes the input through the `IntentEngine`, delegates data modifications to the `ActionPlanner`, calls auxiliary diagnostic engines (`RiskEngine`, `MemoryEngine`), and forwards the combined state to the `ResponseGenerator` to establish a stream.

#### 2. `IntentEngine` (Natural Language Classifier & Entity Extractor)
Located in `intent-engine.ts`, this engine is responsible for parsing user queries into a strictly typed JSON contract.
* **Strict Intent Mapping:** Classifies requests into one of 14 specific system intents, such as `create_task`, `add_subtasks`, `update_subtask`, `delete_task`, `reschedule_tasks`, `get_schedule`, or `clear_schedule`.
* **Entity Extraction:** Dynamically extracts parameters (e.g., task titles, time ranges, explicit dates, categories, priorities, subtask strings) using complex schema definitions.
* **Time & Date Contextualization:** Ingests local anchor dates and client timezone offsets to translate relative time requests (e.g., "next Friday", "in 2 hours", "from 10am to 5pm") into absolute UTC intervals.

#### 3. `ActionPlanner` (Deterministic Executor)
Located in `action-planner.ts`, this engine acts as the bridge between LLM predictions and your database. It maps incoming JSON contracts into explicit database mutations using Prisma ORM.
* **Database Mapping:** Safely creates, updates, deletes, or completes `Mission` and `ScheduledBlock` records.
* **Timezone Safety Layer:** Employs timezone offsets (`tzOffset`) using a centralized UTC time translator (`applyLocalTime`) to map times safely to the database, preventing date-shifting when deployed to UTC-based servers (like Cloud Run).
* **Frictionless Fallbacks:** Auto-fills parameters missed by the AI engine (e.g. inferring an optimal focus category or energy classification based on the words in the task title).

#### 4. `SchedulingEngine` (Constraint-Based Slot Allocator)
Located in `scheduling-engine.ts`, this runs a custom algorithm designed to solve "calendar tetris".
* **Conflict Detection:** Examines your database for active calendar events (`CalendarEvent`) and pre-existing scheduling blocks (`ScheduledBlock`).
* **Biological Slot-Matching:** Filters candidate slots by matching the task's energy requirement (High/Medium/Low) against the user's preferred work windows (e.g. prioritizing complex coding tasks for morning focus hours).
* **Deterministic Allocation:** Auto-schedules the task into the first open block that meets both time and energy constraints.

#### 5. `TaskDecompositionEngine` (AI Project Planner)
Located in `task-decomposition.ts`, this module eliminates planning paralysis.
* **Subtask Decomposition:** Takes high-level objectives (e.g., "Prep pitching deck") and prompts the LLM to yield a structured array of subtasks.
* **Cognitive Allocation:** Estimates a completion duration (`durationMinutes`), difficulty, and energy requirement for each subtask.
* **Dependency Sequencing:** Orders subtasks in a logical sequence so that dependent tasks (e.g., "Design slides" after "Draft copy") are correctly organized.

#### 6. `MemoryEngine` (Behavior & Preference Manager)
Located in `memory-engine.ts`, this engine tracks user behavior to adapt the OS to their lifestyle.
* **Preference Retrieval:** Resolves working hours boundaries and focus windows.
* **Activity Tracking:** Collects metrics on typical deep work times, giving the system data-backed context on when you are most productive.

#### 7. `RiskEngine` (Stress & Burnout Diagnostic)
Located in `risk-engine.ts`, this is a diagnostic service that measures schedule health.
* **Workload Calculation:** Aggregates pending task durations and counts.
* **Risk Categorization:** Classifies daily schedules into Low, Medium, or High risk. If your scheduled blocks exceed your target work hours, the orchestrator triggers an alert warn you about over-commitment.

#### 8. `RecurringEngine` (Smart Auto-Recurring Spawner)
Located in `recurring-engine.ts`, this ensures recurring task management is fully automated.
* **Recurrence Matching:** Supports `Daily`, `Weekly`, and `Monthly` configurations.
* **Lifecycle Spawning:** Instantly calculates the next occurrence date and creates a new pending task block the second you mark the previous occurrence as complete.

#### 9. `ModelProvider` (Resilient Multi-Model Provider)
Located in `model-provider.ts`, this handles the interface with Vercel's AI SDK.
* **Resilient Fallbacks:** Implements fallback chains (Primary: Groq LLaMA-3 for near-zero latency; Secondary: Gemini 1.5 Flash for high context depth) to ensure your system never goes down due to API limits or network issues.

#### 10. `ResponseGenerator` (Conversational UI Output)
Located in `response-generator.ts`, this generates the final output stream.
* **Executive Summary:** Synthesizes the database operations, risk factors, and scheduling results into a clean, concise markdown stream.
* **Tone Control:** Adheres strictly to a professional, executive assistant persona, ensuring you are updated clearly on precisely what changes were made to your workspace.

---

## 🛠️ Tech Stack & Infrastructure

ChiefOS is built for extreme speed and enterprise-grade scalability.

* **Frontend:** Next.js 16 (App Router), React, Tailwind CSS, Framer Motion.
* **Backend:** Next.js Server Actions, Route Handlers.
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
