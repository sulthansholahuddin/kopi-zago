-- Kopi Jago: create the admin account admin@kopijago.com
-- Password: KopiJago#Admin2026
-- Paste everything into Cloud -> Database -> SQL editor and click Run.
-- Safe to run more than once: if the account already exists, it only resets
-- the password, confirms the email and makes sure it has the admin role.

do $$
declare
  _email text := 'admin@kopijago.com';
  _password text := 'KopiJago#Admin2026';
  _uid uuid;
begin
  select id into _uid from auth.users where lower(email) = lower(_email);

  if _uid is null then
    _uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', _uid, 'authenticated', 'authenticated',
      _email, extensions.crypt(_password, extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Admin Kopi Jago"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), _uid::text, _uid,
      jsonb_build_object('sub', _uid::text, 'email', _email, 'email_verified', true),
      'email', now(), now(), now()
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = _uid;
  end if;

  -- Profile (normally made automatically when the account is created)
  insert into public.profiles (id, name, email)
  values (_uid, 'Admin Kopi Jago', _email)
  on conflict (id) do nothing;

  -- Admin role (kept in its own table, never on the profile)
  insert into public.user_roles (user_id, role) values (_uid, 'admin')
  on conflict do nothing;

  -- Keep the email on the admin invite list too
  insert into public.admin_invites (email) values (_email)
  on conflict do nothing;
end $$;

-- Check: should show one row with role = admin
select u.email, u.email_confirmed_at is not null as confirmed, r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
where lower(u.email) = 'admin@kopijago.com';
