-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  email text not null,
  role text default 'member' check (role in ('member', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;
create policy "Users can view their own profile." on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles." on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- Function to claim admin role if none exists
create or replace function public.claim_admin_role()
returns void as $$
declare
  admin_count int;
begin
  select count(*) into admin_count from public.profiles where role = 'admin';
  
  if admin_count > 0 then
    raise exception 'An admin account already exists.';
  end if;

  update public.profiles set role = 'admin' where id = auth.uid();
end;
$$ language plpgsql security definer;

-- Trigger to prevent users from granting themselves admin access
create or replace function public.prevent_unauthorized_role_update()
returns trigger as $$
begin
  -- Only allow the claim_admin_role function (running as postgres) or actual admins to change the role
  if new.role is distinct from old.role then
    -- Check if it's a web request
    if current_setting('request.jwt.claims', true) is not null then
      -- If the user doing the update is not currently an admin, revert the role change
      if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
        new.role = old.role;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_profile_update
  before update on public.profiles
  for each row execute procedure public.prevent_unauthorized_role_update();

-- 2. Schedules Table
create table public.schedules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  prayer_time time not null default '06:00:00',
  bible_study_time time not null default '20:00:00',
  reminder_enabled boolean default true,
  timezone text default 'UTC',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for schedules
alter table public.schedules enable row level security;
create policy "Users can view their own schedule." on schedules for select using (auth.uid() = user_id);
create policy "Admins can view all schedules." on schedules for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can update their own schedule." on schedules for update using (auth.uid() = user_id);
create policy "Users can insert their own schedule." on schedules for insert with check (auth.uid() = user_id);

-- 3. Prayer Records
create table public.prayer_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  scheduled_time time not null,
  completed_at timestamp with time zone,
  status text not null default 'Pending' check (status in ('Pending', 'Completed', 'Missed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date)
);

-- Enable RLS for prayer_records
alter table public.prayer_records enable row level security;
create policy "Users can view their own prayer records." on prayer_records for select using (auth.uid() = user_id);
create policy "Admins can view all prayer records." on prayer_records for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can insert their own prayer records." on prayer_records for insert with check (auth.uid() = user_id);
create policy "Users can update their own prayer records." on prayer_records for update using (auth.uid() = user_id);

-- 4. Bible Study Records
create table public.bible_study_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  scheduled_time time not null,
  completed_at timestamp with time zone,
  status text not null default 'Pending' check (status in ('Pending', 'Completed', 'Missed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date)
);

-- Enable RLS for bible_study_records
alter table public.bible_study_records enable row level security;
create policy "Users can view their own bible study records." on bible_study_records for select using (auth.uid() = user_id);
create policy "Admins can view all bible study records." on bible_study_records for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can insert their own bible study records." on bible_study_records for insert with check (auth.uid() = user_id);
create policy "Users can update their own bible study records." on bible_study_records for update using (auth.uid() = user_id);

-- 5. Trigger to create profile and schedule on user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New User'), new.email);
  
  insert into public.schedules (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Force RLS
alter table public.profiles force row level security;
alter table public.schedules force row level security;
alter table public.prayer_records force row level security;
alter table public.bible_study_records force row level security;
