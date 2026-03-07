# SensorySafe Map

A **map-based platform designed to help autistic and sensory-sensitive individuals find comfortable environments** before visiting public spaces such as cafés, malls, libraries, and restaurants.

The platform aggregates **community ratings, AI-extracted sensory signals from reviews, and personalized user profiles** to recommend locations that minimize sensory overload.

---

# Problem

Many environments can be overwhelming for sensory-sensitive individuals due to:

* Loud noise
* Bright or flickering lighting
* Crowded spaces
* Strong smells
* Sudden announcements or unpredictable stimuli

Currently, there is **no dedicated platform that evaluates places specifically through a sensory lens**.

---

# Solution

SensorySafe Map allows users to:

* Discover places rated by **sensory comfort**
* Filter locations based on **noise, lighting, and crowd density**
* Use **AI to extract sensory insights from reviews**
* Build **personal tolerance profiles** for automatic recommendations
* View **rankings of the most and least sensory-friendly places**

---

# Core Features

## 1. Interactive Sensory Map

Users can explore locations on a map with sensory ratings.

Each location displays:

* Noise level
* Lighting level
* Crowd density
* Trigger warnings
* Community tips

Example tags:

```
Noise: Quiet / Moderate / Loud
Lighting: Dim / Natural / Bright
Crowds: Sparse / Busy / Packed
Triggers: strong smells, dogs, echo, announcements
```

---

# 2. Sensory Ranking System

Locations are ranked based on **community feedback and AI signals**.

## Best Places Ranking

Sorted by highest sensory comfort score.

Example:

1. Quiet Library Cafe — Score: 9.2
2. Riverside Park — Score: 8.8
3. Maple Study Lounge — Score: 8.5

## Worst Places Ranking

Locations with frequent sensory triggers.

Example:

1. Downtown Food Court — Loud + crowded
2. Nightclub District Cafe — Music + flashing lights
3. Mall Atrium — Echo + large crowds

Users can sort by:

* Quietest places
* Least crowded
* Dim lighting
* Overall sensory comfort

---

# 3. AI Review Parsing

Users can paste reviews or import allowed public reviews.

AI extracts **sensory signals** automatically.

Example input:

> "This cafe is quiet in the morning but gets loud after 5pm. Bright lights and tight seating."

AI Output:

```
Noise: Quiet mornings, loud evenings
Lighting: Bright
Crowds: Busy after 5pm
Triggers: tight seating
Tip: Visit before noon
```

Extracted signals include:

* Noise source (music, traffic, espresso machines)
* Lighting type
* Crowd patterns
* Sensory triggers
* Coping suggestions

---

# 4. Personal Sensory Profile

Users create a **sensory tolerance profile**.

Example settings:

```
Noise tolerance: 3/10
Lighting tolerance: 6/10
Crowd tolerance: 4/10
Smell sensitivity: High
```

The system automatically filters and recommends locations based on this profile.

Example:

```
Recommended for you:
- Quiet Library Cafe
- Botanical Garden
- Small Neighborhood Bookstore
```

---

# UI Components

| Component          | Description                          |
| ------------------ | ------------------------------------ |
| Map View           | Interactive map displaying locations |
| Location Cards     | Quick overview of sensory ratings    |
| Rating Sliders     | Users rate noise, lighting, crowds   |
| Review Input Box   | Paste or write reviews               |
| AI Summary Panel   | Displays extracted sensory signals   |
| Ranking Lists      | Best and worst locations             |
| User Profile Panel | Personal sensory tolerance settings  |
| Filters            | Sort locations by sensory attributes |

---

# UI Screens

## 1. Home Screen

Features:

* Search bar
* Map preview
* Top ranked sensory-friendly places
* Quick filters

---

## 2. Map Explorer

Displays:

* All sensory-rated locations
* Map pins with comfort scores
* Filter sidebar

Filters:

* Noise level
* Lighting level
* Crowd density
* Trigger warnings

---

## 3. Location Detail Page

Shows:

* Sensory rating breakdown
* AI extracted insights
* Community reviews
* Coping tips
* Best visiting times

---

## 4. Submit Review Screen

Users can:

* Rate sensory factors
* Add notes
* Paste review text for AI analysis

Example rating:

```
Noise: 2/10
Lighting: 7/10
Crowds: 4/10
Triggers: strong coffee smell
```

---

## 5. Sensory Rankings Page

Displays:

### Best Sensory-Friendly Locations

Sorted by highest comfort score.

### Most Overwhelming Locations

Places frequently flagged for sensory triggers.

---

## 6. User Profile Page

Users configure:

* Noise tolerance
* Lighting tolerance
* Crowd tolerance
* Sensory triggers

The system uses this profile for **personalized filtering**.

---

# UX Flow

## 1. First Time User

```
Landing Page
→ Create Sensory Profile
→ Explore Map
→ View Recommended Locations
```

---

## 2. Searching for a Place

```
Open Map
→ Apply Filters
→ Select Location
→ View Sensory Breakdown
```

---

## 3. Adding a Review

```
Open Location Page
→ Submit Review
→ AI Parses Sensory Signals
→ Review Added to Community Data
```

---

# Future Enhancements

Possible extensions:

* Real-time noise estimation
* Live crowd predictions
* Accessibility data integration
* Machine learning comfort scoring
* Community moderation
* Sensory-friendly certification badges

---

# Potential Tech Stack

Frontend

* React
* TypeScript
* Mapbox / Google Maps API

Backend

* Node.js
* Express

Database

* MongoDB / Firebase

AI Layer

* NLP review parsing
* Sentiment + sensory signal extraction

Cloud

* Google Cloud / AWS

---

# Impact

SensorySafe Map helps:

* autistic individuals
* sensory-sensitive people
* families with neurodivergent children
* people with anxiety or PTSD

navigate the world **with greater comfort and confidence**.
