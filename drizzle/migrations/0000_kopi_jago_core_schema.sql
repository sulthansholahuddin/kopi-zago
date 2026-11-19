
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('admin', 'customer');
create type public.drink_size as enum ('small', 'medium', 'large');
create type public.order_status as enum ('pending','confirmed','processing','ready','on_delivery','completed','cancelled');
create type public.payment_status as enum ('pending','paid','failed','refunded');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text,
  phone text,
  birth_date date,
  legacy_user_id integer unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (name, phone, birth_date) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Users read own profile, admins read all" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- LEGACY USERS (server-only, used to link imported accounts)
create table public.legacy_users (
  legacy_id integer primary key,
  name text not null default '',
  email text not null,
  phone text,
  birth_date date,
  role text not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz,
  claimed_by uuid,
  claimed_at timestamptz
);
create unique index legacy_users_email_key on public.legacy_users (lower(email));
grant select on public.legacy_users to authenticated;
grant all on public.legacy_users to service_role;
alter table public.legacy_users enable row level security;
create policy "Admins read legacy users" on public.legacy_users for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ADMIN INVITES (server-only)
create table public.admin_invites (
  email text primary key,
  created_at timestamptz not null default now()
);
grant all on public.admin_invites to service_role;
alter table public.admin_invites enable row level security;

-- MENU
create table public.menu_categories (
  id serial primary key,
  name text not null,
  slug text not null unique
);
grant select on public.menu_categories to anon, authenticated;
grant insert, update, delete on public.menu_categories to authenticated;
grant all on public.menu_categories to service_role;
alter table public.menu_categories enable row level security;
create policy "Anyone reads categories" on public.menu_categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.menu_categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.menu_items (
  id serial primary key,
  category_id integer not null references public.menu_categories(id),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);
grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;
create policy "Anyone reads menu" on public.menu_items for select to anon, authenticated using (true);
create policy "Admins manage menu" on public.menu_items for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.menu_sizes (
  id serial primary key,
  menu_id integer not null references public.menu_items(id) on delete cascade,
  size public.drink_size not null,
  price numeric(12,2) not null check (price >= 0),
  unique (menu_id, size)
);
grant select on public.menu_sizes to anon, authenticated;
grant insert, update, delete on public.menu_sizes to authenticated;
grant all on public.menu_sizes to service_role;
alter table public.menu_sizes enable row level security;
create policy "Anyone reads sizes" on public.menu_sizes for select to anon, authenticated using (true);
create policy "Admins manage sizes" on public.menu_sizes for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Size prices follow the base price: small 80%, medium 100%, large 130% (rounded)
create or replace function public.sync_menu_sizes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.price is distinct from old.price then
    insert into public.menu_sizes (menu_id, size, price) values
      (new.id, 'small', round(new.price * 0.8)),
      (new.id, 'medium', new.price),
      (new.id, 'large', round(new.price * 1.3))
    on conflict (menu_id, size) do update set price = excluded.price;
  end if;
  return new;
end $$;
create trigger menu_items_sync_sizes after insert or update of price on public.menu_items
  for each row execute function public.sync_menu_sizes();

-- CART
create table public.cart_items (
  user_id uuid not null,
  menu_id integer not null references public.menu_items(id) on delete cascade,
  size public.drink_size not null default 'medium',
  qty smallint not null default 1 check (qty between 1 and 99),
  created_at timestamptz not null default now(),
  primary key (user_id, menu_id, size)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "Users manage own cart" on public.cart_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- WISHLIST
create table public.wishlist (
  id bigserial primary key,
  user_id uuid,
  legacy_user_id integer,
  menu_id integer not null references public.menu_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, menu_id)
);
grant select, insert, delete on public.wishlist to authenticated;
grant all on public.wishlist to service_role;
alter table public.wishlist enable row level security;
create policy "Users read own wishlist" on public.wishlist for select to authenticated using (user_id = auth.uid());
create policy "Users add to own wishlist" on public.wishlist for insert to authenticated with check (user_id = auth.uid());
create policy "Users remove from own wishlist" on public.wishlist for delete to authenticated using (user_id = auth.uid());

