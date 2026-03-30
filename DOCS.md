# SenseMap — Platform Documentation

> Last updated: March 30, 2026

---

## What is SenseMap?

SenseMap helps autistic and sensory-sensitive individuals find comfortable public spaces. Users can explore an interactive map, view community sensory ratings (noise, lighting, crowd), submit reviews, check in to locations, and receive AI-powered insights tailored to their personal sensory profile.

---

## Monorepo Structure

```
AutisticAI/
├── frontend/          # React 19 + Vite (port 5173)
├── backend/           # Express 5 + Prisma + PostgreSQL (port 3000)
├── package.json       # Root scripts (runs both servers)
└── DOCS.md            # This file
```

---

## Running the App

From the `AutisticAI/` root:

```bash
npm run dev:servers    # Start frontend + backend together
npm run dev:all        # OSM import first, then both servers
npm run osm-import     # Seed DB from OpenStreetMap (Toronto)
```

Frontend only:
```bash
cd frontend && npm run dev
```

Backend only:
```bash
cd backend && npm run dev
```

---

## Environment Variables

### Frontend (`frontend/.env`)
| Variable | Purpose |
|---|---|
| `VITE_MAPBOX_TOKEN` | Mapbox GL map tiles |
| `VITE_AUTH0_CLIENT_ID` | Auth0 app client ID |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience |
| `VITE_API_URL` | Backend base URL (http://localhost:3000) |

### Backend (`backend/.env`)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `GOOGLE_PLACES_KEY` | Google Places API key |
| `AUTH0_AUDIENCE` | JWT audience validation |
| `AUTH0_ISSUER_BASE_URL` | JWT issuer validation |
| `GEMINI_API_KEY` | Google Generative AI (Gemini 2.5-flash) |
| `CLOUDINARY_CLOUD_NAME` | Image hosting |
| `CLOUDINARY_API_KEY` | Image hosting |
| `CLOUDINARY_API_SECRET` | Image hosting |
| `PORT` | Server port (default 3000) |

---

## Database Models (Prisma + Supabase)

### User
| Field | Type | Notes |
|---|---|---|
| id | String | UUID, primary key |
| auth0Id | String | Unique, from Auth0 |
| email | String | Unique |
| username | String? | Optional display name |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Relations: savedPlaces, reviews, checkIns, sensoryProfile

---

### Location
| Field | Type | Notes |
|---|---|---|
| id | String | UUID |
| googlePlaceId | String | Unique, from Google Places |
| name | String | |
| description | String? | |
| category | String | library, cafe, park, museum, etc. |
| address | String? | |
| imageUrl | String? | Cloudinary URL |
| latitude | Float | |
| longitude | Float | |

Relations: reviews, checkIns, sensoryScores, savedBy

---

### Review
| Field | Type | Notes |
|---|---|---|
| id | String | UUID |
| userId | String | FK → User |
| locationId | String | FK → Location |
| bodyText | String | Written review |
| rating | Int | 1–10 overall comfort |
| noiseLevel | Int | 1–10 (1 = quiet) |
| lightingLevel | Int | 1–10 (1 = dim) |
| crowdLevel | Int | 1–10 (1 = empty) |
| visitedAt | DateTime | |
| visitTime | String? | morning, afternoon, evening |
| imageUrl | String? | Optional photo |
| aiNoiseScore | Float? | Gemini extracted |
| aiLightingScore | Float? | Gemini extracted |
| aiCrowdScore | Float? | Gemini extracted |
| aiSentiment | String? | positive / neutral / negative |
| aiTags | String[] | e.g. ["quiet", "good lighting"] |

---

### SensoryScore
Aggregated per location. Updated on every new review via `recalculateScores()`.

| Field | Type | Notes |
|---|---|---|
| locationId | String | Unique FK → Location |
| noiseScore | Float | Average noise (1–10) |
| lightingScore | Float | Average lighting (1–10) |
| crowdScore | Float | Average crowd (1–10) |
| comfortScore | Float | Average rating (1–10) |
| reviewCount | Int | Total reviews |

---

### SensoryProfile
Per-user tolerance settings for personalisation.

| Field | Type | Notes |
|---|---|---|
| userId | String | Unique FK → User |
| noiseTolerance | Int | 1–5 (how much noise is OK) |
| lightingTolerance | Int | 1–5 |
| crowdTolerance | Int | 1–5 |
| notes | String? | Free text |

---

### SavedPlace
Bookmarked locations. Unique constraint on `[userId, locationId]`.

### CheckIn
Visit tracking. 1-hour cooldown enforced per user+location on the backend.

---

## Backend Architecture

### Request Lifecycle

```
Request
  └── app.js (CORS, JSON parsing)
       └── middleware/auth.js        → validate Auth0 JWT
            └── middleware/syncUser.js → upsert User in DB
                 └── route handler
                      └── lib/scores.js (recalculate on review create)
```

### Middleware

| File | Export | Purpose |
|---|---|---|
| `middleware/auth.js` | `requireAuth` | Validates Auth0 Bearer token, attaches `req.auth` |
| `middleware/optionalAuth.js` | `optionalAuth` | Like requireAuth but never blocks (public routes) |
| `middleware/syncUser.js` | `syncUser` | Auto-creates/updates User in Prisma after auth |

---

## API Endpoints

### Locations (`/locations`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/locations` | No | All locations as GeoJSON |
| GET | `/locations/heatmap` | No | Top 500 locations with sensory scores (Deck.gl) |
| GET | `/locations/match` | Required | Personalized matches sorted by match score |
| GET | `/locations/search?q=` | No | Search by name/category/address |
| GET | `/locations/:id` | No | Single location + last 10 reviews |

### Reviews (`/reviews`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reviews/:locationId` | No | All reviews for a location |
| POST | `/reviews` | Required | Submit review; triggers score recalculation |

### AI (`/ai`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai/analyze` | No | Extract sensory scores from review text (Gemini) |
| POST | `/ai/insights/:locationId` | Required | Full AI summary of a location's sensory profile |

### Rankings (`/rankings`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/rankings` | No | All locations sorted by comfortScore (desc) |

### Discovery (`/discover`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/discover?q=&lat=&lng=` | No | DB + Google Places hybrid search; caches new results |

### Profiles (`/profiles`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profiles/me` | Required | Get user's sensory profile |
| PUT | `/profiles/me` | Required | Create/update sensory profile |

### Saved Places (`/saved-places`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/saved-places` | Required | User's saved locations |
| POST | `/saved-places` | Required | Save a location |
| DELETE | `/saved-places/:locationId` | Required | Remove a saved location |

### Check-ins (`/checkins`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/checkins/:locationId` | Required | Check in (1-hour cooldown per location) |
| GET | `/checkins/recent` | Required | Last 10 user check-ins |

### Upload (`/upload`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/upload` | Required | Upload image to Cloudinary; returns `{ imageUrl }` |

---

## Library Files (`backend/src/lib/`)

### `prisma.js`
Singleton Prisma client using `@prisma/adapter-pg` (pg driver for Supabase).

### `gemini.js`
Initializes `@google/generative-ai` with `gemini-2.5-flash`. Exported as `model`.

### `scores.js` — `recalculateScores(locationId)`
- Fetches all reviews for a location
- Averages noise, lighting, crowd, and rating
- Upserts the `SensoryScore` record
- **Must be called after every review create/update**

### `placesService.js`
Handles all Google Places integration + AI enrichment:

| Function | Purpose |
|---|---|
| `classifyCategory(types)` | Maps Google Place types → app categories |
| `searchGooglePlaces(query, lat, lng)` | Google Places Text Search |
| `getGooglePlaceDetails(placeId)` | Full place details inc. photos + reviews |
| `uploadPlacePhoto(photoReference)` | Uploads Google photo → Cloudinary |
| `analyzeWithGemini(name, category, reviews)` | Gemini analysis of reviews → sensory scores + seed reviews |
| `discoverAndCachePlace(googlePlace)` | Full enrichment pipeline (create location + photo + AI reviews) |
| `getSystemUser()` | Internal bot user for seeding reviews |

### `cloudinary.js`
Initializes Cloudinary SDK with API credentials.

### `geojson.js` — `toGeoJSON(locations)`
Converts Location array to GeoJSON FeatureCollection with sensory scores as properties.

---

## Frontend Architecture

### Entry Points

**`main.jsx`**
- Wraps app in `Auth0Provider`, `ThemeProvider`, `BrowserRouter`
- Renders `App.jsx`

**`App.jsx`**
- Controls top-level navigation: `LaunchScreen` → `NonLoginMapView` → `LoggedInMapView`
- Manages `showMap` state and `exploreParams` (initial search query + filter)
- Sets Auth0 token getter on the Axios interceptor

### `services/api.js`
Single Axios instance for all API calls:
- Base URL from `VITE_API_URL`
- Default timeout: 10s (heatmap: 60s, rankings: 30s)
- Request interceptor: attaches Auth0 JWT (skips public routes)

All exported functions:
```
getLocations()           getLocationById(id)
getLocationHeatmap()     getLocationMatch()
searchLocations(q)       discoverLocations(q, lat, lng)
submitReview(data)       getReviewsByLocation(id)
getRankings()
getSensoryProfile()      updateSensoryProfile(data)
getAIInsights(id)        analyzeReview(text)
getSavedPlaces()         savePlace(id)        removeSavedPlace(id)
uploadImage(formData)
checkIn(locationId)
```

---

## Frontend Components

### `LaunchScreen.jsx`
Landing page. Hero text, category cards, search bar, auth buttons, theme switcher.

### `NonLoginMapView.jsx`
Full public map experience (no login required).
- Fetches heatmap + rankings on mount
- Sidebar: quick filters, top ranked places, search
- Location detail panel: snapshot stats, sign-in prompt for reviews

### `LoggedInMapView.jsx`
Authenticated map with all features.
- Nav tabs: Explore, Dashboard, Saved Places, Sensory Profile, Settings
- Fetches: match scores, AI insights, saved places, user profile
- Check-in flow: 1-hour cooldown → button shows "Checked in" for 3s then resets

### `MapView.jsx`
Pure Mapbox GL + Deck.gl map component.
- `ScatterplotLayer` — location pins (green → yellow → red by comfort score)
- `HeatmapLayer` — sensory overlay
- Props: `onLocationSelect`, `filter`, `searchResultsGeoJSON`, `heatmapEnabled`, `heatmapData`, `flyToLocation`

### `LocationDetail.jsx`
Location modal. Shows comfort score, sensory labels, AI insights, community reviews, noise-through-day chart.

### `SubmitReview.jsx`
Review form:
1. Rating + sliders (noise/lighting/crowd 1–10)
2. Text body + photo upload (Cloudinary)
3. Visit time selector
4. AI auto-fill button — sends text to Gemini, fills sliders automatically

### `SensoryProfile.jsx`
6 sliders: Noise, Lighting, Crowd (saved to backend, 1–5), + Olfactory, Spatial Openness, Acoustic Echo (UI only).
Auto-saves after 600ms debounce.

### `Dashboard.jsx`
Welcome view with: env stats, best nearby match, profile preview, saved places list, search.

### `SavedPlaces.jsx`
Grid of bookmarked locations. Sort by: match score, distance, noise, crowd, name.

### `Rankings.jsx`
Sortable rankings modal. Sort by: comfort score, quietest, least crowded.

### `Settings.jsx`
Account info, notification toggles, accessibility options, theme switcher.

---

## Key Data Flows

### 1. Location Discovery
```
User searches
  → GET /discover?q=&lat=&lng=
  → DB search + Google Places (parallel, 12s timeout)
  → New Google results quick-cached as Location
  → Background: photo → Cloudinary, reviews → Gemini → seed reviews
  → Returns combined GeoJSON
```

### 2. Review Submission
```
User fills form
  → (Optional) AI auto-fill: POST /ai/analyze → Gemini → scores fill sliders
  → Photo: POST /upload → Cloudinary → imageUrl
  → POST /reviews
  → recalculateScores() re-aggregates SensoryScore
```

### 3. Check-in Flow
```
User taps "I'm here"
  → POST /checkins/:locationId
  → Backend: 1-hour cooldown check (429 + minutesLeft if on cooldown)
  → Success: button changes to "Checked in" for 3 seconds then resets
  → No GPS verification — any logged-in user can check in to any location
```

### 4. Personalised Matching
```
User sets sensory profile (noise/lighting/crowd tolerance 1–5)
  → GET /locations/match
  → Backend compares location scores vs user tolerances
  → Match % = 100 - |score - tolerance| * 20
  → Returns sorted by match score
```

### 5. AI Insights
```
Frontend: POST /ai/insights/:locationId
  → Backend fetches all reviews for location
  → Filters out blank bodyText
  → Gemini 2.5-flash analyzes text
  → Returns: noise summary, lighting summary, best time, tags, confidence %
  → Frontend displays in LocationDetail modal
```

---

## Sensory Score Scale

| Score | Meaning |
|---|---|
| 1–3 | Low stimulation (quiet, dim, empty) |
| 4–6 | Moderate |
| 7–10 | High stimulation (loud, bright, busy) |

**Lower score = more sensory-friendly.**

---

## Themes

Two visual themes stored in `localStorage`:

| Theme | Colors |
|---|---|
| `nature` | Green + beige tones |
| `calm` | Blue + teal tones |

Applied via `data-theme` attribute on `<html>` + CSS variables.

---

## UX Design Principles

- **Soft colors, minimal animation** — no jarring transitions
- **Generous spacing** — avoid dense layouts
- **`useReducedMotion`** — respects OS-level accessibility settings
- **Graceful degradation** — fallback data if APIs timeout
- **Debounced saves** — sliders auto-save after 600ms, no save button needed
- **Optional auth** — public routes work without login; protected features prompt sign-in

---

## Debug / Test Scripts (run from `backend/`)

```bash
node test_db.js        # Test Prisma DB connection
node test_pg.js        # Test raw PostgreSQL connection
node verify_data.js    # Verify data integrity
node test_api.js       # Test API endpoints
node debug_places.js   # Debug Google Places enrichment
```

---

## Known Issues / TODOs

- Match score formula assumes same scale for location scores (1–10) and user tolerances (1–5) — needs normalisation
- New users get 404 on `/profiles/me` — should auto-create default profile
- AI insights show 0% confidence if all reviews have empty `bodyText`
- Rankings endpoint may return empty if no `SensoryScore` records exist yet
