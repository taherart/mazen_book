import "server-only";
import { db } from "./db";

/**
 * Schema changes, applied in order at server start (see instrumentation.ts). Never edit one that
 * has shipped: add a new entry instead.
 */
const MIGRATIONS: { id: number; sql: string }[] = [
  {
    id: 1,
    sql: `
      create table users (
        id uuid primary key default gen_random_uuid(),
        email text not null,
        name text not null,
        password_hash text not null,
        intents text[] not null default '{}',
        created_at timestamptz not null default now()
      );
      create unique index users_email_key on users (lower(email));

      -- id is the SHA-256 of the cookie token, so a leaked table cannot be replayed as cookies
      create table sessions (
        id text primary key,
        user_id uuid not null references users (id) on delete cascade,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null
      );
      create index sessions_user_id_idx on sessions (user_id);
      create index sessions_expires_at_idx on sessions (expires_at);
    `,
  },
  {
    id: 2,
    sql: `
      -- one row per member per method they joined; the write-up is the raffle entry
      create table challenges (
        user_id uuid not null references users (id) on delete cascade,
        method smallint not null check (method between 1 and 52),
        joined_at timestamptz not null default now(),
        done smallint[] not null default '{}',
        note text not null default '' check (length(note) <= 5000),
        submitted_at timestamptz,
        entry text not null default 'pending' check (entry in ('pending', 'eligible', 'rejected')),
        primary key (user_id, method)
      );
      create index challenges_method_submitted_idx on challenges (method, submitted_at) where submitted_at is not null;
    `,
  },
  {
    id: 3,
    sql: `
      -- what members publish: nothing shows publicly until an admin approves it
      create table stories (
        id uuid primary key,
        user_id uuid not null references users (id) on delete cascade,
        method smallint not null check (method between 1 and 52),
        title text not null,
        author text not null,
        city text,
        body text not null,
        duration text not null,
        cost integer check (cost >= 0),
        income integer check (income >= 0),
        outcome text not null check (outcome in ('worked', 'partly', 'didnt')),
        challenges text not null,
        tips text[] not null,
        media text not null check (media in ('video', 'images', 'none')),
        status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
        created_at timestamptz not null default now(),
        reviewed_at timestamptz
      );
      create index stories_status_idx on stories (status, created_at desc);

      create table providers (
        id uuid primary key,
        user_id uuid not null references users (id) on delete cascade,
        methods smallint[] not null,
        name text not null,
        headline text not null,
        bio text not null,
        services text[] not null,
        portfolio jsonb not null default '[]',
        price_from integer check (price_from >= 0),
        price_note text,
        city text not null,
        remote boolean not null default false,
        contact_kind text not null check (contact_kind in ('whatsapp', 'link', 'email')),
        contact_value text not null,
        status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
        created_at timestamptz not null default now(),
        reviewed_at timestamptz
      );
      create index providers_status_idx on providers (status, created_at desc);

      create table contact_requests (
        id uuid primary key default gen_random_uuid(),
        provider_id uuid not null references providers (id) on delete cascade,
        from_user_id uuid references users (id) on delete set null,
        name text not null,
        contact text not null,
        message text not null,
        created_at timestamptz not null default now()
      );
      create index contact_requests_provider_idx on contact_requests (provider_id, created_at desc);

      create table helpful (
        user_id uuid not null references users (id) on delete cascade,
        story_id uuid not null references stories (id) on delete cascade,
        primary key (user_id, story_id)
      );

      create table reports (
        id uuid primary key default gen_random_uuid(),
        kind text not null check (kind in ('story', 'provider')),
        target_id uuid not null,
        target_title text not null,
        reason text not null,
        reporter_id uuid references users (id) on delete set null,
        created_at timestamptz not null default now(),
        resolved boolean not null default false
      );
    `,
  },
  {
    id: 4,
    sql: `
      -- the team's settings and result for one week's draw; no row = the calendar method, no prize yet
      create table weeks (
        starts_at timestamptz primary key,
        week smallint not null check (week between 1 and 52),
        method smallint check (method between 1 and 52),
        prize text not null default '' check (char_length(prize) <= 200),
        winner_id uuid references users (id) on delete set null,
        winner_name text,
        drawn_at timestamptz,
        announced boolean not null default false
      );

      -- every draw, announcement and undo, so a result can be checked afterwards; only ever appended
      create table raffle_events (
        id bigint generated always as identity primary key,
        week_starts_at timestamptz not null,
        action text not null check (action in ('draw', 'announce', 'withdraw', 'cancel')),
        method smallint not null,
        candidates uuid[] not null default '{}',
        winner_id uuid,
        winner_name text,
        admin_id uuid references users (id) on delete set null,
        admin_email text not null,
        created_at timestamptz not null default now()
      );
      create index raffle_events_week_idx on raffle_events (week_starts_at, created_at);
    `,
  },
  {
    id: 5,
    sql: `
      -- a password-reset link: id is the SHA-256 of the token in the link, good for one hour, once
      create table password_resets (
        id text primary key,
        user_id uuid not null references users (id) on delete cascade,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null,
        used_at timestamptz
      );
      create index password_resets_user_idx on password_resets (user_id);
    `,
  },
  {
    id: 6,
    sql: `
      -- opening methods step by step (lib/access.ts has the rules)
      alter table users
        add column invite_code text not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
        add column invited_by uuid references users (id) on delete set null,
        add column book_owner boolean not null default false;
      create unique index users_invite_code_key on users (invite_code);
      create index users_invited_by_idx on users (invited_by) where invited_by is not null;

      -- the member's answers; the consent they gave is the row itself (no row without it)
      create table surveys (
        user_id uuid primary key references users (id) on delete cascade,
        capital text not null check (capital in ('zero', 'low', 'high')),
        time_band text not null check (time_band in ('week', 'month', 'more')),
        place text not null check (place in ('home', 'field', 'both')),
        level smallint not null check (level between 1 and 3),
        goal text not null check (goal in ('side', 'main', 'skill', 'explore')),
        created_at timestamptz not null default now()
      );

      -- a method a member opened: 'survey' rows are the fitted picks, 'credit' rows cost one credit
      create table unlocks (
        user_id uuid not null references users (id) on delete cascade,
        method smallint not null check (method between 1 and 52),
        source text not null check (source in ('survey', 'credit')),
        created_at timestamptz not null default now(),
        primary key (user_id, method)
      );

      -- a reader's opinion of a method they tried: the stars are public as an average, the comment goes to the author
      create table ratings (
        user_id uuid not null references users (id) on delete cascade,
        method smallint not null check (method between 1 and 52),
        stars smallint not null check (stars between 1 and 5),
        comment text not null default '' check (char_length(comment) <= 300),
        created_at timestamptz not null default now(),
        primary key (user_id, method)
      );
      create index ratings_method_idx on ratings (method);

      -- small site-wide values the team sets from the admin pages (the book code)
      create table settings (
        key text primary key,
        value text not null
      );
    `,
  },
];

export async function migrate() {
  const sql = db();
  await sql.begin(async (tx) => {
    // one server at a time, even if two start together
    await tx`select pg_advisory_xact_lock(5252)`;
    await tx`create table if not exists schema_migrations (id integer primary key, applied_at timestamptz not null default now())`;
    const done = new Set((await tx<{ id: number }[]>`select id from schema_migrations`).map((r) => r.id));
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      await tx.unsafe(m.sql);
      await tx`insert into schema_migrations (id) values (${m.id})`;
      console.log(`migration ${m.id} applied`);
    }
  });
}