-- ORDERS
create table public.orders (
  id serial primary key,
  order_number text not null unique,
  user_id uuid,
  legacy_user_id integer,
  status public.order_status not null default 'pending',
  fulfillment_type text not null default 'pickup' check (fulfillment_type in ('pickup','delivery')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_method text not null default 'cash',
  payment_status public.payment_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Users read own orders, admins all" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.order_items (
  id bigserial primary key,
  order_id integer not null references public.orders(id) on delete cascade,
  menu_id integer references public.menu_items(id) on delete set null,
  name text not null,
  size public.drink_size not null default 'medium',
  qty smallint not null check (qty > 0),
  price numeric(12,2) not null
);
create index order_items_order_idx on public.order_items (order_id);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Users read own order items, admins all" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));

-- NOTIFICATIONS
create table public.notifications (
  id bigserial primary key,
  user_id uuid,
  legacy_user_id integer,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Users read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Users mark own notifications read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ENERGY
create table public.energy_rewards (
  id serial primary key,
  name text not null,
  description text,
  energy_cost integer not null check (energy_cost > 0),
  reward_type text not null check (reward_type in ('free_drink','discount','merchandise','voucher')),
  reward_value numeric(12,2),
  menu_id integer references public.menu_items(id) on delete set null,
  stock integer check (stock is null or stock >= 0),
  is_active boolean not null default true,
  terms text,
  created_at timestamptz not null default now()
);
grant select on public.energy_rewards to anon, authenticated;
grant insert, update, delete on public.energy_rewards to authenticated;
grant all on public.energy_rewards to service_role;
alter table public.energy_rewards enable row level security;
create policy "Anyone reads rewards" on public.energy_rewards for select to anon, authenticated using (true);
create policy "Admins manage rewards" on public.energy_rewards for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.energy_transactions (
  id bigserial primary key,
  user_id uuid,
  legacy_user_id integer,
  transaction_type text not null check (transaction_type in ('earn','redeem','admin_adjustment')),
  amount integer not null,
  source_type text not null check (source_type in ('order','qr_scan','reward_redemption','admin')),
  source_id bigint,
  description text,
  balance_after integer not null,
  created_at timestamptz not null default now()
);
create index energy_tx_user_idx on public.energy_transactions (user_id, created_at desc);
grant select on public.energy_transactions to authenticated;
grant all on public.energy_transactions to service_role;
alter table public.energy_transactions enable row level security;
create policy "Users read own energy, admins all" on public.energy_transactions for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.energy_redemptions (
  id bigserial primary key,
  user_id uuid,
  legacy_user_id integer,
  reward_id integer not null references public.energy_rewards(id),
  energy_cost integer not null,
  status text not null default 'pending' check (status in ('pending','approved','claimed','expired','cancelled')),
  redeemed_at timestamptz not null default now(),
  claimed_at timestamptz,
  expires_at timestamptz,
  notes text
);
grant select on public.energy_redemptions to authenticated;
grant all on public.energy_redemptions to service_role;
alter table public.energy_redemptions enable row level security;
create policy "Users read own redemptions, admins all" on public.energy_redemptions for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.qr_tokens (
  id bigserial primary key,
  token_hash text not null unique,
  created_by uuid,
  energy_amount integer not null default 10 check (energy_amount between 1 and 100),
  scan_limit integer not null default 1 check (scan_limit >= 1),
  scan_count integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
grant select on public.qr_tokens to authenticated;
grant all on public.qr_tokens to service_role;
alter table public.qr_tokens enable row level security;
create policy "Admins read QR tokens" on public.qr_tokens for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create table public.qr_scans (
  id bigserial primary key,
  qr_token_id bigint not null references public.qr_tokens(id) on delete cascade,
  user_id uuid not null,
  energy_awarded integer not null,
  scanned_at timestamptz not null default now(),
  unique (user_id, qr_token_id)
);
grant select on public.qr_scans to authenticated;
grant all on public.qr_scans to service_role;
alter table public.qr_scans enable row level security;
create policy "Users read own scans, admins all" on public.qr_scans for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- HELPERS
create or replace function public.notify_user(_user_id uuid, _title text, _message text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, title, message) select _user_id, _title, _message where _user_id is not null;
$$;
revoke execute on function public.notify_user(uuid, text, text) from public, anon, authenticated;

create or replace function public.energy_balance(_user_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount), 0)::int from public.energy_transactions where user_id = _user_id
$$;
revoke execute on function public.energy_balance(uuid) from public, anon;

-- NEW USER: profile + customer role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _bd date;
begin
  begin
    _bd := nullif(new.raw_user_meta_data->>'birth_date', '')::date;
  exception when others then _bd := null;
  end;
  insert into public.profiles (id, name, email, phone, birth_date)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email, '@', 1), ''),
    new.email,
    nullif(new.raw_user_meta_data->>'phone',''),
    _bd
  ) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- CLAIM: link old account data and admin invites for a verified email
