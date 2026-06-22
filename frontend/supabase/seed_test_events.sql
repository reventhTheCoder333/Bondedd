-- Seed ten UT Dallas pilot events for Bondedd test flows.
-- Run this after frontend/supabase/schema.sql in the Supabase SQL editor.

alter table public.organizations add column if not exists description text;
alter table public.organizations add column if not exists instagram_handle text;
alter table public.organizations add column if not exists is_verified boolean not null default false;

alter table public.events add column if not exists place_id uuid references public.campus_places(id) on delete set null;
alter table public.events add column if not exists location_point extensions.geography(point, 4326);
alter table public.events add column if not exists location_source text not null default 'manual_text';
alter table public.events add column if not exists location_confidence numeric(4, 3) not null default 0.5;
alter table public.events add column if not exists visibility text not null default 'campus_only';
alter table public.events add column if not exists source_type text not null default 'imported';
alter table public.events add column if not exists featured_rank integer;

insert into public.organizations (
  id,
  campus_id,
  name,
  slug,
  description,
  instagram_handle,
  is_verified
)
select
  seeded.id::uuid,
  campus.id,
  seeded.name,
  seeded.slug,
  seeded.description,
  seeded.instagram_handle,
  true
from public.campuses campus
join (
  values
    ('0f0206f0-4465-4d84-9d5b-bfe75f1ef111', 'ut-dallas', 'Comet Sports Network', 'comet-sports-network', 'Pickup runs, rec nights, and active campus meetups.', '@cometsports'),
    ('90f36361-d700-41c9-91f2-46d9d43df112', 'ut-dallas', 'Venture Mavericks', 'venture-mavericks', 'Founder circles, startup mixers, and builder sessions at UTD.', '@venturemavericks'),
    ('e2cabf25-0a2f-43fc-8c7e-0a97bc51c113', 'ut-dallas', 'SoundStage UTD', 'soundstage-utd', 'Live performances, student showcases, and late-night creative energy.', '@soundstageutd'),
    ('afc8f955-1520-48e2-a2da-dd70c5ff4114', 'ut-dallas', 'JSOM Career Lab', 'jsom-career-lab', 'Career workshops and recruiter-facing prep for ambitious students.', '@jsomcareerlab'),
    ('f8d57bd7-3317-4bd7-8e9f-80eac1b6d115', 'ut-dallas', 'Pre-Med Collective', 'pre-med-collective', 'Academic support and peer-led health career programming.', '@utdpremed'),
    ('16a9f2c7-d7f0-4a8f-aa50-0cc57b824116', 'ut-dallas', 'Union Programming Board', 'union-programming-board', 'Campus-wide social programming and large-scale student gatherings.', '@utdsunion'),
    ('55c7c9a4-c38f-4ebc-9182-90e3b6b38117', 'ut-dallas', 'Comet Wellness House', 'comet-wellness-house', 'Wellness, reset sessions, and routines that make campus life feel sustainable.', '@cometwellness'),
    ('ac3658d7-1680-43ab-864f-b6af5d2b0118', 'ut-dallas', 'Global Comets', 'global-comets', 'Cross-cultural events, community dinners, and meet-new-people nights.', '@globalcomets')
) as seeded(id, campus_slug, name, slug, description, instagram_handle)
  on campus.slug = seeded.campus_slug
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  instagram_handle = excluded.instagram_handle,
  is_verified = excluded.is_verified;

insert into public.events (
  id,
  campus_id,
  organization_id,
  category_id,
  slug,
  title,
  summary,
  description,
  location_name,
  location_details,
  place_id,
  location_point,
  location_source,
  location_confidence,
  starts_at,
  ends_at,
  timezone,
  cover_image_url,
  status,
  visibility,
  source_type,
  featured_rank
)
select
  seeded.id::uuid,
  campus.id,
  organization.id,
  category.id,
  seeded.slug,
  seeded.title,
  seeded.summary,
  seeded.description,
  coalesce(seeded.location_name, place.name),
  seeded.location_details,
  place.id,
  case
    when seeded.manual_longitude is not null and seeded.manual_latitude is not null
      then extensions.st_setsrid(extensions.st_makepoint(seeded.manual_longitude, seeded.manual_latitude), 4326)::extensions.geography
    else null
  end,
  case
    when place.id is not null then 'canonical_place'
    when seeded.manual_longitude is not null and seeded.manual_latitude is not null then 'manual_pin'
    else 'manual_text'
  end,
  case
    when place.id is not null then 1.000
    when seeded.manual_longitude is not null and seeded.manual_latitude is not null then 0.920
    else 0.500
  end,
  now() + seeded.start_offset,
  now() + seeded.start_offset + seeded.duration,
  'America/Chicago',
  'https://development.utdallas.edu/files/2022/08/reflecting-pool-2.jpg',
  'published',
  'campus_only',
  'imported',
  seeded.featured_rank
