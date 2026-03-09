# GigShield - Parametric Insurance for Delivery Workers

## Overview
GigShield is an AI-powered parametric insurance platform designed for delivery workers (Swiggy, Zomato, Amazon, etc.). It automatically triggers insurance claims based on real-time weather conditions, eliminating the need for manual claim filing.

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui
- **State Management**: React Query v5
- **Routing**: Wouter
- **Data Validation**: Zod

### Key Features Implemented

#### 1. Worker Registration & Management
- Simple registration form with name, phone, platform, city, and GPS location
- Worker profile persistence in PostgreSQL
- Files: `client/src/pages/worker-register.tsx`

#### 2. Insurance Plans
- Three tiered plans: Basic Shield, Pro Shield, Max Shield
- Dynamic premium calculation based on coverage amount
- Weekly subscription model
- Files: `client/src/pages/worker-plans.tsx`

#### 3. Weather Integration & Auto-Claim Trigger
- Real-time weather API endpoint: `GET /api/weather/:city`
- Mock weather data for demo (cities: Mumbai, Bangalore, Delhi, Kolkata, Pune)
- **Automatic claim triggering**: When rainfall exceeds 50mm threshold, claims are auto-created for all active workers in that city
- No manual claim filing needed - fully parametric
- Files: `server/routes.ts` (weather endpoint + mock data)

#### 4. Claim Management
- **Claim History Page**: Detailed view of all claims with status tracking
- Status workflow: Pending → Approved → Paid
- Shows compensation amounts and dates
- Summary statistics on the history page
- Files: `client/src/pages/claim-history.tsx`

#### 5. Enhanced Dashboard
- **Modern Card Layout**: Gradient backgrounds, clear typography, professional styling
- **Weather Risk Alerts**: Real-time rainfall monitoring with visual indicators
  - Risk level badges (Low/Medium/High/Extreme)
  - Progress bar showing rainfall percentage
  - Auto-alert when rainfall exceeds safe threshold
- **Claims Summary**: Quick stats showing total claims, paid amount, processing count
- **Direct Link to Claim History**: One-click access from dashboard
- Files: `client/src/pages/worker-dashboard.tsx`

#### 6. Payout Simulation
- "Simulate Severe Weather" button triggers complete flow:
  1. Creates disruption event
  2. Auto-triggers claim creation
  3. Simulates payout with confetti celebration
- Displays claim approval and payout processing messages
- Files: `client/src/pages/worker-dashboard.tsx`

#### 7. Admin Dashboard
- Real-time statistics:
  - Total workers registered
  - Disruptions detected
  - Claims processed
  - Total payouts distributed
- Files: `client/src/pages/admin-dashboard.tsx`

## Database Schema

### Tables
- **workers**: Delivery worker registrations with location
- **plans**: Insurance plan definitions (Premium, Coverage)
- **worker_plans**: Active subscriptions linking workers to plans
- **claims**: Insurance claims with status tracking
- **disruptions**: Weather disruption events by city

## API Routes

### Worker Management
- `GET /api/workers` - List all workers
- `GET /api/workers/:id` - Get worker details
- `POST /api/workers` - Register new worker

### Plans
- `GET /api/plans` - List all insurance plans

### Worker Plans
- `GET /api/workers/:workerId/plan` - Get active plan for worker
- `POST /api/worker-plans` - Subscribe to a plan

### Claims
- `GET /api/workers/:workerId/claims` - Get claims history
- `POST /api/claims` - File a claim
- `POST /api/claims/:id/simulate` - Simulate payout

### Weather (NEW)
- `GET /api/weather/:city` - Get weather data and check rainfall threshold
  - Auto-triggers claims if rainfall > 50mm

### Disruptions
- `GET /api/disruptions/:city` - Get active disruptions
- `POST /api/disruptions/trigger` - Create disruption event (cascades to auto-claim)

### Admin
- `GET /api/admin/stats` - Get dashboard statistics

## Key Implementation Details

### Weather Auto-Trigger Logic
The weather endpoint (`GET /api/weather/:city`) includes intelligent automation:
1. Fetches or generates weather data for the city
2. Checks if rainfall exceeds 50mm threshold
3. If threshold exceeded:
   - Finds all active workers in that city
   - Checks if they have active insurance plans
   - Auto-creates claims with status "approved"
   - Prevents duplicate claims within 1 hour window
4. Returns weather data with risk level assessment

### Mock Weather Patterns
```
Mumbai: 45mm (medium risk)
Bangalore: 25mm (low risk)
Delhi: 60mm (high risk)
Kolkata: 75mm (extreme risk)
Pune: 35mm (low risk)
```

### UI Improvements
- **Weather Risk Card**: Color-coded risk levels with visual progress bar
- **Claim History Page**: Professional layout with status indicators, amounts, dates
- **Navigation**: Quick access links between Dashboard and Claims History
- **Responsive Design**: Mobile-friendly card layouts and spacing
- **Modern Styling**: Gradient backgrounds, smooth transitions, semantic colors

## Frontend Navigation

### Worker Flow
1. Landing page (`/`) - Choose worker or admin
2. Register (`/register`) - Enter worker details
3. Select Plan (`/plans`) - Choose insurance coverage
4. Dashboard (`/dashboard`) - View active plan, weather alerts, claims summary
5. Claim History (`/claims`) - Detailed claim tracking

### Admin Flow
1. Landing page (`/`) - Choose worker or admin
2. Admin Dashboard (`/admin`) - Real-time stats and disruption triggers

## Running the App

```bash
# Start dev server
npm run dev

# Database migration
npm run db:push
```

## Design Philosophy
- **Parametric Insurance**: Automated claims based on weather conditions, not traditional documentation
- **User-Centric**: Simple registration and one-click simulation demo
- **Real-Time**: Live weather monitoring and instant claim processing
- **Modern UI**: Professional, responsive design for delivery workers on mobile

## Future Enhancements
- Real OpenWeather API integration (currently mocked)
- SMS notifications for claim triggers
- Multiple disruption types (flood, pollution, heatwave)
- Claim appeal process
- Worker earnings tracking
- Integration with payment gateways for payouts
