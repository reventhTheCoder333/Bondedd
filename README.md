# Bondedd

> Campus life, all in one place.

Bondedd is a campus event discovery platform built for university students. Events at most schools are scattered across Instagram stories, physical flyers, GroupMe chats, email newsletters, and university portals — students miss things constantly not because they don't care, but because there's no single place to look. Bondedd fixes that.

Currently in development. Launching at UTD — Fall 2026.

---

## The problem

A student at UTD who wants to know what's happening this weekend has to check:
- Instagram (multiple org accounts)
- UTD's official events portal
- Their department's email list
- GroupMe or Discord servers they may or may not be in
- Physical bulletin boards they walked past

Most don't bother. Organizations with real events get poor turnout. Students feel like nothing is happening. Neither is true — the information is just fragmented.

---

## What Bondedd does

- **Discover** — personalized feed of today's events, trending events, and recommended events based on your interests
- **Explore** — interactive Mapbox map of campus with geo-filtered event browsing
- **Search** — unified full-text search across events, organizations, and campus places
- **Follow** — follow organizations to get notified when they post events
- **RSVP & bookmark** — track what you're interested in, going to, or want to save
- **Submit** — any student can submit an event through a moderated workflow (draft → review → published)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, CSS custom properties (token-based design system) |
| Animation | Framer Motion — per-route-group transition variants |
| Backend | Supabase (PostgreSQL + Auth + Row Level Security + Storage) |
| Database | PostgreSQL with PostGIS extension for geography types |
| Maps | Mapbox GL JS |
| Auth | Supabase Auth with `handle_new_user` trigger → auto-profile creation |

No separate backend server. All business logic lives in PostgreSQL functions and Supabase client calls.

---

## Architecture

### Database schema

12 core tables handling the full product surface:

```
campuses            — multi-campus support (UTD seeded)
profiles            — user profiles linked to auth.users; campus-verified
organizations       — campus orgs with owner/admin/member roles
events              — published events with geo, category, org linkage
event_submissions   — draft → submitted → reviewed → published workflow
event_bookmarks     — user saves
event_rsvps         — interested / going / went with visibility control
event_metrics       — denormalized trending scores (computed on write via trigger)
event_recommendations — bucketed feeds: today / trending / recommended / upcoming
campus_places       — named campus locations as PostGIS geography points
follows             — user → user follow graph with pending/accepted/blocked states
notifications       — in-app notifications for follows, invites, shares
```

### Key SQL functions

- `get_explore_events` — geo-filtered event query with bounding box, category, org, date, and full-text filters; returns per-user bookmark and RSVP state in a single call
- `search_bondedd` — unified search across events, organizations, and campus places
- `get_organizations_directory` — org list with follower/member/event counts and `is_following` flag per user
- `refresh_event_metrics` — trigger-based trending score recomputation after bookmark or RSVP changes

### Geo layer

Campus places and events are stored as PostGIS `geography` types. The explore map uses a bounding-box query via `get_explore_events` — all geo filtering runs in SQL, no app-layer coordinate math needed.

### Event metrics & trending

Trending score is computed on write rather than at query time:

```
trending_score = (bookmarks × 1.5) + (going × 2.0) + (interested × 0.75)
```

Stored in `event_metrics` and updated by trigger after any bookmark or RSVP change. Keeps the explore feed fast at scale.

### Design system

Bondedd uses a warm paper aesthetic — cream and gold, not cold white and blue. Built on a token layer so the entire visual language can shift without touching component code.

| Token | Value |
|---|---|
| Display font | Cormorant Garamond |
| Body font | Inter |
| Brand accent | Gold (`--theme-accent`) |
| Surfaces | Frosted glass with backdrop blur |
| Motion | Framer Motion variants per route group |

Route groups each have distinct motion: marketing fades up, auth scales in, map fades, app slides in from the right.

---

## Routes

```
/                   Landing page
/auth               Sign in / sign up
/onboarding         Interests, campus prefs, profile setup
/home               Personalized feed (today / trending / recommended)
/explore            Map + event list with geo filters
/search             Full-text search: events, orgs, places
/organizations      Org directory with follow counts and filters
/organizations/:slug  Org profile, events, member list
/events/:id         Event detail, RSVP, bookmark
/notifications      Follow requests, invites, shares
/create             Create event or suggest a place
/create/event       Full event submission form
/profile            User profile, interests, saved events
```

---

## Key technical decisions

**Supabase over a custom backend** — Auth, RLS, real-time, and storage handled out of the box. Accepted tradeoff: vendor lock-in and limited custom server logic. Right move for a solo-built MVP.

**PostGIS in Supabase** — geography types let geo queries run entirely in SQL. The bounding-box filter on the explore map is a single function call with no app-layer coordinate processing.

**Two-table event flow** (`event_submissions` → `events`) — separates draft/review state from live published state. Allows moderation before anything goes public without complicating the events table itself.

**Denormalized metrics** — trending scores computed on write via trigger rather than aggregated at query time. Adds a small write cost, eliminates a large read cost at scale.

**Token-based design system** — single CSS variable layer + Tailwind config extensions. Design changes propagate from one file.

---

## Status

| Area | State |
|---|---|
| Frontend (all routes) | Complete |
| Auth + onboarding | Complete |
| Explore map | Complete |
| Event submission workflow | Complete |
| Design system | Complete |
| Recommendation engine | Schema exists, logic in progress |
| Deployment | Pending — launching Fall 2026 |
| Multi-campus support | Planned post-launch |
| Mobile app | Planned |

Development paused May 2026. Resuming June 2026 for launch at UTD in Fall 2026.

---

## Local development

```bash
git clone https://github.com/raghavsaravanan/Bondedd-MVP
cd Bondedd-MVP/frontend
npm install
npm run dev
```

Requires a Supabase project with the schema applied and a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_MAPBOX_TOKEN=your_mapbox_token
```