create or replace function public.claim_account()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _email text;
  _confirmed timestamptz;
  _legacy public.legacy_users%rowtype;
  _linked boolean := false;
begin
  if _uid is null then raise exception 'Authentication required'; end if;
  select email, email_confirmed_at into _email, _confirmed from auth.users where id = _uid;
  if _email is null or _confirmed is null then
    return jsonb_build_object('linked', false, 'is_admin', public.has_role(_uid, 'admin'));
  end if;

  select * into _legacy from public.legacy_users
    where lower(email) = lower(_email) and claimed_by is null for update;
  if found then
    update public.legacy_users set claimed_by = _uid, claimed_at = now() where legacy_id = _legacy.legacy_id;
    update public.profiles set
      legacy_user_id = _legacy.legacy_id,
      name = case when coalesce(_legacy.name,'') <> '' then _legacy.name else name end,
      phone = coalesce(phone, _legacy.phone),
      birth_date = coalesce(birth_date, _legacy.birth_date)
    where id = _uid;
    update public.orders set user_id = _uid where legacy_user_id = _legacy.legacy_id and user_id is null;
    update public.notifications set user_id = _uid where legacy_user_id = _legacy.legacy_id and user_id is null;
    update public.energy_transactions set user_id = _uid where legacy_user_id = _legacy.legacy_id and user_id is null;
    update public.energy_redemptions set user_id = _uid where legacy_user_id = _legacy.legacy_id and user_id is null;
    update public.wishlist set user_id = _uid where legacy_user_id = _legacy.legacy_id and user_id is null;
    if _legacy.role = 'admin' then
      insert into public.user_roles (user_id, role) values (_uid, 'admin') on conflict do nothing;
    end if;
    _linked := true;
  end if;

  if exists (select 1 from public.admin_invites where lower(email) = lower(_email)) then
    insert into public.user_roles (user_id, role) values (_uid, 'admin') on conflict do nothing;
  end if;

  return jsonb_build_object('linked', _linked, 'is_admin', public.has_role(_uid, 'admin'));
end $$;
revoke execute on function public.claim_account() from public, anon;
grant execute on function public.claim_account() to authenticated;

-- ENERGY: earn when an order becomes completed (1 point per Rp1.000, minimum 10)
create or replace function public.award_energy_for_order()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _pts integer;
  _bal integer;
begin
  if new.user_id is null or new.status <> 'completed' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'completed' then return new; end if;
  if exists (select 1 from public.energy_transactions where source_type = 'order' and source_id = new.id) then return new; end if;
  _pts := greatest(floor(new.total_amount / 1000)::int, 10);
  _bal := public.energy_balance(new.user_id);
  insert into public.energy_transactions (user_id, transaction_type, amount, source_type, source_id, description, balance_after)
  values (new.user_id, 'earn', _pts, 'order', new.id, 'Order #' || new.order_number || ' completed', _bal + _pts);
  perform public.notify_user(new.user_id, 'Energy Earned!', 'Kamu dapat ' || _pts || ' Energy points dari order #' || new.order_number);
  return new;
end $$;
create trigger orders_award_energy after insert or update of status on public.orders
  for each row execute function public.award_energy_for_order();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- QRIS: cancel unpaid QRIS orders after 2 minutes and return stock
