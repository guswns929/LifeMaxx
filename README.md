# LifeMaxx

## Features

- **Interactive Body Diagram** — Click muscle groups to view development scores, exercise history, and population-based strength rankings. Hover to highlight muscles with a tooltip.
- **Workout Logging** — Search 300+ exercises, add custom exercises with muscle mappings, log sets/reps/weight/RPE. Rename, edit, and delete workouts.
- **WHOOP Integration** — OAuth2 connection to sync recovery, sleep, and strain data. Composite scores computed from WHOOP data + peer-reviewed research (Plews 2013, Buchheit 2014, Gabbett 2016, Watson 2017).
- **Development Scores** — Composite 0-100 score per muscle: volume trend (35%), estimated 1RM level (35%), training frequency (15%), recency (15%).
- **Population Rankings** — Percentile rankings based on ExRx/Symmetric Strength standards by sex and bodyweight.
- **Body Composition Tracker** — Weight, body fat %, cut/bulk/maintain phases with rate-of-change warnings.
- **Calorie Tracker** — Daily calorie/macro logging with science-backed targets (Mifflin-St Jeor BMR, phase-specific protein per Helms 2014). Cronometer CSV import supported.
- **Workout Recommendations** — Radar chart of muscle balance, lagging/neglected muscle detection, exercise suggestions with level-based rep schemes.
- **Dark Mode** — Full dark theme with light/dark toggle.
- **Imperial/Metric** — Toggle units in settings; stored in metric, converted on display.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts (line, bar, area, radar, pie/donut)
- **Body Diagram**: react-body-highlighter
- **Auth**: NextAuth.js v5 (credentials provider, JWT sessions)
- **Database**: SQLite via Prisma ORM
- **WHOOP**: OAuth2 integration (v2 API)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/LifeMaxx.git
cd LifeMaxx
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# WHOOP OAuth (optional - get credentials at developer.whoop.com)
WHOOP_CLIENT_ID=""
WHOOP_CLIENT_SECRET=""
WHOOP_REDIRECT_URI="http://localhost:3000/api/whoop/callback"
```

Generate a secret:
```bash
openssl rand -base64 32
```

### Database Setup

```bash
npx prisma migrate dev
npx prisma db seed
```

The seed populates 300+ exercises with muscle mappings and strength standards for key compound lifts.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register an account to start tracking.

### WHOOP Setup (Optional)

1. Create a developer app at [developer.whoop.com](https://developer.whoop.com)
2. Set redirect URI to `http://localhost:3000/api/whoop/callback`
3. Add `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET` to `.env`
4. Restart the dev server, then connect from the WHOOP page

## Project Structure

```
src/
  app/
    (auth)/              Login, Register pages
    (dashboard)/         Dashboard, Body Comp, WHOOP, Recommendations, Settings
    api/                 REST API routes
  components/
    body/                BodyDiagram, MuscleDetailPanel
    charts/              WhoopMetrics, WeightTracker, StrengthRadar
    layout/              Sidebar, Navbar
    ui/                  Button, Card, Input, Modal, Select, Badge
    workout/             WorkoutDetailModal, ExerciseSelect, SetRow, CreateExerciseForm
  lib/
    auth.ts              NextAuth config
    prisma.ts            Prisma client singleton
    muscle-groups.ts     Muscle definitions
    scoring.ts           Development score algorithm
    rankings.ts          Population percentile rankings
    nutrition.ts         BMR, TDEE, macro calculations
    units.ts             Imperial/metric conversion
    whoop.ts             WHOOP OAuth + API client
prisma/
  schema.prisma          Database schema
  seed.ts                300+ exercises + strength standards
```

## License

Private - not for redistribution.
