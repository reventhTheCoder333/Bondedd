-- ==========================================================================
-- Bondedd Social System Migration
-- ==========================================================================
-- Adds: follows, event_invites, event_shares, event_access_requests,
--       notifications
-- Alters: event_rsvps (adds visibility column)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. Helper function: check if viewer follows target with accepted status
-- --------------------------------------------------------------------------

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

-- --------------------------------------------------------------------------
-- 2. ALTER event_rsvps: add visibility column
-- --------------------------------------------------------------------------

alter table public.event_rsvps
  add column if not exists visibility text not null default 'public';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'event_rsvps_visibility_check'
  ) then
    alter table public.event_rsvps
      add constraint event_rsvps_visibility_check
      check (visibility in ('public', 'followers', 'private'));
  end if;
end $$;

-- --------------------------------------------------------------------------
-- 3. follows
-- --------------------------------------------------------------------------

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

create index if not exists idx_follows_follower_id on public.follows (follower_id);
create index if not exists idx_follows_following_id on public.follows (following_id);
create index if not exists idx_follows_status on public.follows (status);

-- --------------------------------------------------------------------------
-- 4. event_invites
-- --------------------------------------------------------------------------

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

create index if not exists idx_event_invites_recipient_status
  on public.event_invites (recipient_id, status);
create index if not exists idx_event_invites_sender_id
  on public.event_invites (sender_id);
create index if not exists idx_event_invites_event_id
  on public.event_invites (event_id);

-- --------------------------------------------------------------------------
-- 5. event_shares
-- --------------------------------------------------------------------------

create table if not exists public.event_shares (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_shares_recipient_id
  on public.event_shares (recipient_id);
create index if not exists idx_event_shares_sender_id
  on public.event_shares (sender_id);
create index if not exists idx_event_shares_event_id
  on public.event_shares (event_id);

-- --------------------------------------------------------------------------
-- 6. event_access_requests
-- --------------------------------------------------------------------------

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

create index if not exists idx_event_access_requests_host_status
  on public.event_access_requests (host_id, status);
create index if not exists idx_event_access_requests_requester_id
  on public.event_access_requests (requester_id);
create index if not exists idx_event_access_requests_event_id
  on public.event_access_requests (event_id);

-- --------------------------------------------------------------------------
-- 7. notifications
-- --------------------------------------------------------------------------

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

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_user_unread
  on public.notifications (user_id) where read_at is null;

-- --------------------------------------------------------------------------
-- 8. Enable row-level security on new tables
-- --------------------------------------------------------------------------

alter table public.follows enable row level security;
alter table public.event_invites enable row level security;
alter table public.event_shares enable row level security;
alter table public.event_access_requests enable row level security;
alter table public.notifications enable row level security;

-- --------------------------------------------------------------------------
-- 9. RLS policies: follows
-- --------------------------------------------------------------------------

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

-- --------------------------------------------------------------------------
-- 10. RLS policies: event_rsvps (additional visibility for social layer)
--     The existing "users can manage rsvps" policy (for all, profile_id)
--     remains untouched. These additional SELECT policies are OR'd with it
--     by Supabase, allowing other users to see public/follower RSVPs.
-- --------------------------------------------------------------------------

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

-- --------------------------------------------------------------------------
-- 11. RLS policies: event_invites
-- --------------------------------------------------------------------------

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

-- --------------------------------------------------------------------------
-- 12. RLS policies: event_shares
-- --------------------------------------------------------------------------

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

-- --------------------------------------------------------------------------
-- 13. RLS policies: event_access_requests
-- --------------------------------------------------------------------------

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

-- --------------------------------------------------------------------------
-- 14. RLS policies: notifications
-- --------------------------------------------------------------------------

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
