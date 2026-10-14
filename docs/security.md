# Security

Review of the front-end build and its deployment, what was fixed, what is accepted for the demo,
and what the backend phase must add before real accounts go live.

## What the app is today

Every page is public and read-only. Accounts, stories, providers and raffle entries live in the
visitor's own browser (`localStorage`); nothing a visitor types reaches the server. That keeps the
attack surface small: no database, no sessions, no uploads, no server-side forms.

## Findings and fixes

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| 1 | Medium | **Open redirect after sign-in.** `?next=/\evil.com` and `?next=/<tab>/evil.com` passed the "starts with `/`, not `//`" check; browsers resolve both to another origin. A link to the real login page could send people to a look-alike site | `lib/safe-url.ts` parses the value and only keeps a path on this origin; tested against 8 bypass payloads |
| 2 | Low | Provider contact and portfolio links were validated only in the form. A tampered record (or, later, a bad server record) could become a `javascript:` or `data:` link | Re-checked where they render: only `http(s)` URLs and plain email addresses become links (`safeHttpUrl`, `safeMailto`) |
| 3 | Low | No security headers | CSP, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` on every response; HSTS and `upgrade-insecure-requests` from Caddy on HTTPS; `X-Powered-By`, `Server` and `Via` removed |
| 4 | Low | Containers ran with default privileges | Non-root, read-only root filesystem, all Linux capabilities dropped (Caddy keeps only `NET_BIND_SERVICE`), `no-new-privileges`, memory and process limits, health check, log rotation |
| 5 | Low | Every port of the server reachable | Hostinger network firewall: only 22 (SSH), 80, 443 (TCP and UDP) accepted |
| 6 | Info | Member and admin screens indexable | `robots.txt` disallows them; they were already `noindex` |

Checked and clean: no secrets anywhere in the git history; no `dangerouslySetInnerHTML` with user
data (the only one is a fixed pre-paint script); `window.open` uses `noopener,noreferrer`; React
escapes all rendered text; no third-party scripts, fonts, frames or trackers; production
dependencies have no known vulnerabilities (`pnpm audit --prod`).

## Accepted for the demo

- **CSP allows inline scripts.** The cached, partially prerendered pages carry Next.js's inline
  bootstrap; a nonce would force every page to render per request. Mitigated by the points above.
  Revisit when the backend makes pages dynamic anyway.
- **`braces` advisory (GHSA-vfj7-8cjw-p6xm), high, dev-only.** Reached through `eslint-config-next`
  at lint time; not in the production bundle or image, and no patched version exists yet.
  Dependabot will raise the fix when it ships.
- **Demo admin.** The prototype bar can sign anyone in as a demo admin. It only changes their own
  browser's copy of the data, so it grants nothing; it must go with the backend.
- **SSH open to the internet.** Needed for server access. See the checklist below.

## Server checklist (owner)

- [ ] Make the GitHub repository **private** again. While private, deploys need `GITHUB_TOKEN`
      (fine-grained, this repo only, Contents: read) on the Docker Manager project.
- [ ] hPanel → VPS → SSH keys: add your key, then disable password login for root.
- [ ] Optional: restrict the firewall's SSH rule to your own IP address.
- [ ] Optional: hPanel → VPS → Malware scanner (Monarx), free on Hostinger VPS.
- [ ] Rotate the Hostinger API token if it was ever shared outside this environment.

## Backend phase: required before real accounts

Done in step 1 (accounts): Argon2id passwords (19 MiB, 2 passes), random session tokens stored
only as SHA-256 hashes, `HttpOnly; SameSite=Lax` cookies that are `Secure` over HTTPS, server
validation of sign-up fields, one error for unknown email and wrong password, attempt limits on
sign-in (20 per address and 8 per email in 15 minutes) and sign-up (5 per address per hour),
admins only by `ADMIN_EMAILS`, and account deletion.

Done in step 2 (challenges): every change checks the session and touches only that member's
rows, task numbers and method numbers are validated, a sent write-up is locked, and the note is
capped at 5,000 characters.

Done in step 3 (community): every story and profile field is validated on the server with
length limits, portfolio and contact links must be http(s), nothing is public until an admin
approves it, review and report decisions check `ADMIN_EMAILS` on the server, contact requests
only reach approved profiles and only their owner (and admins) can read them, owner ids are not
sent with public lists, and submissions are limited (5 stories and 5 profiles per member per
hour, 5 contact requests and 10 reports per address per hour).

Done in step 4 (raffle): every raffle decision checks `ADMIN_EMAILS` on the server and can only
touch this week's or last week's draw; the winner is picked on the server with
`crypto.randomInt` from the eligible entries sent during that week; the week's method and the
entry decisions are fixed once it has been drawn; every draw, announcement and undo is appended
to `raffle_events` with the candidate list, the winner and the admin; other members' entries
stay private (the public page gets only counts), and an unannounced winner is shown to admins
only. The rest of the list follows with the features it covers.


- Passwords hashed with Argon2id or bcrypt; sessions in `HttpOnly; Secure; SameSite=Lax` cookies;
  CSRF protection on every state-changing request (Server Actions check the Origin header).
- Server-side validation of every field (the same rules as the forms), with length limits.
- Rate limiting on sign-in, sign-up, contact requests, story and raffle submissions.
- Authorisation checks on the server for every admin action and every member's own records.
- Uploads: size and type limits checked server-side, re-encoded images, stored outside the web
  root or in object storage, never served with a user-supplied content type.
- Moderation before anything a member writes is shown to others (the review queue already exists).
- Personal data: minimal collection, a privacy notice (the terms page has the outline), the right
  to delete an account, backups encrypted.
- Raffle: winners drawn on the server with a cryptographic RNG and an audit log.
