-- ============================================================
--  AniSticker – Supabase Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Users ────────────────────────────────────────────────────
create table if not exists users (
  id           bigint primary key,          -- Telegram user_id
  username     text,
  first_name   text,
  last_name    text,
  photo_url    text,
  role         text not null default 'user'
                 check (role in ('owner','reseller','user')),
  is_banned    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ── Categories ───────────────────────────────────────────────
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── Designs ──────────────────────────────────────────────────
create table if not exists designs (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid references categories(id) on delete set null,
  type            text not null check (type in ('regular','adaptive')),
  file_url        text,                -- Supabase Storage URL
  file_type       text check (file_type in ('json','tgs')),
  primary_color   text,                -- hex e.g. #FF5733
  secondary_color text,
  has_text        boolean not null default false,
  user_price      numeric(10,2) not null default 0,
  reseller_price  numeric(10,2) not null default 0,
  is_visible      boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ── Payment Methods ──────────────────────────────────────────
create table if not exists payment_methods (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  logo_url       text,
  account_name   text,
  account_number text,
  is_visible     boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ── Saved Logos ──────────────────────────────────────────────
create table if not exists logos (
  id         uuid primary key default gen_random_uuid(),
  user_id    bigint not null references users(id) on delete cascade,
  name       text,
  symbol     text,
  file_url   text,
  file_type  text,
  created_at timestamptz not null default now()
);

-- ── Orders ───────────────────────────────────────────────────
create table if not exists orders (
  id                     uuid primary key default gen_random_uuid(),
  user_id                bigint not null references users(id),
  status                 text not null default 'pending'
                           check (status in ('pending','accepted','cancelled','done')),
  payment_method_id      uuid references payment_methods(id),
  transaction_image_url  text,
  total_price            numeric(10,2) not null default 0,

  -- Logo info snapshot
  logo_type    text check (logo_type in ('existing','new')),
  logo_id      uuid references logos(id),
  logo_name    text,
  logo_symbol  text,
  logo_file_url text,

  -- Global customisation
  add_username    boolean not null default false,
  tg_username     text,
  primary_color   text,
  secondary_color text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Order Items ──────────────────────────────────────────────
create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  design_id     uuid not null references designs(id),
  primary_color   text,
  secondary_color text,
  extra_colors    jsonb default '[]'::jsonb,  -- [{label,hex}]
  custom_text     text,
  created_at      timestamptz not null default now()
);

-- ── Auto-update orders.updated_at ────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on orders
  for each row execute procedure touch_updated_at();

-- ============================================================
--  Row-Level Security  (all enforced; backend uses service key)
-- ============================================================
alter table users           enable row level security;
alter table categories      enable row level security;
alter table designs         enable row level security;
alter table payment_methods enable row level security;
alter table logos           enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;

-- Service role bypasses RLS – backend always uses service key
-- No anon/authenticated policies needed since we don't expose
-- Supabase directly to the frontend.
