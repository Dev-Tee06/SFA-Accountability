-- 1. Create a SECURITY DEFINER function to safely check admin status without triggering RLS
create or replace function public.is_admin()
returns boolean as $$
declare
  user_role text;
begin
  -- Fetch the role directly, bypassing RLS to avoid infinite recursion
  select role into user_role from public.profiles where id = auth.uid();
  return user_role = 'admin';
end;
$$ language plpgsql security definer;

-- 2. Drop the old recursive policies
drop policy if exists "Admins can view all profiles." on public.profiles;
drop policy if exists "Admins can view all schedules." on public.schedules;
drop policy if exists "Admins can view all prayer records." on public.prayer_records;
drop policy if exists "Admins can view all bible study records." on public.bible_study_records;

-- 3. Recreate the policies using the new non-recursive function
create policy "Admins can view all profiles." on public.profiles for select using (public.is_admin());
create policy "Admins can view all schedules." on public.schedules for select using (public.is_admin());
create policy "Admins can view all prayer records." on public.prayer_records for select using (public.is_admin());
create policy "Admins can view all bible study records." on public.bible_study_records for select using (public.is_admin());

-- 4. Function to claim admin role if none exists
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

-- 5. Trigger to prevent users from granting themselves admin access
create or replace function public.prevent_unauthorized_role_update()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    if current_setting('request.jwt.claims', true) is not null then
      if not public.is_admin() then
        new.role = old.role;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profile_update on public.profiles;

create trigger on_profile_update
  before update on public.profiles
  for each row execute procedure public.prevent_unauthorized_role_update();