create or replace function public.cancel_expired_qris_orders()
returns integer language plpgsql security definer set search_path = public as $$
declare
  _o record;
  _n integer := 0;
begin
  for _o in
    select id, user_id, order_number from public.orders
    where payment_method = 'qris' and payment_status = 'pending' and status = 'pending'
      and created_at < now() - interval '2 minutes'
    for update skip locked
  loop
    update public.orders set status = 'cancelled' where id = _o.id;
    update public.menu_items m set stock = m.stock + oi.qty
      from public.order_items oi where oi.order_id = _o.id and oi.menu_id = m.id;
    perform public.notify_user(_o.user_id, 'Order Dibatalkan', 'Order ' || _o.order_number || ' dibatalkan karena pembayaran QRIS tidak diselesaikan dalam 2 menit.');
    _n := _n + 1;
  end loop;
  return _n;
end $$;
revoke execute on function public.cancel_expired_qris_orders() from public, anon;
grant execute on function public.cancel_expired_qris_orders() to authenticated;

-- CHECKOUT: create an order from the cart (prices come from the database)
create or replace function public.place_order(p_payment_method text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _sub numeric(12,2) := 0;
  _num text;
  _id integer;
  _is_bank boolean;
  _pay public.payment_status;
  _status public.order_status;
  _r record;
  _items jsonb := '[]'::jsonb;
begin
  if _uid is null then raise exception 'Authentication required'; end if;
  if p_payment_method not in ('cash','qris','bank_transfer','ewallet','bca','bni','bri','mandiri','bsi','seabank') then
    raise exception 'Metode bayar tidak valid';
  end if;
  perform public.cancel_expired_qris_orders();

  perform 1 from public.cart_items where user_id = _uid;
  if not found then raise exception 'Keranjang kosong'; end if;

  for _r in
    select c.menu_id, c.size, c.qty, m.name, m.stock, coalesce(s.price, m.price) as price
    from public.cart_items c
    join public.menu_items m on m.id = c.menu_id and m.is_available
    left join public.menu_sizes s on s.menu_id = c.menu_id and s.size = c.size
    where c.user_id = _uid
    for update of m
  loop
    if _r.stock < _r.qty then raise exception 'Stok % tidak mencukupi', _r.name; end if;
    _sub := _sub + _r.qty * _r.price;
  end loop;
  if _sub = 0 then raise exception 'Keranjang kosong'; end if;

  _is_bank := p_payment_method in ('bca','bni','bri','mandiri','bsi','seabank','bank_transfer');
  _pay := case when _is_bank then 'paid' else 'pending' end;
  _status := case when _is_bank then 'completed' else 'pending' end;
  _num := 'INV-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDDHH24MISS') || '-' || substr(encode(extensions.gen_random_bytes(3), 'hex'), 1, 6);

  insert into public.orders (order_number, user_id, status, fulfillment_type, subtotal, discount_amount, shipping_cost, total_amount, payment_method, payment_status)
  values (_num, _uid, 'pending', 'pickup', _sub, 0, 0, _sub, p_payment_method, _pay)
  returning id into _id;

  for _r in
    select c.menu_id, c.size, c.qty, m.name, coalesce(s.price, m.price) as price
    from public.cart_items c
    join public.menu_items m on m.id = c.menu_id and m.is_available
    left join public.menu_sizes s on s.menu_id = c.menu_id and s.size = c.size
    where c.user_id = _uid
  loop
    insert into public.order_items (order_id, menu_id, name, size, qty, price) values (_id, _r.menu_id, _r.name, _r.size, _r.qty, _r.price);
    update public.menu_items set stock = stock - _r.qty where id = _r.menu_id;
    _items := _items || jsonb_build_object('menu_id', _r.menu_id, 'name', _r.name, 'size', _r.size, 'qty', _r.qty, 'price', _r.price, 'subtotal', _r.qty * _r.price);
  end loop;

  if _status = 'completed' then
    update public.orders set status = 'completed' where id = _id;
  end if;

  delete from public.cart_items where user_id = _uid;
  perform public.notify_user(_uid, 'Order dibuat', 'Order ' || _num || ' berhasil dibuat.');

  return (select jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status, 'fulfillment_type', o.fulfillment_type,
    'subtotal', o.subtotal, 'shipping_cost', o.shipping_cost, 'total_amount', o.total_amount,
    'payment_method', o.payment_method, 'payment_status', o.payment_status, 'created_at', o.created_at, 'items', _items)
    from public.orders o where o.id = _id);
