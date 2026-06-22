-- ==========================================================================
-- Bondedd Map Shell Signals Migration
-- ==========================================================================
-- Adds share-weighted momentum and friend-event activity helper RPC.
-- ==========================================================================

alter table public.event_metrics
  add column if not exists shares_count integer not null default 0;

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
  shares_total integer;
begin
  select count(*) into bookmarks_total
  from public.event_bookmarks
  where event_id = target_event_id;

  select count(*) filter (where status = 'going'),
         count(*) filter (where status = 'interested')
  into going_total, interested_total
  from public.event_rsvps
  where event_id = target_event_id;

  select count(*) into shares_total
  from public.event_shares
  where event_id = target_event_id;

  insert into public.event_metrics (event_id, bookmarks_count, going_count, interested_count, shares_count, trending_score, updated_at)
  values (
    target_event_id,
    coalesce(bookmarks_total, 0),
    coalesce(going_total, 0),
    coalesce(interested_total, 0),
    coalesce(shares_total, 0),
    coalesce(bookmarks_total, 0) * 1.50
      + coalesce(going_total, 0) * 2.00
      + coalesce(interested_total, 0) * 0.75
      + coalesce(shares_total, 0) * 1.25,
    now()
  )
  on conflict (event_id) do update
  set
    bookmarks_count = excluded.bookmarks_count,
    going_count = excluded.going_count,
    interested_count = excluded.interested_count,
    shares_count = excluded.shares_count,
    trending_score = excluded.trending_score,
    updated_at = excluded.updated_at;
end;
$$;

drop trigger if exists event_shares_refresh_metrics on public.event_shares;
create trigger event_shares_refresh_metrics
after insert or delete on public.event_shares
for each row execute procedure public.handle_event_metric_change();

create or replace function public.get_friends_event_activity(
  p_campus_slug text default 'ut-dallas',
  p_event_ids uuid[] default null
)
returns table (
  event_id uuid,
  friend_count integer,
  friend_names text[],
  friend_avatar_urls text[],
  friend_share_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  with campus_target as (
    select campus.id
    from public.campuses campus
    where campus.slug = p_campus_slug
    limit 1
  ),
  friend_profiles as (
    select follow.following_id as profile_id
    from public.follows follow
    where follow.follower_id = auth.uid()
      and follow.status = 'accepted'
  ),
  friend_rsvps as (
    select
      rsvp.event_id,
      profile.id as profile_id,
      profile.full_name,
      profile.avatar_url
    from public.event_rsvps rsvp
    join friend_profiles friend on friend.profile_id = rsvp.profile_id
    join public.profiles profile on profile.id = rsvp.profile_id
    join public.events event on event.id = rsvp.event_id and event.status = 'published'
    left join campus_target on true
    where rsvp.status in ('going', 'interested')
      and rsvp.visibility in ('public', 'followers')
      and (campus_target.id is null or event.campus_id = campus_target.id)
      and (p_event_ids is null or rsvp.event_id = any(p_event_ids))
  ),
  friend_shares as (
    select
      share.event_id,
      count(*)::integer as share_count
    from public.event_shares share
    join friend_profiles friend on friend.profile_id = share.sender_id
    join public.events event on event.id = share.event_id and event.status = 'published'
    left join campus_target on true
    where (campus_target.id is null or event.campus_id = campus_target.id)
      and (p_event_ids is null or share.event_id = any(p_event_ids))
    group by share.event_id
  )
  select
    coalesce(friend_rsvps.event_id, friend_shares.event_id) as event_id,
    count(distinct friend_rsvps.profile_id)::integer as friend_count,
    coalesce(array_remove(array_agg(distinct friend_rsvps.full_name), null), '{}'::text[]) as friend_names,
    coalesce(array_remove(array_agg(distinct friend_rsvps.avatar_url), null), '{}'::text[]) as friend_avatar_urls,
    coalesce(max(friend_shares.share_count), 0)::integer as friend_share_count
  from friend_rsvps
  full join friend_shares
    on friend_shares.event_id = friend_rsvps.event_id
  group by coalesce(friend_rsvps.event_id, friend_shares.event_id);
$$;
