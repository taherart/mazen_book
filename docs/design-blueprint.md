# Design elevation blueprint

Audit of the current build and the plan to raise it, written against the running site (Next.js 16, React 19.3, Tailwind 4). Measurements were taken in the browser at 1366×768 and 375×812.

**Design read.** A companion platform for a printed book, for young Saudi readers who mostly arrive on a phone from a QR code. The language is "ink on paper": royal blue, cream, one yellow marker, hand-drawn illustrations, the book's own typefaces. This is a preserve-and-evolve redesign, not a new identity.

**Dials.** Variance 6 (asymmetric where it helps, never chaotic). Motion 6 (the page should respond and tell a short story, without hijacking scroll). Density 4.

**Scope.** The polish below targets the marketing surfaces: home, method page, weekly challenge, book. Forms, dashboard and admin are product UI; they inherit the tokens and states and otherwise stay calm.

---

## 0. Audit

| # | Finding | Measured | Fix |
|---|---|---|---|
| 1 | Small grey text failed contrast | `ink-mute` was 3.61:1 on paper and 3.99:1 on white. AA needs 4.5:1 | **Fixed**: token is now `#63666f` (5.2:1 and 5.7:1) |
| 2 | The site barely moves | 3 animated elements on home, 2 on a method page. No scroll response, no page transitions | **Fixed** in phase 1 |
| 3 | Everything is a box | 52 ink-bordered boxes on home; 61 on a method page, plus 20 hard shadows | Surface tiers, phase 2 |
| 4 | One layout repeated | Rows of 3 or 4 equal cards in 5 of the 8 home sections | Home recomposition, phase 2 |
| 5 | Hero carries too much | Eyebrow, headline, subtext, two buttons and three stat tiles, next to the weekly card. Its bottom edge sits 56px below the fold at 1366×768 | **Fixed**: stats moved to a fact strip, second button gone; the hero now ends above the fold |
| 6 | Same intent, competing buttons | Hero has "ابدأ تحدي هذا الأسبوع" beside a card whose own button is "انضم للتحدي". Method page asks you to join 3 times under 2 labels | **Label fixed**: "سأجرّب هذه الطريقة" everywhere (`JOIN_LABEL`). The third join button goes with the lower band in phase 2 |
| 7 | A label above every section | 5 small pill labels across 8 sections | **Fixed**: the hero one stays |
| 8 | Browsing 52 methods on a phone is long | Card is 469px tall: 1.35 cards per screen, about 38 screens for the full list | Compact row card, phase 2 |
| 9 | Fixed chrome eats the phone screen | Prototype bar 38 + header 66 + tab bar 74 = 178px, 22% of an 812px screen | Chrome diet, phase 2 |
| 10 | Touch targets under 44px | 27 filter chips at 30px; header controls at 36 to 40px | **Fixed** with `tap`: chips, small buttons, header and prototype-bar controls |
| 11 | Radius drift | 8 different radii in use (6, 8, 10, 12, 16, 24, 32, 40px) plus pill | One scale, phase 2 |
| 12 | Method page is long and flat | About 9 screens tall at tablet width, 15 second-level headings, every block weighted the same | Method recomposition, phase 2 |
| 13 | Type jumps at breakpoints | Sizes step at `sm`/`lg` instead of scaling | **Fixed** on home, method, challenge and book headings |
| 14 | Icon family differs from the book | Site uses Lucide; the book's PDF embeds Phosphor Light | Swap to `@phosphor-icons/react`, phase 4 |

**What is already right and stays:** brand tokens taken from the book, real illustrations instead of stock, a hero that shows a real working component, full empty/loading/error/pending states, correct right-to-left behaviour, a global reduced-motion guard.

### What I am not proposing, and why

The brief listed these as examples. For this product they would cost more than they give.

