## Supabase setup

Use the Supabase SQL editor for the initial setup unless you also have the actual database password for:

`postgresql://postgres:[YOUR-PASSWORD]@db.gydjbbcqakaufdoehkqc.supabase.co:5432/postgres`

Steps:

1. Open the SQL editor in the Supabase project `gydjbbcqakaufdoehkqc`.
2. Run `frontend/supabase/schema.sql`.
3. Run `frontend/supabase/seed_test_events.sql` to load ten published UT Dallas test events for Home, Explore, and Event Detail.
4. Confirm the seed tables contain UT Dallas, event categories, interests, and the test event set.
5. Keep email confirmation enabled in Supabase Auth for student signup.

## What the schema covers

- Auth and onboarding:
  - `campuses`, `campus_domains`, `profiles`, `interests`, `profile_interests`, `profile_place_preferences`
- Explore and organizations:
  - `event_categories`, `organizations`, `organization_memberships`, `organization_follows`, `campus_places`
- Content creation workflow:
  - `event_submissions` for drafts, suggestions, and club submissions
  - `events` for approved or published events
- Saved and planning:
  - `event_bookmarks`, `event_reminders`, `event_rsvps`
- Home ranking:
  - `event_recommendations` for personalized buckets
  - `event_metrics` for bookmark and RSVP-derived trending scores
- Profile media:
  - public `avatars` storage bucket for profile photos
- Map and geospatial queries:
  - PostGIS-backed `campus_places`
  - geospatial event fields on `event_submissions` and `events`
  - RPCs: `get_campus_places_geojson`, `search_campus_places`, `get_explore_events`, `get_event_detail`, `get_organizations_directory`, `get_organization_profile`, `get_organization_events`, `search_bondedd`

## Product workflow

1. A student signs up with a UT Dallas email.
2. The auth trigger creates or updates `profiles`.
3. A user creates an organization or submits an event suggestion through `event_submissions`.
4. Event locations should resolve in this order:
   - canonical `campus_places` selection
   - manual map pin
   - manual text for later admin review
5. Approved submissions are published into `events` by an admin workflow or server-side job.
6. Explore queries `get_explore_events(...)` for viewport-based map results and `get_campus_places_geojson(...)` for UTD overlays.
7. Create can use `search_campus_places(...)` for place search.
8. Explore event cards can open `/events/:eventId`, backed by `get_event_detail(...)`.
9. Organizations can open `/organizations/:slug`, backed by `get_organization_profile(...)` and `get_organization_events(...)`.
10. Global search can open `/search?q=...`, backed by `search_bondedd(...)`.
11. Saved queries `event_bookmarks`, `event_reminders`, and upcoming RSVP data.
12. Home can be assembled from:
  - `today`: published events happening today
  - `trending`: published events ordered by `event_metrics.trending_score`
  - `recommended`: rows in `event_recommendations`
  - `upcoming`: next published events ordered by `starts_at`
13. Profile reads `profiles`, `profile_interests`, `organization_follows`, saved data, and the `avatars` bucket.
14. Onboarding writes:
   - selected interests to `profile_interests`
   - frequent campus places to `profile_place_preferences`
   - campus card data to `profiles`

## Important note

This schema sets up the full product data model, but it does not itself moderate submissions or generate
recommendations. Those workflows should run from an admin tool, Edge Functions, or another trusted backend
process using the service role.
