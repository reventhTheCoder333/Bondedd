create extension if not exists pgcrypto;
create extension if not exists postgis with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.campuses (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  primary_domain text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.campus_domains (
  id bigserial primary key,
  campus_id bigint not null references public.campuses(id) on delete cascade,
  domain text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  username text unique,
  avatar_url text,
  bio text,
  class_year integer,
  campus_id bigint not null references public.campuses(id),
  campus_verification_status text not null check (campus_verification_status = 'verified-domain'),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interests (
  id bigserial primary key,
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interest_id bigint not null references public.interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, interest_id)
);

create table if not exists public.event_categories (
  id bigserial primary key,
  slug text not null unique,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  campus_id bigint not null references public.campuses(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  website_url text,
  instagram_handle text,
  is_verified boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table if not exists public.organization_follows (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (organization_id, profile_id)
);

create table if not exists public.campus_places (
  id uuid primary key default gen_random_uuid(),
  campus_id bigint not null references public.campuses(id) on delete cascade,
  slug text not null unique,
  name text not null,
  short_name text not null,
  place_kind text not null check (place_kind in ('building', 'lawn', 'plaza', 'student_center', 'library', 'athletics')),
  point extensions.geography(point, 4326) not null,
  polygon extensions.geometry(multipolygon, 4326),
  address_text text,
  search_text text not null default '',
  is_landmark boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_place_preferences (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  place_id uuid not null references public.campus_places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, place_id)
);

create table if not exists public.event_submissions (
  id uuid primary key default gen_random_uuid(),
  campus_id bigint not null references public.campuses(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  category_id bigint references public.event_categories(id) on delete set null,
  submission_type text not null check (submission_type in ('submit_event', 'club_event', 'suggestion')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'published')),
  title text not null,
  summary text,
  description text,
  location_name text,
  location_details text,
  place_id uuid references public.campus_places(id) on delete set null,
  location_point extensions.geography(point, 4326),
  location_source text not null default 'manual_text' check (location_source in ('canonical_place', 'manual_pin', 'manual_text')),
  location_confidence numeric(4, 3) not null default 0.5,
  starts_at timestamptz,
  ends_at timestamptz,
  external_url text,
  cover_image_url text,
  reviewer_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  campus_id bigint not null references public.campuses(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  submission_id uuid unique references public.event_submissions(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  category_id bigint references public.event_categories(id) on delete set null,
  slug text unique,
  title text not null,
  summary text,
  description text,
  location_name text,
  location_details text,
  place_id uuid references public.campus_places(id) on delete set null,
  location_point extensions.geography(point, 4326),
  location_source text not null default 'manual_text' check (location_source in ('canonical_place', 'manual_pin', 'manual_text')),
  location_confidence numeric(4, 3) not null default 0.5,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'America/Chicago',
  cover_image_url text,
  external_url text,
  status text not null default 'published' check (status in ('draft', 'published', 'cancelled', 'archived')),
  visibility text not null default 'campus_only' check (visibility in ('campus_only', 'public')),
  source_type text not null default 'submission' check (source_type in ('submission', 'organization', 'suggestion', 'imported')),
  featured_rank integer,
  search_document tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(location_name, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_bookmarks (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create table if not exists public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  remind_at timestamptz not null,
  delivery_channel text not null default 'in_app' check (delivery_channel in ('in_app', 'email')),
  created_at timestamptz not null default now(),
  unique (event_id, profile_id, remind_at)
);

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('interested', 'going', 'went')),
  visibility text not null default 'public'
    check (visibility in ('public', 'followers', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create table if not exists public.event_recommendations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  bucket text not null check (bucket in ('today', 'trending', 'recommended', 'upcoming')),
  reason text,
  rank_score numeric(10, 4) not null default 0,
  created_at timestamptz not null default now(),
  unique (profile_id, event_id, bucket)
);

create table if not exists public.event_metrics (
  event_id uuid primary key references public.events(id) on delete cascade,
  bookmarks_count integer not null default 0,
  going_count integer not null default 0,
  interested_count integer not null default 0,
  trending_score numeric(10, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'accepted'
    check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  constraint follows_no_self_follow check (follower_id <> following_id),
  unique (follower_id, following_id)
);

create table if not exists public.event_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (event_id, sender_id, recipient_id)
);

create table if not exists public.event_shares (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.event_access_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (event_id, requester_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'follow_request',
    'follow_accepted',
    'event_invite',
    'event_share',
    'invite_accepted',
    'access_request',
    'access_approved'
  )),
  entity_type text not null check (entity_type in (
    'event', 'follow', 'invite', 'share', 'request'
  )),
  entity_id uuid not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.event_submissions add column if not exists place_id uuid references public.campus_places(id) on delete set null;
alter table public.event_submissions add column if not exists location_point extensions.geography(point, 4326);
alter table public.event_submissions add column if not exists location_source text not null default 'manual_text';
alter table public.event_submissions add column if not exists location_confidence numeric(4, 3) not null default 0.5;

alter table public.events add column if not exists place_id uuid references public.campus_places(id) on delete set null;
alter table public.events add column if not exists location_point extensions.geography(point, 4326);
alter table public.events add column if not exists location_source text not null default 'manual_text';
alter table public.events add column if not exists location_confidence numeric(4, 3) not null default 0.5;

create index if not exists idx_profiles_campus_id on public.profiles (campus_id);
create index if not exists idx_organizations_campus_id on public.organizations (campus_id);
create index if not exists idx_organization_memberships_profile_id on public.organization_memberships (profile_id);
create index if not exists idx_profile_place_preferences_profile_id on public.profile_place_preferences (profile_id);
create index if not exists idx_campus_places_campus_id on public.campus_places (campus_id);
create index if not exists idx_campus_places_point on public.campus_places using gist ((point::extensions.geometry));
create index if not exists idx_event_submissions_submitted_by on public.event_submissions (submitted_by);
create index if not exists idx_event_submissions_status on public.event_submissions (status);
create index if not exists idx_event_submissions_place_id on public.event_submissions (place_id);
create index if not exists idx_event_submissions_location_point on public.event_submissions using gist ((location_point::extensions.geometry));
create index if not exists idx_events_campus_status_starts_at on public.events (campus_id, status, starts_at);
create index if not exists idx_events_category_id on public.events (category_id);
create index if not exists idx_events_organization_id on public.events (organization_id);
create index if not exists idx_events_place_id on public.events (place_id);
create index if not exists idx_events_location_point on public.events using gist ((location_point::extensions.geometry));
create index if not exists idx_events_search_document on public.events using gin (search_document);
create index if not exists idx_event_recommendations_profile_bucket on public.event_recommendations (profile_id, bucket, rank_score desc);
create index if not exists idx_event_rsvps_profile_id on public.event_rsvps (profile_id);
create index if not exists idx_event_bookmarks_profile_id on public.event_bookmarks (profile_id);

create index if not exists idx_follows_follower_id on public.follows (follower_id);
create index if not exists idx_follows_following_id on public.follows (following_id);
create index if not exists idx_follows_status on public.follows (status);

create index if not exists idx_event_invites_recipient_status on public.event_invites (recipient_id, status);
create index if not exists idx_event_invites_sender_id on public.event_invites (sender_id);
create index if not exists idx_event_invites_event_id on public.event_invites (event_id);

create index if not exists idx_event_shares_recipient_id on public.event_shares (recipient_id);
create index if not exists idx_event_shares_sender_id on public.event_shares (sender_id);
create index if not exists idx_event_shares_event_id on public.event_shares (event_id);

create index if not exists idx_event_access_requests_host_status on public.event_access_requests (host_id, status);
create index if not exists idx_event_access_requests_requester_id on public.event_access_requests (requester_id);
create index if not exists idx_event_access_requests_event_id on public.event_access_requests (event_id);

create index if not exists idx_notifications_user_created on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications (user_id) where read_at is null;

create or replace function public.is_org_manager(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_org_id
      and membership.profile_id = auth.uid()
      and membership.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_following(viewer_id uuid, target_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.follows
    where follower_id = viewer_id
      and following_id = target_id
      and status = 'accepted'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_slug text := new.raw_user_meta_data ->> 'campus_slug';
  verification_status text := coalesce(new.raw_user_meta_data ->> 'campus_verification_status', 'verified-domain');
  matched_campus_id bigint;
begin
  select id into matched_campus_id
  from public.campuses
  where slug = requested_slug;

  if matched_campus_id is null then
    raise exception 'Campus slug % not found in campuses table', requested_slug;
  end if;

  insert into public.profiles (id, email, campus_id, campus_verification_status)
  values (new.id, new.email, matched_campus_id, verification_status)
  on conflict (id) do update
  set
    email = excluded.email,
    campus_id = excluded.campus_id,
    campus_verification_status = excluded.campus_verification_status;

  return new;
end;
$$;

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.organization_memberships (organization_id, profile_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict (organization_id, profile_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.refresh_event_metrics(target_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bookmarks_total integer;
  going_total integer;
  interested_total integer;
begin
  select count(*) into bookmarks_total
  from public.event_bookmarks
  where event_id = target_event_id;

  select count(*) filter (where status = 'going'),
         count(*) filter (where status = 'interested')
  into going_total, interested_total
  from public.event_rsvps
  where event_id = target_event_id;

  insert into public.event_metrics (event_id, bookmarks_count, going_count, interested_count, trending_score, updated_at)
  values (
    target_event_id,
    coalesce(bookmarks_total, 0),
    coalesce(going_total, 0),
    coalesce(interested_total, 0),
    coalesce(bookmarks_total, 0) * 1.50 + coalesce(going_total, 0) * 2.00 + coalesce(interested_total, 0) * 0.75,
    now()
  )
  on conflict (event_id) do update
  set
    bookmarks_count = excluded.bookmarks_count,
    going_count = excluded.going_count,
    interested_count = excluded.interested_count,
    trending_score = excluded.trending_score,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.handle_event_metric_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_event_metrics(coalesce(new.event_id, old.event_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.get_campus_places_geojson(
  p_campus_id bigint default null,
  p_campus_slug text default 'ut-dallas'
)
returns table (
  id uuid,
  slug text,
  name text,
  short_name text,
  place_kind text,
  latitude double precision,
  longitude double precision,
  address_text text,
  search_text text,
  is_landmark boolean,
  is_active boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with campus_target as (
    select campus.id
    from public.campuses campus
    where campus.id = coalesce(p_campus_id, campus.id)
      and (p_campus_id is not null or campus.slug = p_campus_slug)
    limit 1
  )
  select
    place.id,
    place.slug,
    place.name,
    place.short_name,
    place.place_kind,
    extensions.st_y(place.point::extensions.geometry) as latitude,
    extensions.st_x(place.point::extensions.geometry) as longitude,
    place.address_text,
    place.search_text,
    place.is_landmark,
    place.is_active
  from public.campus_places place
  join campus_target on campus_target.id = place.campus_id
  where place.is_active = true
  order by place.is_landmark desc, place.name asc;
$$;

create or replace function public.search_campus_places(
  p_campus_id bigint default null,
  p_campus_slug text default 'ut-dallas',
  p_query text default null,
  p_limit integer default 8
)
returns table (
  id uuid,
  slug text,
  name text,
  short_name text,
  place_kind text,
  latitude double precision,
  longitude double precision,
  address_text text,
  search_text text,
  is_landmark boolean,
  is_active boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with campus_target as (
    select campus.id
    from public.campuses campus
    where campus.id = coalesce(p_campus_id, campus.id)
      and (p_campus_id is not null or campus.slug = p_campus_slug)
    limit 1
  )
  select
    place.id,
    place.slug,
    place.name,
    place.short_name,
    place.place_kind,
    extensions.st_y(place.point::extensions.geometry) as latitude,
    extensions.st_x(place.point::extensions.geometry) as longitude,
    place.address_text,
    place.search_text,
    place.is_landmark,
    place.is_active
  from public.campus_places place
  join campus_target on campus_target.id = place.campus_id
  where place.is_active = true
    and (
      p_query is null
      or p_query = ''
      or place.search_text ilike '%' || p_query || '%'
      or place.name ilike '%' || p_query || '%'
      or place.short_name ilike '%' || p_query || '%'
    )
  order by place.is_landmark desc, place.name asc
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_explore_events(
  p_campus_id bigint default null,
  p_campus_slug text default 'ut-dallas',
  p_min_lng double precision default null,
  p_min_lat double precision default null,
  p_max_lng double precision default null,
  p_max_lat double precision default null,
  p_category_slugs text[] default null,
  p_date_start timestamptz default null,
  p_date_end timestamptz default null,
  p_organization_slugs text[] default null,
  p_search_text text default null
)
returns table (
  event_id uuid,
  title text,
  summary text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  organization_name text,
  organization_slug text,
  category_name text,
  category_slug text,
  place_name text,
  location_name text,
  latitude double precision,
  longitude double precision,
  trending_score numeric,
  is_bookmarked boolean,
  rsvp_status text,
  cover_image_url text
)
language sql
security definer
set search_path = public
stable
as $$
  with campus_target as (
    select campus.id
    from public.campuses campus
    where campus.id = coalesce(p_campus_id, campus.id)
      and (p_campus_id is not null or campus.slug = p_campus_slug)
    limit 1
  ),
  resolved_events as (
    select
      event.id as event_id,
      event.title,
      event.summary,
      event.description,
      event.starts_at,
      event.ends_at,
      organization.name as organization_name,
      organization.slug as organization_slug,
      category.name as category_name,
      category.slug as category_slug,
      place.name as place_name,
      event.location_name,
      coalesce(event.location_point, place.point) as resolved_point,
      coalesce(metrics.trending_score, 0) as trending_score,
      (bookmark.profile_id is not null) as is_bookmarked,
      rsvp.status as rsvp_status,
      event.cover_image_url
    from public.events event
    join campus_target on campus_target.id = event.campus_id
    left join public.organizations organization on organization.id = event.organization_id
    left join public.event_categories category on category.id = event.category_id
    left join public.campus_places place on place.id = event.place_id
    left join public.event_metrics metrics on metrics.event_id = event.id
    left join public.event_bookmarks bookmark
      on bookmark.event_id = event.id
      and bookmark.profile_id = auth.uid()
    left join public.event_rsvps rsvp
      on rsvp.event_id = event.id
      and rsvp.profile_id = auth.uid()
    where event.status = 'published'
      and coalesce(event.location_point, place.point) is not null
      and (
        p_category_slugs is null
        or category.slug = any(p_category_slugs)
      )
      and (
        p_organization_slugs is null
        or organization.slug = any(p_organization_slugs)
      )
      and (
        p_date_start is null
        or event.starts_at >= p_date_start
      )
      and (
        p_date_end is null
        or event.starts_at <= p_date_end
      )
      and (
        p_search_text is null
        or p_search_text = ''
        or event.search_document @@ websearch_to_tsquery('english', p_search_text)
        or place.search_text ilike '%' || p_search_text || '%'
      )
  )
  select
    resolved.event_id,
    resolved.title,
    resolved.summary,
    resolved.description,
    resolved.starts_at,
    resolved.ends_at,
    resolved.organization_name,
    resolved.organization_slug,
    resolved.category_name,
    resolved.category_slug,
    resolved.place_name,
    resolved.location_name,
    extensions.st_y(resolved.resolved_point::extensions.geometry) as latitude,
    extensions.st_x(resolved.resolved_point::extensions.geometry) as longitude,
    resolved.trending_score,
    resolved.is_bookmarked,
    resolved.rsvp_status,
    resolved.cover_image_url
  from resolved_events resolved
  where (
    p_min_lng is null
    or p_min_lat is null
    or p_max_lng is null
    or p_max_lat is null
    or extensions.st_within(
      resolved.resolved_point::extensions.geometry,
      extensions.st_makeenvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    )
  )
  order by resolved.trending_score desc, resolved.starts_at asc;
$$;

create or replace function public.get_event_detail(
  p_event_id uuid
)
returns table (
  event_id uuid,
  title text,
  summary text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  organization_name text,
  organization_slug text,
  category_name text,
  category_slug text,
  place_name text,
  location_name text,
  latitude double precision,
  longitude double precision,
  trending_score numeric,
  is_bookmarked boolean,
  rsvp_status text,
  cover_image_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    event.id as event_id,
    event.title,
    event.summary,
    event.description,
    event.starts_at,
    event.ends_at,
    organization.name as organization_name,
    organization.slug as organization_slug,
    category.name as category_name,
    category.slug as category_slug,
    place.name as place_name,
    event.location_name,
    extensions.st_y(coalesce(event.location_point, place.point)::extensions.geometry) as latitude,
    extensions.st_x(coalesce(event.location_point, place.point)::extensions.geometry) as longitude,
    coalesce(metrics.trending_score, 0) as trending_score,
    (bookmark.profile_id is not null) as is_bookmarked,
    rsvp.status as rsvp_status,
    event.cover_image_url
  from public.events event
  left join public.organizations organization on organization.id = event.organization_id
  left join public.event_categories category on category.id = event.category_id
  left join public.campus_places place on place.id = event.place_id
  left join public.event_metrics metrics on metrics.event_id = event.id
  left join public.event_bookmarks bookmark
    on bookmark.event_id = event.id
    and bookmark.profile_id = auth.uid()
  left join public.event_rsvps rsvp
    on rsvp.event_id = event.id
    and rsvp.profile_id = auth.uid()
  where event.id = p_event_id
    and event.status = 'published'
    and coalesce(event.location_point, place.point) is not null;
$$;

create or replace function public.get_organizations_directory(
  p_campus_id bigint default null,
  p_campus_slug text default 'ut-dallas',
  p_query text default null,
  p_sort text default 'alphabetical',
  p_limit integer default 60
)
returns table (
  organization_id uuid,
  name text,
  slug text,
  description text,
  website_url text,
  instagram_handle text,
  is_verified boolean,
  follower_count integer,
  member_count integer,
  event_count integer,
  upcoming_event_count integer,
  is_following boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with campus_target as (
    select campus.id
    from public.campuses campus
    where campus.id = coalesce(p_campus_id, campus.id)
      and (p_campus_id is not null or campus.slug = p_campus_slug)
    limit 1
  ),
  org_rollup as (
    select
      organization.id as organization_id,
      organization.name,
      organization.slug,
      organization.description,
      organization.website_url,
      organization.instagram_handle,
      organization.is_verified,
      count(distinct follow.profile_id)::integer as follower_count,
      count(distinct membership.profile_id)::integer as member_count,
      count(distinct event.id)::integer as event_count,
      count(distinct event.id) filter (where event.starts_at >= now())::integer as upcoming_event_count,
      coalesce(bool_or(user_follow.profile_id is not null), false) as is_following
    from public.organizations organization
    join campus_target on campus_target.id = organization.campus_id
    left join public.organization_follows follow on follow.organization_id = organization.id
    left join public.organization_memberships membership on membership.organization_id = organization.id
    left join public.events event
      on event.organization_id = organization.id
      and event.status = 'published'
    left join public.organization_follows user_follow
      on user_follow.organization_id = organization.id
      and user_follow.profile_id = auth.uid()
    where (
      p_query is null
      or p_query = ''
      or organization.name ilike '%' || p_query || '%'
      or organization.slug ilike '%' || p_query || '%'
      or coalesce(organization.description, '') ilike '%' || p_query || '%'
      or coalesce(organization.instagram_handle, '') ilike '%' || p_query || '%'
    )
    group by organization.id, organization.name, organization.slug, organization.description, organization.website_url, organization.instagram_handle, organization.is_verified
  )
  select
    org_rollup.organization_id,
    org_rollup.name,
    org_rollup.slug,
    org_rollup.description,
    org_rollup.website_url,
    org_rollup.instagram_handle,
    org_rollup.is_verified,
    org_rollup.follower_count,
    org_rollup.member_count,
    org_rollup.event_count,
    org_rollup.upcoming_event_count,
    org_rollup.is_following
  from org_rollup
  order by
    case when p_sort = 'followers' then org_rollup.follower_count end desc nulls last,
    case when p_sort = 'activity' then org_rollup.upcoming_event_count end desc nulls last,
    case when p_sort = 'activity' then org_rollup.event_count end desc nulls last,
    org_rollup.is_verified desc,
    org_rollup.name asc
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_organization_profile(
  p_organization_slug text
)
returns table (
  organization_id uuid,
  name text,
  slug text,
  description text,
  website_url text,
  instagram_handle text,
  is_verified boolean,
  follower_count integer,
  member_count integer,
  event_count integer,
  upcoming_event_count integer,
  is_following boolean,
  member_previews jsonb,
  follower_previews jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    organization.id as organization_id,
    organization.name,
    organization.slug,
    organization.description,
    organization.website_url,
    organization.instagram_handle,
    organization.is_verified,
    (
      select count(*)::integer
      from public.organization_follows follow
      where follow.organization_id = organization.id
    ) as follower_count,
    (
      select count(*)::integer
      from public.organization_memberships membership
      where membership.organization_id = organization.id
    ) as member_count,
    (
      select count(*)::integer
      from public.events event
      where event.organization_id = organization.id
        and event.status = 'published'
    ) as event_count,
    (
      select count(*)::integer
      from public.events event
      where event.organization_id = organization.id
        and event.status = 'published'
        and event.starts_at >= now()
    ) as upcoming_event_count,
    exists (
      select 1
      from public.organization_follows follow
      where follow.organization_id = organization.id
        and follow.profile_id = auth.uid()
    ) as is_following,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', member_rows.id,
            'full_name', member_rows.full_name,
            'username', member_rows.username,
            'avatar_url', member_rows.avatar_url,
            'role', member_rows.role
          )
        )
        from (
          select
            profile.id,
            profile.full_name,
            profile.username,
            profile.avatar_url,
            membership.role,
            case membership.role
              when 'owner' then 0
              when 'admin' then 1
              else 2
            end as role_rank,
            membership.created_at
          from public.organization_memberships membership
          join public.profiles profile on profile.id = membership.profile_id
          where membership.organization_id = organization.id
          order by role_rank asc, membership.created_at asc
          limit 6
        ) member_rows
      ),
      '[]'::jsonb
    ) as member_previews,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', follower_rows.id,
            'full_name', follower_rows.full_name,
            'username', follower_rows.username,
            'avatar_url', follower_rows.avatar_url
          )
        )
        from (
          select
            profile.id,
            profile.full_name,
            profile.username,
            profile.avatar_url,
            follow.created_at
          from public.organization_follows follow
          join public.profiles profile on profile.id = follow.profile_id
          where follow.organization_id = organization.id
          order by follow.created_at desc
          limit 6
        ) follower_rows
      ),
      '[]'::jsonb
    ) as follower_previews
  from public.organizations organization
  where organization.slug = p_organization_slug
  limit 1;
$$;

create or replace function public.get_organization_events(
  p_organization_slug text,
  p_bucket text default 'upcoming',
  p_limit integer default 6
)
returns table (
  event_id uuid,
  title text,
  summary text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  organization_name text,
  organization_slug text,
  category_name text,
  category_slug text,
  place_name text,
  location_name text,
  latitude double precision,
  longitude double precision,
  trending_score numeric,
  is_bookmarked boolean,
  rsvp_status text,
  cover_image_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    event.id as event_id,
    event.title,
    event.summary,
    event.description,
    event.starts_at,
    event.ends_at,
    organization.name as organization_name,
    organization.slug as organization_slug,
    category.name as category_name,
    category.slug as category_slug,
    place.name as place_name,
    event.location_name,
    extensions.st_y(coalesce(event.location_point, place.point)::extensions.geometry) as latitude,
    extensions.st_x(coalesce(event.location_point, place.point)::extensions.geometry) as longitude,
    coalesce(metrics.trending_score, 0) as trending_score,
    (bookmark.profile_id is not null) as is_bookmarked,
    rsvp.status as rsvp_status,
    event.cover_image_url
  from public.events event
  join public.organizations organization on organization.id = event.organization_id
  left join public.event_categories category on category.id = event.category_id
  left join public.campus_places place on place.id = event.place_id
  left join public.event_metrics metrics on metrics.event_id = event.id
  left join public.event_bookmarks bookmark
    on bookmark.event_id = event.id
    and bookmark.profile_id = auth.uid()
  left join public.event_rsvps rsvp
    on rsvp.event_id = event.id
    and rsvp.profile_id = auth.uid()
  where organization.slug = p_organization_slug
    and event.status = 'published'
    and coalesce(event.location_point, place.point) is not null
    and (
      (p_bucket = 'upcoming' and event.starts_at >= now())
      or (p_bucket = 'past' and event.starts_at < now())
    )
  order by
    case when p_bucket = 'upcoming' then event.starts_at end asc nulls last,
    case when p_bucket = 'past' then event.starts_at end desc nulls last
  limit greatest(p_limit, 1);
$$;

create or replace function public.search_bondedd(
  p_campus_id bigint default null,
  p_campus_slug text default 'ut-dallas',
  p_query text default null,
  p_limit_per_type integer default 6
)
returns table (
  entity_type text,
  entity_id text,
  slug text,
  title text,
  description text,
  subtitle text,
  meta text,
  is_verified boolean,
  latitude double precision,
  longitude double precision
)
language sql
security definer
set search_path = public
stable
as $$
  with campus_target as (
    select campus.id
    from public.campuses campus
    where campus.id = coalesce(p_campus_id, campus.id)
      and (p_campus_id is not null or campus.slug = p_campus_slug)
    limit 1
  ),
  organization_matches as (
    select
      'organization'::text as entity_type,
      organization.id::text as entity_id,
      organization.slug,
      organization.name as title,
      coalesce(organization.description, '') as description,
      case when organization.is_verified then 'Verified organization' else 'Organization' end as subtitle,
      null::text as meta,
      organization.is_verified,
      null::double precision as latitude,
      null::double precision as longitude
    from public.organizations organization
    join campus_target on campus_target.id = organization.campus_id
    where (
      p_query is not null
      and p_query <> ''
      and (
        organization.name ilike '%' || p_query || '%'
        or organization.slug ilike '%' || p_query || '%'
        or coalesce(organization.description, '') ilike '%' || p_query || '%'
        or coalesce(organization.instagram_handle, '') ilike '%' || p_query || '%'
      )
    )
    order by organization.is_verified desc, organization.name asc
    limit greatest(p_limit_per_type, 1)
  ),
  event_matches as (
    select
      'event'::text as entity_type,
      event.id::text as entity_id,
      organization.slug,
      event.title,
      coalesce(event.summary, event.description, '') as description,
      coalesce(category.name, 'Event') as subtitle,
      coalesce(organization.name, 'Campus organization') || '|||' ||
      coalesce(place.name, event.location_name, 'UT Dallas') || '|||' ||
      event.starts_at::text as meta,
      null::boolean as is_verified,
      extensions.st_y(coalesce(event.location_point, place.point)::extensions.geometry) as latitude,
      extensions.st_x(coalesce(event.location_point, place.point)::extensions.geometry) as longitude
    from public.events event
    join campus_target on campus_target.id = event.campus_id
    left join public.organizations organization on organization.id = event.organization_id
    left join public.event_categories category on category.id = event.category_id
    left join public.campus_places place on place.id = event.place_id
    where event.status = 'published'
      and coalesce(event.location_point, place.point) is not null
      and (
        p_query is not null
        and p_query <> ''
        and (
          event.search_document @@ websearch_to_tsquery('english', p_query)
          or coalesce(organization.name, '') ilike '%' || p_query || '%'
          or coalesce(place.search_text, '') ilike '%' || p_query || '%'
        )
      )
    order by event.starts_at asc
    limit greatest(p_limit_per_type, 1)
  ),
  place_matches as (
    select
      'place'::text as entity_type,
      place.id::text as entity_id,
      place.slug,
      place.name as title,
      coalesce(place.address_text, '') as description,
      place.short_name as subtitle,
      place.place_kind as meta,
      null::boolean as is_verified,
      extensions.st_y(place.point::extensions.geometry) as latitude,
      extensions.st_x(place.point::extensions.geometry) as longitude
    from public.campus_places place
    join campus_target on campus_target.id = place.campus_id
    where place.is_active = true
      and (
        p_query is not null
        and p_query <> ''
        and (
          place.search_text ilike '%' || p_query || '%'
          or place.name ilike '%' || p_query || '%'
          or place.short_name ilike '%' || p_query || '%'
        )
      )
    order by place.is_landmark desc, place.name asc
    limit greatest(p_limit_per_type, 1)
  )
  select * from organization_matches
  union all
  select * from event_matches
  union all
  select * from place_matches;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute procedure public.set_updated_at();

drop trigger if exists campus_places_set_updated_at on public.campus_places;
create trigger campus_places_set_updated_at
before update on public.campus_places
for each row execute procedure public.set_updated_at();

drop trigger if exists event_submissions_set_updated_at on public.event_submissions;
create trigger event_submissions_set_updated_at
before update on public.event_submissions
for each row execute procedure public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute procedure public.set_updated_at();

drop trigger if exists event_rsvps_set_updated_at on public.event_rsvps;
create trigger event_rsvps_set_updated_at
before update on public.event_rsvps
for each row execute procedure public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists organizations_create_owner_membership on public.organizations;
create trigger organizations_create_owner_membership
after insert on public.organizations
for each row execute procedure public.handle_new_organization();

drop trigger if exists event_bookmarks_refresh_metrics on public.event_bookmarks;
create trigger event_bookmarks_refresh_metrics
after insert or delete on public.event_bookmarks
for each row execute procedure public.handle_event_metric_change();

drop trigger if exists event_rsvps_refresh_metrics on public.event_rsvps;
create trigger event_rsvps_refresh_metrics
after insert or update or delete on public.event_rsvps
for each row execute procedure public.handle_event_metric_change();

alter table public.campuses enable row level security;
alter table public.campus_domains enable row level security;
alter table public.profiles enable row level security;
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.profile_place_preferences enable row level security;
alter table public.event_categories enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_follows enable row level security;
alter table public.campus_places enable row level security;
alter table public.event_submissions enable row level security;
alter table public.events enable row level security;
alter table public.event_bookmarks enable row level security;
alter table public.event_reminders enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.event_recommendations enable row level security;
alter table public.event_metrics enable row level security;
alter table public.follows enable row level security;
alter table public.event_invites enable row level security;
alter table public.event_shares enable row level security;
alter table public.event_access_requests enable row level security;
alter table public.notifications enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatar images are publicly readable" on storage.objects;
create policy "avatar images are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "users can upload their own avatars" on storage.objects;
create policy "users can upload their own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can update their own avatars" on storage.objects;
create policy "users can update their own avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can delete their own avatars" on storage.objects;
create policy "users can delete their own avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "campuses are readable by authenticated users" on public.campuses;
create policy "campuses are readable by authenticated users"
on public.campuses for select
to authenticated
using (true);

drop policy if exists "campus domains are readable by authenticated users" on public.campus_domains;
create policy "campus domains are readable by authenticated users"
on public.campus_domains for select
to authenticated
using (true);

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "interests are readable by authenticated users" on public.interests;
create policy "interests are readable by authenticated users"
on public.interests for select
to authenticated
using (true);

drop policy if exists "users can manage their own interests" on public.profile_interests;
create policy "users can manage their own interests"
on public.profile_interests for all
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "users can manage their own place preferences" on public.profile_place_preferences;
create policy "users can manage their own place preferences"
on public.profile_place_preferences for all
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "event categories are readable by authenticated users" on public.event_categories;
create policy "event categories are readable by authenticated users"
on public.event_categories for select
to authenticated
using (true);

drop policy if exists "organizations are readable by authenticated users" on public.organizations;
create policy "organizations are readable by authenticated users"
on public.organizations for select
to authenticated
using (true);

drop policy if exists "authenticated users can create organizations" on public.organizations;
create policy "authenticated users can create organizations"
on public.organizations for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "organization managers can update organizations" on public.organizations;
create policy "organization managers can update organizations"
on public.organizations for update
to authenticated
using (public.is_org_manager(id))
with check (public.is_org_manager(id));

drop policy if exists "organization memberships are readable by authenticated users" on public.organization_memberships;
create policy "organization memberships are readable by authenticated users"
on public.organization_memberships for select
to authenticated
using (true);

drop policy if exists "organization managers can manage memberships" on public.organization_memberships;
create policy "organization managers can manage memberships"
on public.organization_memberships for all
to authenticated
using (public.is_org_manager(organization_id) or auth.uid() = profile_id)
with check (public.is_org_manager(organization_id) or auth.uid() = profile_id);

drop policy if exists "users can manage follows" on public.organization_follows;
create policy "users can manage follows"
on public.organization_follows for all
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "campus places are readable by authenticated users" on public.campus_places;
create policy "campus places are readable by authenticated users"
on public.campus_places for select
to authenticated
using (true);

drop policy if exists "users can read their own submissions" on public.event_submissions;
create policy "users can read their own submissions"
on public.event_submissions for select
to authenticated
using (auth.uid() = submitted_by or public.is_org_manager(organization_id));

drop policy if exists "users can create submissions" on public.event_submissions;
create policy "users can create submissions"
on public.event_submissions for insert
to authenticated
with check (
  auth.uid() = submitted_by
  and (
    organization_id is null
    or public.is_org_manager(organization_id)
  )
);

drop policy if exists "users can update their submissions" on public.event_submissions;
create policy "users can update their submissions"
on public.event_submissions for update
to authenticated
using (auth.uid() = submitted_by or public.is_org_manager(organization_id))
with check (auth.uid() = submitted_by or public.is_org_manager(organization_id));

drop policy if exists "users can delete draft submissions" on public.event_submissions;
create policy "users can delete draft submissions"
on public.event_submissions for delete
to authenticated
using (auth.uid() = submitted_by and status = 'draft');

drop policy if exists "published events are readable by authenticated users" on public.events;
create policy "published events are readable by authenticated users"
on public.events for select
to authenticated
using (
  status = 'published'
  or auth.uid() = created_by
  or public.is_org_manager(organization_id)
);

drop policy if exists "users can manage bookmarks" on public.event_bookmarks;
create policy "users can manage bookmarks"
on public.event_bookmarks for all
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "users can manage reminders" on public.event_reminders;
create policy "users can manage reminders"
on public.event_reminders for all
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "users can manage rsvps" on public.event_rsvps;
create policy "users can manage rsvps"
on public.event_rsvps for all
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "users can read their own recommendations" on public.event_recommendations;
create policy "users can read their own recommendations"
on public.event_recommendations for select
to authenticated
using (auth.uid() = profile_id);

drop policy if exists "event metrics are readable by authenticated users" on public.event_metrics;
create policy "event metrics are readable by authenticated users"
on public.event_metrics for select
to authenticated
using (true);

drop policy if exists "users can see public rsvps" on public.event_rsvps;
create policy "users can see public rsvps"
on public.event_rsvps for select
to authenticated
using (visibility = 'public');

drop policy if exists "followers can see follower-visible rsvps" on public.event_rsvps;
create policy "followers can see follower-visible rsvps"
on public.event_rsvps for select
to authenticated
using (
  visibility = 'followers'
  and public.is_following(auth.uid(), profile_id)
);

drop policy if exists "users can view follows involving them" on public.follows;
create policy "users can view follows involving them"
on public.follows for select
to authenticated
using (
  auth.uid() = follower_id
  or auth.uid() = following_id
);

drop policy if exists "users can follow others" on public.follows;
create policy "users can follow others"
on public.follows for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "users can update their own follow relationships" on public.follows;
create policy "users can update their own follow relationships"
on public.follows for update
to authenticated
using (
  auth.uid() = follower_id
  or auth.uid() = following_id
);

drop policy if exists "users can unfollow" on public.follows;
create policy "users can unfollow"
on public.follows for delete
to authenticated
using (auth.uid() = follower_id);

drop policy if exists "users can view their invites" on public.event_invites;
create policy "users can view their invites"
on public.event_invites for select
to authenticated
using (
  auth.uid() = sender_id
  or auth.uid() = recipient_id
);

drop policy if exists "users can send invites" on public.event_invites;
create policy "users can send invites"
on public.event_invites for insert
to authenticated
with check (auth.uid() = sender_id);

drop policy if exists "recipients can respond to invites" on public.event_invites;
create policy "recipients can respond to invites"
on public.event_invites for update
to authenticated
using (auth.uid() = recipient_id);

drop policy if exists "senders can delete pending invites" on public.event_invites;
create policy "senders can delete pending invites"
on public.event_invites for delete
to authenticated
using (auth.uid() = sender_id and status = 'pending');

drop policy if exists "users can view their shares" on public.event_shares;
create policy "users can view their shares"
on public.event_shares for select
to authenticated
using (
  auth.uid() = sender_id
  or auth.uid() = recipient_id
);

drop policy if exists "users can share events" on public.event_shares;
create policy "users can share events"
on public.event_shares for insert
to authenticated
with check (auth.uid() = sender_id);

drop policy if exists "senders can delete their shares" on public.event_shares;
create policy "senders can delete their shares"
on public.event_shares for delete
to authenticated
using (auth.uid() = sender_id);

drop policy if exists "users can view their access requests" on public.event_access_requests;
create policy "users can view their access requests"
on public.event_access_requests for select
to authenticated
using (
  auth.uid() = requester_id
  or auth.uid() = host_id
);

drop policy if exists "users can request event access" on public.event_access_requests;
create policy "users can request event access"
on public.event_access_requests for insert
to authenticated
with check (auth.uid() = requester_id);

drop policy if exists "hosts can respond to access requests" on public.event_access_requests;
create policy "hosts can respond to access requests"
on public.event_access_requests for update
to authenticated
using (auth.uid() = host_id);

drop policy if exists "requesters can cancel their requests" on public.event_access_requests;
create policy "requesters can cancel their requests"
on public.event_access_requests for delete
to authenticated
using (auth.uid() = requester_id and status = 'pending');

drop policy if exists "users can view their notifications" on public.notifications;
create policy "users can view their notifications"
on public.notifications for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "authenticated users can create notifications" on public.notifications;
create policy "authenticated users can create notifications"
on public.notifications for insert
to authenticated
with check (auth.uid() = actor_id);

drop policy if exists "users can mark notifications as read" on public.notifications;
create policy "users can mark notifications as read"
on public.notifications for update
to authenticated
using (auth.uid() = user_id);

insert into public.campuses (slug, name, primary_domain)
values ('ut-dallas', 'The University of Texas at Dallas', 'utdallas.edu')
on conflict (slug) do update
set
  name = excluded.name,
  primary_domain = excluded.primary_domain;

insert into public.campus_domains (campus_id, domain)
select campus.id, seeded.domain
from public.campuses campus
join (
  values
    ('ut-dallas', 'utdallas.edu'),
    ('ut-dallas', 'mail.utdallas.edu')
) as seeded(slug, domain)
  on campus.slug = seeded.slug
on conflict (domain) do nothing;

insert into public.interests (slug, name)
values
  ('startups-founders', 'Startups & Founders'),
  ('tech-hackathons', 'Tech & Hackathons'),
  ('arts-creative', 'Arts & Creative'),
  ('music-performances', 'Music & Performances'),
  ('sports-fitness', 'Sports & Fitness'),
  ('culture-community', 'Culture & Community'),
  ('premed-academic', 'Pre-Med / Academic'),
  ('social-events', 'Social Events'),
  ('wellness', 'Wellness')
on conflict (slug) do update
set name = excluded.name;

insert into public.event_categories (slug, name, sort_order)
values
  ('social', 'Social', 10),
  ('career', 'Career', 20),
  ('academic', 'Academic', 30),
  ('tech', 'Tech', 40),
  ('arts', 'Arts', 50),
  ('wellness', 'Wellness', 60),
  ('sports', 'Sports', 70),
  ('community', 'Community', 80)
on conflict (slug) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order;

insert into public.campus_places (
  campus_id,
  slug,
  name,
  short_name,
  place_kind,
  point,
  address_text,
  search_text,
  is_landmark
)
select
  campus.id,
  seeded.slug,
  seeded.name,
  seeded.short_name,
  seeded.place_kind,
  extensions.st_setsrid(extensions.st_makepoint(seeded.longitude, seeded.latitude), 4326)::extensions.geography,
  seeded.address_text,
  seeded.search_text,
  seeded.is_landmark
from public.campuses campus
join (
  values
    ('ut-dallas', 'student-union', 'Student Union', 'SU', 'student_center', -96.75015::double precision, 32.98655::double precision, '800 W Campbell Rd, Richardson, TX', 'student union su food court', true),
    ('ut-dallas', 'plinth-lawn', 'Plinth Lawn', 'Plinth', 'lawn', -96.74935::double precision, 32.98695::double precision, 'Near the Student Union', 'plinth lawn outdoor central lawn', true),
    ('ut-dallas', 'jsom-atrium', 'JSOM Atrium', 'JSOM', 'building', -96.74905::double precision, 32.98510::double precision, 'Jindal School of Management', 'jsom atrium jindal school management', true),
    ('ut-dallas', 'ecs-south', 'ECS South', 'ECS', 'building', -96.75095::double precision, 32.98540::double precision, 'Engineering and Computer Science South', 'ecs south engineering computer science', true),
    ('ut-dallas', 'mcdermott-library', 'McDermott Library', 'Library', 'library', -96.74820::double precision, 32.98595::double precision, 'McDermott Library', 'mcdermott library study late night', true),
    ('ut-dallas', 'activity-center', 'Activity Center', 'AC', 'athletics', -96.74970::double precision, 32.98295::double precision, 'Activity Center', 'activity center gym rec sports', true)
) as seeded(campus_slug, slug, name, short_name, place_kind, longitude, latitude, address_text, search_text, is_landmark)
  on campus.slug = seeded.campus_slug
on conflict (slug) do update
set
  name = excluded.name,
  short_name = excluded.short_name,
  place_kind = excluded.place_kind,
  point = excluded.point,
  address_text = excluded.address_text,
  search_text = excluded.search_text,
  is_landmark = excluded.is_landmark,
  is_active = true;