end $$;
revoke execute on function public.place_order(text) from public, anon;
grant execute on function public.place_order(text) to authenticated;

-- DEMO PAYMENT: confirm a pending QRIS payment (simulation, no real money)
create or replace function public.confirm_qris_payment(p_order_id integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _o public.orders%rowtype;
begin
  perform public.cancel_expired_qris_orders();
  select * into _o from public.orders where id = p_order_id and user_id = _uid for update;
  if not found then raise exception 'Order tidak ditemukan'; end if;
  if _o.payment_status = 'paid' then raise exception 'Order sudah dibayar'; end if;
  if _o.status = 'cancelled' then raise exception 'Order sudah dibatalkan'; end if;
  update public.orders set payment_status = 'paid' where id = p_order_id;
  perform public.notify_user(_uid, 'Pembayaran Berhasil', 'Pembayaran untuk order ' || _o.order_number || ' telah berhasil (SIMULASI).');
  return jsonb_build_object('order_id', p_order_id, 'payment_status', 'paid');
end $$;
revoke execute on function public.confirm_qris_payment(integer) from public, anon;
grant execute on function public.confirm_qris_payment(integer) to authenticated;

-- CANCEL: customer (own) or admin, only while pending/confirmed; returns stock
create or replace function public.cancel_order(p_order_id integer)
returns void language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _o public.orders%rowtype;
begin
  select * into _o from public.orders where id = p_order_id for update;
  if not found or (_o.user_id is distinct from _uid and not public.has_role(_uid, 'admin')) then
    raise exception 'Order tidak ditemukan';
  end if;
  if _o.status not in ('pending','confirmed') then raise exception 'Order tidak dapat dibatalkan'; end if;
  update public.orders set status = 'cancelled' where id = p_order_id;
  update public.menu_items m set stock = m.stock + oi.qty from public.order_items oi where oi.order_id = p_order_id and oi.menu_id = m.id;
  perform public.notify_user(_o.user_id, 'Order dibatalkan', 'Order ' || _o.order_number || ' telah dibatalkan.');
end $$;
revoke execute on function public.cancel_order(integer) from public, anon;
grant execute on function public.cancel_order(integer) to authenticated;

-- ADMIN: order status transitions
create or replace function public.admin_set_order_status(p_order_id integer, p_status public.order_status)
returns void language plpgsql security definer set search_path = public as $$
declare
  _o public.orders%rowtype;
  _ok boolean;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  select * into _o from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order tidak ditemukan'; end if;
  _ok := case _o.status
    when 'pending' then p_status in ('confirmed','cancelled')
    when 'confirmed' then p_status in ('processing','cancelled')
    when 'processing' then p_status in ('ready','cancelled')
    when 'ready' then p_status in ('on_delivery','completed')
    when 'on_delivery' then p_status in ('completed')
    else false end;
  if not _ok then raise exception 'Transisi status tidak valid'; end if;
  if p_status = 'cancelled' then
    update public.menu_items m set stock = m.stock + oi.qty from public.order_items oi where oi.order_id = p_order_id and oi.menu_id = m.id;
  end if;
  update public.orders set status = p_status where id = p_order_id;
  perform public.notify_user(_o.user_id, 'Status order diperbarui', 'Order ' || _o.order_number || ' sekarang ' || p_status || '.');
end $$;
revoke execute on function public.admin_set_order_status(integer, public.order_status) from public, anon;
grant execute on function public.admin_set_order_status(integer, public.order_status) to authenticated;

create or replace function public.admin_set_payment_status(p_order_id integer, p_status public.payment_status)
returns void language plpgsql security definer set search_path = public as $$
declare
  _o public.orders%rowtype;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  update public.orders set payment_status = p_status where id = p_order_id returning * into _o;
  if not found then raise exception 'Order tidak ditemukan'; end if;
  perform public.notify_user(_o.user_id, 'Status pembayaran diperbarui', 'Pembayaran order ' || _o.order_number || ' berstatus ' || p_status || '.');
end $$;
revoke execute on function public.admin_set_payment_status(integer, public.payment_status) from public, anon;
grant execute on function public.admin_set_payment_status(integer, public.payment_status) to authenticated;

-- ENERGY: redeem a reward
create or replace function public.redeem_reward(p_reward_id integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _r public.energy_rewards%rowtype;
  _bal integer;
  _rid bigint;
begin
  if _uid is null then raise exception 'Authentication required'; end if;
  select * into _r from public.energy_rewards where id = p_reward_id and is_active for update;
  if not found then raise exception 'Reward tidak ditemukan'; end if;
  if _r.stock is not null and _r.stock < 1 then raise exception 'Stok reward habis'; end if;
  perform pg_advisory_xact_lock(hashtext(_uid::text));
  _bal := public.energy_balance(_uid);
  if _bal < _r.energy_cost then raise exception 'Energy tidak cukup. Dibutuhkan % points', _r.energy_cost; end if;
  insert into public.energy_transactions (user_id, transaction_type, amount, source_type, source_id, description, balance_after)
  values (_uid, 'redeem', -_r.energy_cost, 'reward_redemption', _r.id, 'Redeem: ' || _r.name, _bal - _r.energy_cost);
  insert into public.energy_redemptions (user_id, reward_id, energy_cost, status, expires_at)
  values (_uid, _r.id, _r.energy_cost, 'approved', now() + interval '30 days') returning id into _rid;
  if _r.stock is not null then update public.energy_rewards set stock = stock - 1 where id = _r.id; end if;
  perform public.notify_user(_uid, 'Reward Ditukar!', 'Berhasil menukar ' || _r.name || ' dengan ' || _r.energy_cost || ' Energy points.');
  return jsonb_build_object('redemption_id', _rid, 'new_balance', _bal - _r.energy_cost);
end $$;
revoke execute on function public.redeem_reward(integer) from public, anon;
grant execute on function public.redeem_reward(integer) to authenticated;

-- ENERGY: scan a QR code
create or replace function public.scan_qr(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _q public.qr_tokens%rowtype;
  _bal integer;
begin
  if _uid is null then raise exception 'Authentication required'; end if;
  if coalesce(trim(p_token), '') = '' then raise exception 'QR token wajib diisi'; end if;
  select * into _q from public.qr_tokens
    where token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex') and expires_at > now() for update;
  if not found then raise exception 'QR code tidak valid atau kedaluwarsa'; end if;
  if _q.scan_count >= _q.scan_limit then raise exception 'QR code sudah mencapai batas scan'; end if;
  if exists (select 1 from public.qr_scans where qr_token_id = _q.id and user_id = _uid) then raise exception 'Kamu sudah scan QR code ini'; end if;
  perform pg_advisory_xact_lock(hashtext(_uid::text));
  _bal := public.energy_balance(_uid);
  insert into public.energy_transactions (user_id, transaction_type, amount, source_type, source_id, description, balance_after)
  values (_uid, 'earn', _q.energy_amount, 'qr_scan', _q.id, 'QR Scan', _bal + _q.energy_amount);
  insert into public.qr_scans (qr_token_id, user_id, energy_awarded) values (_q.id, _uid, _q.energy_amount);
  update public.qr_tokens set scan_count = scan_count + 1 where id = _q.id;
  perform public.notify_user(_uid, 'Energy Earned!', 'Kamu dapat ' || _q.energy_amount || ' Energy points dari QR scan!');
  return jsonb_build_object('energy_awarded', _q.energy_amount, 'new_balance', _bal + _q.energy_amount);
end $$;
revoke execute on function public.scan_qr(text) from public, anon;
grant execute on function public.scan_qr(text) to authenticated;

-- ADMIN: create a QR token (stores only the hash)
create or replace function public.admin_create_qr_token(p_token text, p_energy integer, p_scan_limit integer, p_hours integer)
returns bigint language plpgsql security definer set search_path = public as $$
declare _id bigint;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  if coalesce(trim(p_token), '') = '' then raise exception 'Token wajib diisi'; end if;
  if p_energy < 1 or p_energy > 100 then raise exception 'Energy amount harus 1-100'; end if;
  if p_scan_limit < 1 then raise exception 'Scan limit minimal 1'; end if;
  if p_hours < 1 then raise exception 'Masa berlaku minimal 1 jam'; end if;
  insert into public.qr_tokens (token_hash, created_by, energy_amount, scan_limit, expires_at)
  values (encode(extensions.digest(trim(p_token), 'sha256'), 'hex'), auth.uid(), p_energy, p_scan_limit, now() + make_interval(hours => p_hours))
  returning id into _id;
  return _id;
end $$;
revoke execute on function public.admin_create_qr_token(text, integer, integer, integer) from public, anon;
grant execute on function public.admin_create_qr_token(text, integer, integer, integer) to authenticated;

-- SEED: menu (from source seed.sql + seed_update_pricing.sql)
insert into public.menu_categories (id, name, slug) values (1, 'Kopi', 'kopi'), (2, 'Non Kopi', 'non-kopi');
select setval('public.menu_categories_id_seq', 2);

insert into public.menu_items (category_id, name, description, price, image_url, is_featured, stock) values
  (1, 'Kopi Jago Signature', 'Kopi susu gula aren khas Kopi Jago', 8000, '/__l5e/assets-v1/3a97e07f-0eb0-4604-9269-b4fd4c9622ad/kopi-susu-jago.jpg', true, 100),
  (1, 'Kopi Susu Vanilla', 'Kopi susu vanilla', 8000, '/__l5e/assets-v1/3a97e07f-0eb0-4604-9269-b4fd4c9622ad/kopi-susu-jago.jpg', false, 100),
  (1, 'Americano', 'Espresso dan air', 8000, '/__l5e/assets-v1/75b4a87f-85b8-4aa3-a5e3-e15e317a942e/americano.jpg', false, 100),
  (1, 'Citrus Cold Brew', 'Cold brew dengan citrus segar', 10000, '/__l5e/assets-v1/b193df74-3dcc-4002-8fd5-6e45bfec1746/citrus-cold-brew.jpg', false, 100),
  (2, 'Chocolate Latte', 'Cokelat dan susu', 12000, '/__l5e/assets-v1/86ad8fc3-d436-436e-9b02-1592de8ba5d6/jago-coklat.jpg', true, 100),
  (2, 'Pink Coco', 'Minuman segar coconut strawberry', 12000, '/__l5e/assets-v1/466b2c28-8679-4ea2-9a0b-52db916c4141/pink-coco.jpg', true, 100),
  (2, 'Mont Blanc Shake', 'Milkshake cokelat premium', 15000, '/__l5e/assets-v1/bbffe84d-ec57-4a90-85a4-ecae33717bda/mont-blanc.jpg', false, 100),
  (2, 'Matcha Latte', 'Green tea latte Jepang', 12000, '/__l5e/assets-v1/abbcc8f5-d9e4-4662-8b60-c70910c9d54c/matcha-latte.jpg', true, 100);

insert into public.energy_rewards (name, description, energy_cost, reward_type, reward_value, menu_id) values
  ('Diskon Rp 5.000', 'Potongan harga Rp 5.000 untuk pembelian berikutnya', 50, 'discount', 5000, null),
  ('Diskon Rp 10.000', 'Potongan harga Rp 10.000 untuk pembelian berikutnya', 100, 'discount', 10000, null),
  ('Free Americano', 'Gratis 1 cup Americano (Medium)', 150, 'free_drink', null, (select id from public.menu_items where name = 'Americano')),
  ('Free Kopi Susu Jago', 'Gratis 1 cup Kopi Susu Jago (Medium)', 200, 'free_drink', null, (select id from public.menu_items where name = 'Kopi Jago Signature')),
  ('Tumbler Jago Coffee', 'Tumbler eksklusif Jago Coffee 500ml', 500, 'merchandise', null, null),
  ('T-Shirt Jago Coffee', 'Kaos eksklusif Jago Coffee (Size M/L/XL)', 800, 'merchandise', null, null);