from public.campuses campus
join (
  values
    (
      '99a670fa-8a4c-4778-a19b-b4f1dd93d201',
      'ut-dallas',
      'comet-sports-network',
      'sports',
      'activity-center',
      null::text,
      null::double precision,
      null::double precision,
      'volleyball-open-run',
      'Volleyball Open Run',
      'Drop in, warm up fast, and get into a live rec-center pickup rotation.',
      'An easy entry point for students who want movement, new faces, and a low-friction way to spend the evening. Skill level is mixed and teams rotate throughout the session.',
      'Courts 2 and 3 inside the Activity Center.',
      interval '-20 minutes',
      interval '1 hour 40 minutes',
      4
    ),
    (
      '8cba0d01-3a8f-45fe-b2f8-699b8c324202',
      'ut-dallas',
      'venture-mavericks',
      'tech',
      'jsom-atrium',
      null::text,
      null::double precision,
      null::double precision,
      'founders-coffee-sprint',
      'Founders Coffee Sprint',
      'Fast intros for builders, operators, and anyone circling startup ideas.',
      'Expect quick prompts, short founder stories, and a room designed for students who want to meet collaborators without the usual awkward startup-event energy.',
      'Coffee bar side of the JSOM Atrium.',
      interval '18 minutes',
      interval '1 hour 20 minutes',
      1
    ),
    (
      '5f10909e-6ecc-4215-ad06-78936fa94303',
      'ut-dallas',
      'soundstage-utd',
      'arts',
      'plinth-lawn',
      null::text,
      null::double precision,
      null::double precision,
      'open-mic-under-the-lights',
      'Open Mic Under the Lights',
      'Live music, poetry, and short sets on the lawn as the evening settles in.',
      'A relaxed student-led performance night with acoustic sets, spoken word, and a visually lit lawn setup designed for hanging out as much as performing.',
      'Stage setup near the center walk of Plinth Lawn.',
      interval '1 hour 5 minutes',
      interval '2 hours',
      3
    ),
    (
      '99f9106a-469c-41fa-bdc2-f9cf7428b104',
      'ut-dallas',
      'jsom-career-lab',
      'career',
      'student-union',
      null::text,
      null::double precision,
      null::double precision,
      'product-resume-studio',
      'Product Resume Studio',
      'Bring your resume, portfolio, or LinkedIn and get fast feedback before recruiting ramps.',
      'Career coaches and upperclassmen review product, consulting, and general business resumes with a focus on strong positioning and cleaner storytelling.',
      'Meeting room wing inside the Student Union.',
      interval '-45 minutes',
      interval '4 hours',
      6
    ),
    (
      'd70a5ec4-6756-439c-a95d-b31900be1905',
      'ut-dallas',
      'pre-med-collective',
      'academic',
      'mcdermott-library',
      null::text,
      null::double precision,
      null::double precision,
      'premed-case-review',
      'Pre-Med Case Review',
      'A focused peer review session for interviews, applications, and clinical storytelling.',
      'Students work through sample prompts, application framing, and recent interview patterns in a quieter study-forward environment.',
      'Collaborative study rooms on the library upper floor.',
      interval '2 hours 25 minutes',
      interval '1 hour 35 minutes',
      7
    ),
    (
      'bb43f2b1-a719-4cf0-a51f-d4a7e9c56606',
      'ut-dallas',
      'venture-mavericks',
      'tech',
      'ecs-south',
      null::text,
      null::double precision,
      null::double precision,
      'ai-demo-night',
      'AI Demo Night',
      'Student builders demo the things they actually shipped this month.',
      'A showcase of applied AI projects, quick demos, and practical tooling discussions for students building products, research prototypes, and side projects.',
      'Atrium breakout area in ECS South.',
      interval '1 day 1 hour',
      interval '2 hours',
      2
    ),
    (
      '660ec628-7c37-4bfb-87bf-3daa4f840107',
      'ut-dallas',
      'global-comets',
      'community',
      'student-union',
      null::text,
      null::double precision,
      null::double precision,
      'global-bites-social',
      'Global Bites Social',
      'A low-pressure dinner social designed for meeting students outside your usual orbit.',
      'Shared tables, cultural icebreakers, and a welcoming format for both international and local students looking to expand their campus circle.',
      'Main lounge inside the Student Union.',
      interval '1 day 4 hours',
      interval '2 hours 15 minutes',
      5
    ),
    (
      'e2922794-67d1-4f71-a455-db9ebd243d08',
      'ut-dallas',
      'comet-wellness-house',
      'wellness',
      'activity-center',
      null::text,
      null::double precision,
      null::double precision,
      'rec-reset-yoga',
      'Rec Reset Yoga',
      'A guided recovery session for students who want to slow down without checking out.',
      'Breathwork, mobility, and a short reset sequence meant to help students decompress after a heavy class or work stretch.',
      'Mind-body studio inside the Activity Center.',
      interval '2 days 45 minutes',
      interval '1 hour 15 minutes',
      8
    ),
    (
      '73a5a573-90a4-4cf0-bdd9-8d531635e809',
      'ut-dallas',
      'comet-sports-network',
      'sports',
      null::text,
      'Soccer Fields East',
      -96.7524::double precision,
      32.9822::double precision,
      'sunrise-soccer-scrimmage',
      'Sunrise Soccer Scrimmage',
      'A campus scrimmage with rotating squads, fast starts, and room for newcomers.',
      'Players self-organize into small-sided matches with enough structure to keep the energy up and enough flexibility for people to jump in on arrival.',
      'East intramural field setup near the Activity Center walk.',
      interval '3 days 10 hours',
      interval '2 hours',
      9
    ),
    (
      '5164d3a4-0b65-4ce5-be44-cf626e313f10',
      'ut-dallas',
      'union-programming-board',
      'social',
      'plinth-lawn',
      null::text,
      null::double precision,
      null::double precision,
      'comet-night-market',
      'Comet Night Market',
      'Food pop-ups, student booths, and the kind of energy that makes campus feel fully alive.',
      'An evening market with student creators, quick performances, and a dense social atmosphere centered around easy discovery and movement across the lawn.',
      'Full activation across Plinth Lawn.',
      interval '4 days 3 hours',
      interval '3 hours',
      10
    )
) as seeded(
  id,
  campus_slug,
  organization_slug,
  category_slug,
  place_slug,
  location_name,
  manual_longitude,
  manual_latitude,
  slug,
  title,
  summary,
  description,
  location_details,
  start_offset,
  duration,
  featured_rank
)
  on campus.slug = seeded.campus_slug