- **Custom cursor.** Most visitors are on a phone and have no cursor. On desktop it hurts accessibility and adds a permanent animation loop.
- **Smooth-scroll library.** Phones already have native momentum. Hijacked scroll breaks sticky elements, scroll-driven CSS and assistive tech.
- **Canvas particles or shaders.** Wrong material for a hand-drawn, printed look, and a battery cost on mid-range phones. Paper grain and print effects do the atmospheric job at near-zero cost.
- **Glass on cards.** Frosted glass is used only for chrome that floats over content (header, tab bar, sticky join bar).
- **Magnetic pull on everything.** One primary action per view, desktop only.
- **Dark mode now.** A print-like brand is defensible in light only. A "night edition" is sketched in section 4 as optional.

---

## 1. Visual polish and micro-interactions

Each interaction has a job: feedback, hierarchy, or confirming a state change. Touch gets first-class treatment; pointer effects are gated to a real mouse.

| Interaction | Where | Behaviour | Why | Hook |
|---|---|---|---|---|
| Lift and press | Printed cards, primary buttons | Hover: rises 3px and its hard shadow grows from 4 to 7px. Tap: presses flat, shadow to 0, in 120ms | The card is a physical sticker; pressing it should feel like it | `lift` |
| Marker swipe | One highlighted word per headline | The yellow marker draws from right to left in 700ms after the line appears | Directs the eye to the one word that matters; follows Arabic reading direction | `marker marker-draw` |
| Stamp | Ticking a task, completing a challenge, earning a badge, a week cell | A "تم" stamp lands slightly rotated with a spring overshoot | Completion is the product's core moment; it deserves the strongest feedback | `animate-stamp` |
| Sticker landing | Weekly challenge card on first paint, raffle winner reveal | Drops 18px, settles, then throws its shadow | Reads as something placed on the page this week | `animate-land` |
| Magnetic lean | The single primary action in view (join button), desktop | Leans up to 8px toward the pointer, springs back on leave | Signals "this is the action" without colour escalation | `data-magnetic="0.3"` |
| Spotlight border | Method cards, desktop | The card's border lights yellow under the pointer | Makes a dense grid feel responsive to where you look | `spotlight` + `data-spotlight` |
| Art drift and misprint | Illustration inside a card, desktop | Art shifts a few pixels against the pointer; a blue ghost slips out like a misregistered print | Gives the illustrations depth using the print metaphor | `art-drift`, `misprint` |
| Digit roll | Countdown seconds, results counter in the explorer | New digit slides up 0.45em in 380ms | Shows the number changed without a distracting flip | `animate-digit` (key the digit) |
| Count-up | Community counters, once, when scrolled into view | Counts to the value in 900ms with a decelerating curve | Draws attention to real numbers only | `data-countup="…"` |
| Chip selection | Filter chips | Selected chip scales 0.96 to 1 on a spring; the grid reflows through a view transition | Confirms the filter took effect and where cards went | `ease-spring` + `<ViewTransition>` |
| Progress fill | Challenge progress bar | Width animates on a soft spring; turns yellow and stamps once at 100% | Progress should feel earned | `ease-spring-soft` |

Rules that keep this from becoming noise: one looping animation at most per screen (the countdown), no hover effect that moves layout, nothing longer than 900ms, and every effect has a resting state that is complete on its own.

---

## 2. Motion and transition system

### Tokens

| Token | Value | Use |
|---|---|---|
| `--dur-1` | 120ms | press, colour |
| `--dur-2` | 200ms | hover, small moves |
| `--dur-3` | 320ms | chips, panels |
| `--dur-4` | 560ms | reveal fade |
| `--dur-5` | 900ms | reveal travel, hero |
| `--stagger` | 60ms | between siblings, capped at 8 steps |
| `ease-out-expo` | `cubic-bezier(.16,1,.3,1)` | anything arriving |
| `ease-in-out-quart` | `cubic-bezier(.76,0,.24,1)` | anything travelling between two places |
| `ease-spring`, `ease-spring-soft` | `linear()` samples of a damped spring | stamps, toggles, settles |

Only `transform`, `translate`, `scale` and `opacity` animate. Travel is 18px vertically or 28px horizontally, never more.

### Direction

The site reads right to left, so forward motion travels leftwards. Markers draw from the right, horizontal reveals arrive from the right, and "next" slides the page the opposite way to an English site. This is built into the utilities.

### Hero choreography (first paint, about 1.1s total)

