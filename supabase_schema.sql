-- Run this in your Supabase SQL Editor

create table if not exists conversations (
  id text primary key,
  start_time timestamptz not null,
  end_time timestamptz,
  duration float,
  tokens_used int default 0,
  latency int default 0,
  resolution_status text,
  cost float default 0,
  created_at timestamptz default now()
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  conversation_id text references conversations(id) on delete cascade,
  role text not null,
  text text not null,
  timestamp bigint,
  created_at timestamptz default now()
);

-- Enable RLS (Row Level Security) if you want to restrict access, 
-- but for now we'll allow public access or you can configure policies as needed.
-- alter table conversations enable row level security;
-- alter table messages enable row level security;
