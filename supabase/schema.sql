
create table clients (id text primary key, name text, email text, service text, discovery jsonb, status text, payment_status text, created_at timestamp);
create table repos (id text primary key, client_id text, name text, url text, live_url text, status text);
create table proposals (id text primary key, client_id text, markdown text, price int, status text);