| t | Element | Motion |
|---|---|---|
| 0ms | Outlined "52" | fades to 60% |
| 80ms | Headline, line by line | rise 18px, 80ms apart |
| 520ms | Marker under "بتجربة" | swipes right to left |
| 620ms | Subtext, then the primary button | fade and rise |
| 700ms | Weekly challenge card | lands like a sticker |

These are CSS load animations, not scroll reveals: hero content must never wait for JavaScript.

### Scroll reveals (time-based, once)

Sections below the fold enter as they cross 10% into the viewport. Headline first, then content, then the action. Grids stagger by item. Nothing re-hides on scroll up.

### Scroll-linked effects (scrubbed, CSS only)

Three, each with a reason:

1. **Reading progress line** on method pages: a 4px yellow line across the top. The page runs to many screens; people need to know where they are. `scroll-progress`
2. **The big "52"** drifts slowly against the scroll in the hero. One parallax element on the whole site. `drift`
3. **The 52-week strip** stamps its cells in sequence as it enters. It is the signature object; this is its moment.

Browsers without scroll-driven animation show the resting state.

### Page transitions

React's `<ViewTransition>` is built into this stack and needs no configuration.

- **Card to page morph.** A method's illustration travels from its card into the method page hero, and its number badge travels with it. This is the single most valuable transition: it tells the visitor "this is the thing you picked".
- **Skeleton hand-off.** The Suspense boundaries that already exist get a fade-down exit and a rise-in entry, so content does not pop.
- **Previous and next method** slide directionally, mirrored for right to left.
- **The header is anchored** and does not take part.

```tsx
// method-card.tsx and the method page hero share a name
import { ViewTransition } from "react";

<ViewTransition name={`method-art-${method.n}`} share="morph" default="none">
  <MethodArt n={method.n} title={method.title} />
</ViewTransition>
```

```tsx
// method/[n]/page.tsx: the boundary that is already there
<Suspense fallback={<ViewTransition exit="sink" default="none"><PageSkeleton /></ViewTransition>}>
  <ViewTransition enter="rise" default="none">
    <MethodContent params={params} />
  </ViewTransition>
</Suspense>
```

```tsx
// previous / next links at the foot of a method page
<Link href={methodHref(next.n)} transitionTypes={["nav-forward"]}>…</Link>
<Link href={methodHref(prev.n)} transitionTypes={["nav-back"]}>…</Link>
```

### Sticky join bar (phones)

When the hero's join button scrolls out of view on a method page, a frosted bar slides up above the tab bar with the method number, title and the same button. It leaves when the bottom "start" band is on screen. One IntersectionObserver, no scroll listener.

---

## 3. Structural layout and typography

### Fluid type scale

| Utility | Size | Line height | Use |
|---|---|---|---|
| `text-display` | 44 to 88px | 1.22 | home and book hero only |
| `text-h1` | 36 to 64px | 1.28 | page titles |
| `text-h2` | 28 to 44px | 1.3 | section titles |
| `text-h3` | 20 to 26px | 1.4 | card titles |
| `text-lead` | 17 to 20px | 1.85 | intros |
| body | 16px | 1.75 | prose, capped at about 68 characters |
| `text-meta` | 13px | 1.6 | the floor for any Arabic text |

Arabic rules: never letter-space (it breaks the joins), never set a line height under 1.2 (diacritics clip), no text under 13px, emphasis through the marker or weight rather than a second typeface.

### Rhythm

Replace the uniform section padding with three steps: `py-section-tight` for connective strips, `py-section` as the standard, and a double section gap after the hero and before the footer. Horizontal padding uses `px-gutter`.

### One radius scale, four surface tiers

Radii: pill for anything you press, `rounded-tile` (16px) inside cards, `rounded-card` (24px) for cards, `rounded-panel` (32px) for feature panels. Nothing else.

| Tier | Look | Use |
|---|---|---|
| Flat | no border, grouped by space or a hairline | facts, specs, sidebar data, counters |
| Line | 1px `line` border on white | list rows, form groups |
| Ink | 2px ink border | cards you can open |
| Print | ink border, hard shadow, `lift` | **one per viewport**: the thing you should act on |

