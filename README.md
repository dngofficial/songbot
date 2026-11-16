# songbot

Discord bot for looking up songs and requesting new ones. Song data lives in Supabase.

## Commands

| Command | Who | What it does |
| --- | --- | --- |
| `/songinfo song:<name>` | everyone | Shows BPM, sample rate, encoder, trivia and image for a song |
| `/request_song ...` | everyone | Adds a song to the pending queue |
| `/see_requests` | reviewer role | Approve or deny pending requests one at a time |

## Setup

1. Install Node.js 22 or newer, then run `npm ci`.
2. Copy `.env.example` to `.env` and fill it in.
3. Create the Supabase tables below if needed. Run [`sql/song_request_workflow.sql`](sql/song_request_workflow.sql) in the Supabase SQL Editor for both new and existing databases.
4. `npm run deploy` registers the slash commands. Re-run it whenever a command's options change.
5. `npm start`

Optional: `npm run seed` loads `data/songs.seed.json` into the `songs` table.

## Supabase tables

The `id` is the slug of the title (`"Black Knife"` becomes `black-knife`). If you already have the tables, run only the workflow SQL in step 3. It adds a review token to existing requests and makes each approval or denial a single database transaction.

```sql
create table public.songs (
  id           text primary key,
  title        text not null,
  bpm          integer,
  sample_rate  text,
  encoder      text,
  url          text,
  trivia       text,
  image        text,
  requested_by text
);

create table public.song_requests (like public.songs including all);

alter table public.songs enable row level security;
alter table public.song_requests enable row level security;

grant select, insert, update on public.songs to service_role;
grant select, insert, delete on public.song_requests to service_role;
```

Use a server-side `service_role` key for `SUPABASE_KEY`. If you use a publishable key, grant the same table privileges to `anon` and configure matching RLS policies. The workflow functions use the caller's permissions.

## Layout

```
src/
  index.js              client setup, loads commands + events
  deploy-commands.js    registers slash commands (npm run deploy)
  config.js             reads and validates .env
  commands/songs/       one file per slash command (sub-folders are picked up automatically)
  events/               ready, interactionCreate
  lib/                  supabase client, song queries, embed builder, validation
scripts/seed-songs.js   one-off data seeding
data/songs.seed.json    seed data
assets/                 static images
sql/                    request workflow migration
```
