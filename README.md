# منصة 52 طريقة لزيادة الدخل

The companion platform for the book «52 طريقة لتزيد دخلك من جد». Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript. Arabic, right-to-left, mobile first.

**This is the front-end-first build.** All pages and flows are in place and clickable, the 52 methods are real (taken from the book), and everything a visitor does is kept in their own browser. There is no server-side account, database or upload yet.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build, prerenders all 52 method pages
pnpm typecheck
pnpm lint
```

Optional environment variables (`.env.local`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Base URL, also encoded in the QR codes | `https://52income.com` |
| `NEXT_PUBLIC_LAUNCH_DATE` | Start of week 1 (a Sunday, Riyadh time). Method N is the challenge of week N | `2026-10-04T00:00:00+03:00` |
| `NEXT_PUBLIC_BOOK_ORDER_URL` | Where "order the book" points; the button shows "coming soon" while empty | empty |

## Pages

| Route | Page |
| --- | --- |
| `/` | Home: hero with the challenge of the week, five suggested methods, the year at a glance, stories, providers and community counters |
| `/methods` | The 52 methods with search and filters (shareable through the query string) |
| `/method/07` | Method detail, the template behind every QR code. `/method/7` redirects here |
| `/method/07/challenge` | Join the challenge, tick tasks, write up the week, send the raffle entry |
| `/method/07/share` | Submit a story |
| `/method/07/offer` | Offer a service |
| `/stories`, `/stories/[id]` | Community stories |
| `/providers`, `/providers/[id]` | Service providers and contact request |
| `/challenge` | Challenge of the week, prize, draw rules, winners |
| `/dashboard` | Member dashboard: challenges, badges, stories, services, raffle entries |
| `/login`, `/signup` | Email and password |
| `/admin` | Admin: review queue, challenge of the week, raffle, methods, members and reports, QR codes |
| `/book`, `/terms`, `/ui` | Book and author, legal outline, component and state gallery |

## What is real and what is a stand-in

- **Real:** the 52 methods (titles, numbers, steps, illustrations), filters, QR codes, the weekly schedule, form validation, every screen state.
- **Stand-in:** accounts, stories, provider profiles, contact requests, raffle entries and admin decisions live in `localStorage` (`src/lib/demo/store.ts`). The illustrative stories and providers in `src/data/samples.ts` are labelled «مثال توضيحي» wherever they appear and can be switched off from the bar at the top of the site, which shows the true empty state.
- **Not built:** file upload, analytics, the methods CMS save, legal texts.

## Where things are

```
src/app            routes: (site) public pages, (auth) sign-in, admin
src/components     UI; admin/ holds the admin sections
src/lib/methods.ts read access to the 52 methods
src/lib/demo       browser-only state that stands in for the backend
src/lib/server     server-only helpers (current week, cached hourly)
src/data           methods.json (generated) and samples.ts (illustrative)
src/app/motion.css motion, fluid type and surface utilities (opt-in; samples at /ui)
src/app/night.css  the night edition (opt-in from the header)
src/components/icons.tsx  every icon, from Phosphor (the book's icon family)
docs               design-blueprint.md: UI audit and the plan to raise it
scripts            data pipeline, see below
```

Pages only read methods through `src/lib/methods.ts` and community data through the hooks in `src/lib/demo/hooks.ts`. The backend phase replaces those two modules; pages and components stay as they are.

## Regenerating the methods from the book

`src/data/methods.json` is built from two inputs:

1. `scripts/book/methods.raw.json`: text extracted from the book PDF.
2. `scripts/book/curated.json`: income, capital and time-to-first-riyal per method, plus the filter tags.

```bash
# 1. extract text and illustrations (needs Python with PyMuPDF and Pillow)
python scripts/book/extract_book.py "<book.pdf>" scripts/book/methods.raw.json
python scripts/book/export_images.py "<book.pdf>" public "<cover.png>"
python scripts/book/validate.py "<book.pdf>" scripts/book/methods.raw.json   # optional cross-check, needs pdftotext

# 2. rebuild the seed
pnpm data
```

The extractor reads the PDF content stream directly (`scripts/book/pdftext.py`) because generic tools misplace Arabic diacritics in Chrome-generated PDFs.

`curated.json` deserves an editorial pass: the three stats come from the previous landing page's table, and `level`, `place` and `kind` are our own classification added for filtering.