This alone removes most of the 61 boxes on the method page and gives the hard shadow back its meaning.

### Home, section by section

1. **Hero.** Keep the split. Remove the three stat tiles and the second button; the weekly card already owns "join". Four text elements remain.
2. **Fact strip** (new, tight). The three real numbers from the hero, as one hairline-divided row with count-up. No boxes.
3. **How it works.** Replace four equal cards with a single drawn route: four stops on one line, numbers as stamps. Vertical on phones.
4. **Explore.** A five-cell bento: this week's method large (2×2) with four picks around it, each with its illustration, then the filters and a link to the full guide.
5. **The year.** Full-width blue band, larger cells, stamped in on scroll. This becomes the centrepiece.
6. **Community.** One bento instead of two card rows: a featured story (large), two compact stories, and providers as a horizontal snap rail (`rail`).
7. **Counters.** Fold into the community section as a flat row.
8. **Book.** Keep; the cover lifts on hover.

That takes "rows of equal cards" from five sections to none, and gives eight sections six different layout families.

### Method page

- **Paths.** Asymmetric: the "try it" path takes two thirds and absorbs the task preview from the lower band; "offer" and "share" stack beside it. The lower blue band goes, and with it the third join button. One label everywhere: "سأجرّب هذه الطريقة".
- **Facts.** Flat tier, three columns separated by hairlines.
- **Steps.** A vertical route with the number stamps on one continuous line, instead of five boxed rows.
- **Sidebar** stays sticky; its three cards become line tier.

### Method guide on phones

A compact row card (number, 72px illustration, title, income, two tags) at about 112px shows five methods per screen instead of 1.35. Offer a grid/list toggle; default to list under 640px. Filters open as a bottom sheet with 44px chips.

### Fixed chrome diet

Header to 56px on phones with the frosted `glass` surface; the prototype bar collapses to a small pill after first view. Together that returns roughly 45px.

---

## 4. Atmospheric enhancements

All of these extend the print metaphor rather than adding a second visual idea.

| Effect | What it does | Cost |
|---|---|---|
| **Paper grain** | One fixed, non-interactive layer of fine noise at 7%, multiplied over the page. Cream stops looking like a flat fill | One static layer. `grain` |
| **Misregistration** | Illustrations get a faint offset blue ghost on hover, like a two-colour print slightly out of register | One filter, on hover only. `misprint` |
| **Torn edge** | The hero's bottom edge and the year band's edges use a static brush-stroke mask, echoing the brush shape on the cover, instead of a ruled line | One SVG mask |
| **Frosted chrome** | Header, tab bar and join bar blur what scrolls under them, with a solid fallback and a reduced-transparency override | `glass` |
| **Spotlight border** | See section 1 | Desktop only |
| **Night edition** (optional) | Navy paper `#0e1630`, cream ink, the same blue and yellow. Every colour is already a token, so this is a token swap plus an illustration backing plate | Later |

Budget: no effect may add a continuously repainting layer, and the page must hold 60fps on a mid-range Android phone while scrolling.

---

## 5. Implementation blueprint

### What is already in the codebase

Two files, wired in and dormant: nothing on the site changes until a page opts in.

- `src/app/motion.css`: tokens, utilities, keyframes and view-transition rules.
- `src/components/motion-root.tsx`: one IntersectionObserver and one pointer listener for the whole site, mounted in the root layout. Server components opt in with data attributes and stay server components.

Live samples of every piece are at **`/ui`**, in the last section.

| Opt in with | Effect |
|---|---|
| `data-reveal` (`""`, `"fade"`, `"start"`, `"scale"`) | reveal once on scroll |
| `data-stagger` on the parent | children reveal in sequence |
| `data-countup="1250"` | count up when revealed |
| `data-spotlight` + `spotlight` | pointer-lit border; also exposes `--px`/`--py` for `art-drift` |
| `data-magnetic="0.3"` | leans toward the pointer |
| `marker marker-draw` | marker swipe |
| `lift` | hover rise and press |
| `animate-stamp`, `animate-land`, `animate-digit` | one-shot keyframes |
| `scroll-progress`, `drift` | scroll-linked, CSS only |
| `glass`, `grain`, `misprint`, `rail`, `tap` | surfaces and helpers |
| `text-display` … `text-meta`, `py-section`, `px-gutter`, `rounded-tile/card/panel` | type, rhythm, radius |
| `ease-out-expo`, `ease-spring`, `ease-spring-soft` | easings |

