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