left join public.organizations organization on organization.slug = seeded.organization_slug
left join public.event_categories category on category.slug = seeded.category_slug
left join public.campus_places place on place.slug = seeded.place_slug
on conflict (slug) do update
set
  organization_id = excluded.organization_id,
  category_id = excluded.category_id,
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  location_name = excluded.location_name,
  location_details = excluded.location_details,
  place_id = excluded.place_id,
  location_point = excluded.location_point,
  location_source = excluded.location_source,
  location_confidence = excluded.location_confidence,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  timezone = excluded.timezone,
  cover_image_url = excluded.cover_image_url,
  status = excluded.status,
  visibility = excluded.visibility,
  source_type = excluded.source_type,
  featured_rank = excluded.featured_rank;

insert into public.event_metrics (
  event_id,
  bookmarks_count,
  going_count,
  interested_count,
  trending_score,
  updated_at
)
select
  event.id,
  seeded.bookmarks_count,
  seeded.going_count,
  seeded.interested_count,
  seeded.trending_score,
  now()
from public.events event
join (
  values
    ('volleyball-open-run', 9, 18, 11, 58.25::numeric),
    ('founders-coffee-sprint', 24, 33, 17, 93.75::numeric),
    ('open-mic-under-the-lights', 18, 26, 15, 73.25::numeric),
    ('product-resume-studio', 12, 20, 14, 58.50::numeric),
    ('premed-case-review', 8, 15, 10, 42.50::numeric),
    ('ai-demo-night', 21, 31, 19, 85.75::numeric),
    ('global-bites-social', 16, 24, 18, 66.00::numeric),
    ('rec-reset-yoga', 10, 16, 13, 51.75::numeric),
    ('sunrise-soccer-scrimmage', 7, 14, 9, 38.25::numeric),
    ('comet-night-market', 29, 41, 22, 114.00::numeric)
) as seeded(slug, bookmarks_count, going_count, interested_count, trending_score)
  on event.slug = seeded.slug
on conflict (event_id) do update
set
  bookmarks_count = excluded.bookmarks_count,
  going_count = excluded.going_count,
  interested_count = excluded.interested_count,
  trending_score = excluded.trending_score,
  updated_at = excluded.updated_at;