```tsx
// A section that reveals, with a staggered grid and a marker on the key word
<section className="py-section">
  <h2 data-reveal className="font-display text-h2">
    استكشف <span className="marker marker-draw">الطرق الـ52</span>
  </h2>
  <ul data-stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {methods.map((m) => (
      <li key={m.n} data-reveal>
        <MethodCard method={m} />
      </li>
    ))}
  </ul>
</section>
```

```tsx
// The print-tier card: one per viewport
<article data-spotlight className="spotlight lift group rounded-card border-2 border-ink bg-white shadow-print">
  <MethodArt n={n} title={title} className="art-drift misprint" />
</article>
```

```tsx
// Stamp on completion: key it so the animation replays each time
{done ? <span key="done" className="animate-stamp rounded-tile border-4 border-ok px-3 py-1 font-display text-ok">تم</span> : null}
```

Rules for using it:

- Put `data-reveal` on a wrapper, not on a control that has its own transition, and never on above-the-fold hero content.
- Write `backdrop-filter` unprefixed only. With both forms written by hand, the build keeps the `-webkit-` one alone and Chrome shows no blur. (Found and fixed while testing.)
- Anything that follows the pointer or the scroll writes to CSS variables, never to React state.

### Rollout

| Phase | Work | Size | Risk | Status |
|---|---|---|---|---|
| 0. Defects | Contrast (done), 44px targets, one join label, trim the hero, drop four eyebrow labels | Small | None | **Done** |
| 1. Motion layer | Reveals and markers on home, method and challenge pages; `lift`; stamps in the checklist and week strip; digit roll; the four view transitions; fluid type | Medium | Low: additive | **Done**, book page included |
| 2. Recomposition | Surface tiers and radius cleanup; home bento, route and year band; method page paths and steps; compact list on phones; sticky join bar; chrome diet | Large | Medium: changes layout, wants your sign-off on a first page before the rest | Waiting for sign-off |
| 3. Atmosphere | Grain, frosted chrome, misprint, torn edges | Small | Low | **Done** except torn edges, which move to phase 2 with the year band they frame |
| 4. Optional | Phosphor icons to match the book; night edition | Medium | Low | Not started |

### Notes from phases 0, 1 and 3

- **The morph needs a full prefetch.** With Partial Prefetching a link only fetches the route's shared App Shell, which stops at the method page's Suspense boundary, so the destination arrived as a skeleton and the illustration had nothing to pair with. Method cards and the previous/next links use `prefetch` (per-link prefetching); the art and number now travel in one transition. Checked on a production build: prefetching is off in `next dev`.
- **MotionRoot waits for hydration.** It used to mark on-screen elements as soon as the root layout mounted, before the page's Suspense boundaries hydrated, and React reported attribute mismatches. It now starts after `load` and an idle callback; until then nothing is hidden.
- **Count-up writes into React's text node** instead of replacing it, so a counter whose value later changes (the community stats react to the sample toggle) stays correct.
- **Chip reflow through a view transition was left out.** Naming all 52 cards for one transition costs a snapshot per card, too much memory on a mid-range phone. Chips press on a spring and the result count rolls instead.
- **Fixed in passing:** `divide-x-reverse` drew the dividers on the wrong side (Tailwind 4 dividers are already logical); story cards showed a blank method number; a long task title made phone method pages scroll sideways; `data-scroll-behavior="smooth"` added so route changes don't smooth-scroll.

### Acceptance checks

- Reduced motion: every page is complete and static with the system setting on.
- No layout shift from any animation (CLS stays 0); largest paint under 2.5s on a throttled phone profile.
- Keyboard: focus order unchanged, focus ring visible on every control, nothing reachable only by hover.
- Right to left: markers, slides and progress all start from the right.
- JavaScript off: all content visible.
