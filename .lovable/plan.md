

# API Integration Plan

## Overview
Replace all mock/hardcoded data with real API calls to your backend at `https://illegal-mining-api.onrender.com`. The app will fetch live data from your FastAPI server for all pages.

## What Changes

### 1. Create an API Service Layer
A new file `src/services/api.ts` will centralize all API calls in one place, making them easy to maintain. This includes functions for:
- Fetching statistics, sites, trends, notifications, monitoring queue, and high-risk areas
- Uploading images for detection
- Marking notifications as read
- Adding areas to monitoring
- Verifying sites and generating reports

### 2. Add React Query Hooks
A new file `src/hooks/useApi.ts` will provide reusable data-fetching hooks using React Query (already installed). This gives you automatic loading states, error handling, caching, and background refetching.

### 3. Update Each Page

**Dashboard (Index.tsx)**
- Fetch stats from `/api/stats` (replaces hardcoded "1,247", "89", etc.)
- Fetch sites from `/api/sites?limit=10` for the map and recent detections list
- Fetch trends from `/api/trends/monthly` for the chart

**Upload Detection (UploadDetection.tsx)**
- Send the image + form data to `POST /api/detect` instead of the fake setTimeout
- Display the real AI analysis results (confidence, severity, reasoning, environmental impact)

**All Sites (AllSites.tsx)**
- Fetch from `/api/sites` with filters (severity, confidence)
- Map the API response fields to the UI

**Statistics (Statistics.tsx)**
- Fetch from `/api/stats` for the 6 stat cards
- Fetch from `/api/trends/monthly` for trend charts
- Keep region/mining-type charts with mock data (API doesn't provide these breakdowns)

**Monitoring (Monitoring.tsx)**
- Fetch queue from `/api/monitoring/queue`
- Submit new areas via `POST /api/monitoring/add-area`

**High Risk Areas (HighRiskAreas.tsx)**
- Fetch from `/api/high-risk-areas`
- Fallback to filtering sites by Critical/High severity if endpoint returns different structure

**Notifications (NotificationsPage.tsx)**
- Fetch from `/api/notifications`
- Mark read via `PATCH /api/notifications/{id}/mark-read`
- Mark all read via `POST /api/notifications/mark-all-read`

### 4. Update Types
Adjust TypeScript interfaces to match the actual API response shapes (e.g., `MiningSite` uses `name` instead of `location_name`, `areaHectares` instead of `area_hectares`).

## Technical Details

### API Base URL
```
https://illegal-mining-api.onrender.com
```

### New Files
- `src/services/api.ts` - All fetch functions
- `src/hooks/useApi.ts` - React Query hooks

### Modified Files
- `src/types/index.ts` - Updated interfaces for API response shapes
- `src/pages/Index.tsx` - Use live stats, sites, trends
- `src/pages/UploadDetection.tsx` - Real POST /api/detect call
- `src/pages/AllSites.tsx` - Live site data
- `src/pages/Statistics.tsx` - Live stats and trends
- `src/pages/Monitoring.tsx` - Live queue + add area
- `src/pages/HighRiskAreas.tsx` - Live high-risk data
- `src/pages/NotificationsPage.tsx` - Live notifications with mark-read actions

### Loading and Error States
Each page will show skeleton/loading indicators while data is being fetched, and error messages if the API is unreachable (since it's on Render's free tier, cold starts may take 30-60 seconds).

### Data kept as mock
- `regionData` and `miningTypeData` in Statistics (no matching API endpoint)
- `severityDistribution` in Dashboard (can be computed from live sites data)
- Monthly trends chart breakdowns by severity (API returns `detected` + `loss` per month, not severity breakdown)

