# Handoff: Competitions page redesign — "The Ledger" (Midnight Edition)

## Overview
A redesign of the **Competitions** view in NovelSync (product surface: TheTaleTribe), where writers
discover and enter book/short-fiction writing competitions ("prizes").

The primary job of the page is **discovery**: help a writer decide which prize is worth entering,
without clicking into anything. The chosen direction ("The Ledger") is stakes-forward — prize pool,
time remaining, entry fee, and fill level are always visible.

Page structure, top to bottom:

1. Persistent left navigation (existing app shell) + top utility bar (search, "Host a prize", avatar).
2. **Featured prize hero** — one editorially chosen live competition, with a stats sidebar.
3. **"Closing this week" rail** — horizontally scrolling cards, urgency-ordered.
4. **"Every open prize" ledger table** — dense, sortable, filterable list for 30–50 items.

Clicking any prize navigates to the **competition detail page**, which is included in this bundle
(screen 6 below). "My competitions" is explicitly **out of scope**; it lives on its own page.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that show the
intended look, layout and behavior. They are **not production code to copy directly**.

The task is to **recreate these designs in the target codebase's existing environment**, using its
established patterns and libraries. The target stack for this product is:

- **Tailwind CSS** with CSS-variable-backed design tokens (all `--ns-*`)
- **Radix UI primitives via shadcn/ui** as the component base
- `tailwindcss-animate` + `tailwindcss-typography`

So: build these screens as React components using shadcn/ui primitives and the `--ns-*` token
classes. Do **not** hardcode the hex values that appear in the prototype markup — the prototype
inlines them only because it is a standalone HTML file. Map each one to its token (mapping table in
[Design Tokens](#design-tokens) below).

## Fidelity
**High-fidelity.** Colors, typography, spacing, and hierarchy are final. Recreate the UI
pixel-accurately using the codebase's existing token classes and shadcn/ui components. Where a
measurement below conflicts with an existing shared component in the codebase (e.g. the app shell's
sidebar width), prefer the existing component.

The design was authored at a **1440px** content width with a **236px** sidebar (≈1204px main
column). Interactions are described in prose here — the prototype is static and does not implement
them.

---

## Screens / Views

### 1. Competitions — populated (dark / Midnight Edition)
**File:** `Competitions Midnight Ledger.dc.html`
**Purpose:** Browse all open prizes, judge whether one is worth entering, and go to its detail page.

#### Layout
- Root: `display:flex`, full-bleed dark page (`--ns-bg` `#0E0E0D`).
- **Sidebar**: `width:236px; flex:none`, bg `--ns-surface` `#141312`, right border `#262320`,
  padding `26px 20px`, `display:flex; flex-direction:column; gap:34px`.
- **Main**: `flex:1; min-width:0`. Internal horizontal padding is **44px** on every section.

#### 1.1 Sidebar (app shell — likely already exists)
- Wordmark "TheTaleTribe" — `font-heading` (Cormorant) 26px / weight 500, `--ns-ink` `#F5F1EA`.
- Section label "EXPLORE" — `font-ui` 10px, `letter-spacing:.2em`, uppercase, `#6B655C`
  (`--ns-ink-muted`), padding `0 12px 10px`.
- Nav items — `font-ui` 14px, `#B3ABA0` (`--ns-ink-secondary`), padding `10px 12px`,
  `border-radius:8px` (`rounded-ns`). Items: Stories, Community, Competitions, Book Clubs,
  Announcements.
- **Active item** (Competitions): bg `--ns-accent` `#EF4444`, text `#FDFCF9`, weight 600, with a
  right-aligned count badge (`24`) at 11px, `opacity:.8`.
- Hover (not in static mock): bg `--ns-surface-hover`, no text color change.
- **Balance card** — pinned to the bottom via `margin-top:auto`. Border `#262320`, bg `#181716`
  (`--ns-elevated`), `border-radius:12px` (`rounded-ns-lg`), padding 16px, `gap:8px`:
  - "YOUR BALANCE" — 10px, `.18em` tracking, uppercase, `#6B655C`
  - `1,000` — Cormorant 30px, `#F5F1EA`; suffix `TALE` at 14px in `--ns-gold-bright` `#D4A94A`
  - "Claim daily +25" — 12px weight 600, `--ns-accent` `#EF4444`. Interactive; see Interactions.

#### 1.2 Top utility bar
`padding:28px 44px 22px`, bottom border `#201E1B`, `display:flex; align-items:center; gap:24px`.
- **Search** — `flex:1`, bg `#171614`, border `#2A2724`, `border-radius:10px`, padding `11px 16px`.
  Placeholder "Search prizes, genres, hosts…" 14px `#6B655C`. Leading 13px circular search glyph —
  use the codebase's icon set (lucide `Search` in shadcn projects), not the placeholder ring in the
  mock. Should also open on `⌘K` / `Ctrl+K`.
- **"Host a prize"** — secondary button: 13px weight 600, `#E8E1D6`, border `#33302B`, radius 10px,
  padding `11px 18px`. Opens the create-competition flow (see screen 4).
- **Avatar + handle** — 34px circle, bg `--ns-accent`; handle 13px weight 600 `#F5F1EA`.

#### 1.3 Featured prize hero
Container: `padding:44px`, bottom border `#201E1B`, and a two-layer background:
```
radial-gradient(90% 130% at 78% 0%, rgba(239,68,68,.16) 0%, rgba(14,14,13,0) 62%),
repeating-linear-gradient(105deg, rgba(212,169,74,.05) 0 1px, transparent 1px 13px)
```
The second layer is the Inkwell **paper-grain / laid-paper** motif (`.ns-grain` equivalent) — reuse
the existing grain utility if it produces a comparable texture.

Inner: `display:flex; gap:48px; align-items:flex-end`.

**Left column (`flex:1`)**
- Status line, `gap:12px`: a 6px `--ns-accent` dot (should pulse — `ns-glow-pulse`), then
  "LIVE · CLOSES IN 6D 14H" at 10px weight 700 `.22em` uppercase `--ns-accent`, then the host name
  "THE LANTERN SOCIETY" at 10px `.18em` uppercase `#6B655C`. Margin-bottom 20px.
- Title — Cormorant **76px**, `line-height:.96`, weight **300**, `letter-spacing:-.02em`,
  `#F5F1EA`, `max-width:20ch`, `text-wrap:pretty`.
- Description — Crimson Pro (`font-body`) **20px**, `line-height:1.5`, `#B3ABA0`, `max-width:56ch`,
  margin-top 20px.
- Buttons (margin-top 30px, `gap:12px`):
  - Primary "Read the brief & enter" — bg `#F5F1EA` (ink-on-light), text `#0E0E0D`, 14px weight 600,
    radius 10px, padding `15px 30px`.
  - Secondary "Save" — 14px weight 600 `#E8E1D6`, border `#33302B`, radius 10px, padding `15px 22px`.
  - Note: in Midnight the primary CTA is **paper-white**, not accent red — accent red is reserved for
    urgency signals (countdowns, live dot). Keep that split.

**Right stats card** — `width:330px; flex:none`, border `#2A2724`, bg `#161514`, radius 14px,
padding 24px, `gap:18px`:
- "PRIZE POOL" label (10px `.18em` uppercase `#6B655C`), then `40,000` in Cormorant **52px**,
  `line-height:.9`, `--ns-gold-bright` `#D4A94A`; sub-line "TALE · split 3 ways" 11px `.14em`
  `#8A8378`.
- 1px divider `#262320`.
- Rows (`display:flex; justify-content:space-between`), label 13px `#8A8378` / value 13px weight 600
  `#F5F1EA`: **Entry fee** `250 TALE`, **Word limit** `2,000`.
- **Entrants** row `148 / 200` plus a 4px progress bar: track `#262320`, fill `--ns-accent`
  `#EF4444`, `border-radius:99px`.

#### 1.4 "Closing this week" rail
`padding:34px 0 6px 44px` (no right padding — cards bleed off the right edge to signal scroll).
- Header row: title in Cormorant 32px `#F5F1EA`, a 1px `#201E1B` rule filling remaining space
  (`flex:1`), and a "See all 18" link at 12px weight 600 `#B3ABA0`. Right padding 44px on this row.
- Track: `display:flex; gap:16px; margin-top:20px`, horizontally scrollable (`overflow-x:auto`,
  hidden scrollbar, snap to card start).
- **Card** — `width:262px; flex:none`, border `#2A2724`, bg `#151413`, radius 12px, padding 18px,
  `gap:12px`:
  - Cover: 88px tall, radius 8px, bg = a diagonal `repeating-linear-gradient` over `#1C1A18`, with
    the prize's short name bottom-left in Cormorant 26px `line-height:.9` `#F5F1EA`. See
    [Generated covers](#generated-covers).
  - Title — Cormorant 22px `line-height:1.15` `#F5F1EA`.
  - Row: pool in Cormorant 26px `--ns-gold-bright`; countdown 12px weight 600 —
    `--ns-accent` when ≤ 72h remaining, otherwise `#B3ABA0`.
  - Meta line — 12px `#6B655C`, e.g. "100 TALE · 74/120 entered", or personal state
    ("Draft saved · 88/100 entered") when the user has a draft.
  - Whole card is one link to the detail page.
- Trailing affordance: `width:130px` dashed `#33302B` tile, radius 12px, centered "more →" 12px
  `#6B655C` — links to the full list below (anchor scroll) or the all-prizes route.

#### 1.5 "Every open prize" ledger table
`padding:34px 44px 48px`.
- Header row: Cormorant 32px title, 1px `#201E1B` rule (`flex:1`), then filter chips (`gap:7px`):
  - Active chip: bg `#F5F1EA`, text `#0E0E0D`, 12px weight 600, radius 99px, padding `7px 14px`
  - Inactive chip: 12px `#B3ABA0`, border `#33302B`, same radius/padding
  - Chips shown: **Open** (active), **Free**, **Big purse**. Treat as multi-select toggles.
- Grid: `grid-template-columns: 1.9fr .9fr .8fr .8fr .9fr auto; gap: 0 20px; align-items:center`.
  Same template on the header row and every data row.
- Column head style: 10px `.18em` uppercase `#6B655C`, `padding:0 4px 12px`, bottom border `#262320`.
  Columns: **Prize · Host · Pool · Entry · Entrants · (action)**. Pool / Entry / Entrants are
  right-aligned. Column heads are sort controls (default sort: closing soonest).
- Data row: `padding:18px 4px`, bottom border `#1B1917`.
  - **Prize cell**: title Cormorant 24px `line-height:1.05` `#F5F1EA`; below it a 12px sub-line
    combining deadline + category, e.g. "Closes in 2d 03h · Flash fiction". Sub-line is
    `--ns-accent` weight 600 when urgent (≤72h), else `#8A8378`.
  - **Host**: 13px `#B3ABA0`.
  - **Pool**: Cormorant 26px `--ns-gold-bright`, right-aligned.
  - **Entry**: 13px `#B3ABA0`; the value `Free` renders 13px weight 600 in green `#4ADE80`;
    already-paid rows read "Paid".
  - **Entrants**: 13px `#B3ABA0`, `74 / 120`.
  - **Action**: primary paper button (bg `#F5F1EA`, text `#0E0E0D`, 12px weight 600, radius 8px,
    padding `9px 18px`) labelled **Enter**.
- **Row variants**
  - *User has a draft*: row gets `background: linear-gradient(90deg, rgba(239,68,68,.07), transparent 55%)`
    and the action becomes **Continue** — 12px weight 600 `--ns-accent`, border `#4A2320`,
    transparent fill.
  - *Judging / closed*: whole row at `opacity:.62`; sub-line reads "Judging · winners 12 Aug ·
    Crime"; action becomes **Shortlist** — 12px weight 600 `#B3ABA0`, border `#33302B`.
- Below the table (not in the mock, needed for 30–50 items): paginate or infinite-scroll in pages of
  20, with a "Showing 20 of 18 open prizes" style count. Wire the existing pattern in the codebase.

### 2. Empty state
**File:** `Competitions All Directions.dc.html` → option **1c**, first frame.
Currently drawn in the light theme; **port it to Midnight** using the token mapping (bg
`--ns-bg`, card `--ns-surface`, ink `--ns-ink` / `--ns-ink-secondary`).
- Centered column, `padding:56px 48px`, `gap:18px`, `text-align:center`.
- A 104×140px blank "cover" placeholder: 1px border, radius 8px, grain gradient fill — a book that
  hasn't been written.
- Headline Cormorant 40px `line-height:1.05`: "No prizes open just yet".
- Body Crimson Pro 17px `line-height:1.55`, `max-width:36ch`: "The next round opens Monday. Until
  then you can set a reminder, or start a prize of your own and let the tribe write to it."
- Buttons: primary "Host a prize", secondary "Notify me Monday".
Show this when the active filter set returns zero rows too — in that case swap the copy to name the
filter and offer "Clear filters".

### 3. Entered / submitted state
**File:** `Competitions All Directions.dc.html` → option **1c**, second frame. Port to Midnight.
A card representing the user's own entry, used on the detail page and in the "my competitions" list:
- Confirmation banner: tinted `--ns-accent-subtle` fill, bottom border, `padding:14px 18px`;
  20px accent-filled check circle; "Submitted · 1,840 words" 13px weight 600 in `--ns-accent-deep`.
- Body: title Cormorant 30px; entry title in Crimson Pro **italic** 16px (“The Night Bus to Ardglass”);
  1px divider; two label/value rows — "Judging begins / 10 Aug", "You can edit until / 9 Aug, 23:59"
  (the deadline value in `--ns-accent` weight 600).
- Two equal-width buttons: "Edit entry" (outline) and "Read the brief" (solid ink).
The **edit-until** deadline is a real rule: entries stay editable until judging opens.

### 4. Results announced
**File:** `Competitions All Directions.dc.html` → option **1c**, third frame. Port to Midnight,
keeping gold as the results accent.
- Header block: gold-tinted grain gradient, bottom border; "RESULTS · THE LAST ALIBI" 10px `.2em`
  uppercase; headline Cormorant 34px `line-height:1.02`: "You placed second of 212".
- Ranked list, three rows, `gap:14px`. Each row: rank numeral in Cormorant 22px in a fixed 22px
  column (1 = `--ns-gold`, 2 = `--ns-accent` when it's the user, 3 = `--ns-ink-muted`), then entry
  title (Crimson Pro 16px) over author handle (12px muted), then payout 13px weight 600, right.
- **The user's own row** is highlighted: `--ns-accent-subtle` fill, radius 8px, negative 8px side
  margin with 8px padding to bleed the highlight past the content edge; sub-line reads
  "You · +4,500 TALE" in accent weight 600.
- Footer: full-width outline button "Read the judges' notes".

### 5. Host a prize — step 2 of 3 ("Set the stakes")
**File:** `Competitions All Directions.dc.html` → option **1c**, fourth frame. Port to Midnight.
Render as a shadcn `Dialog` (or `Sheet` on narrow viewports), width ~520px.
- Header: `padding:24px 28px 18px`, bottom border. Eyebrow "HOST A PRIZE · STEP 2 OF 3" 10px `.18em`
  uppercase muted; title Cormorant 34px "Set the stakes"; close ✕ top-right (use the icon set).
- Body `padding:24px 28px 28px`, `gap:20px`:
  - **Prize pool** — label 11px weight 600 `.1em` uppercase muted; input row with the amount in
    Cormorant 30px, `TALE` suffix 12px weight 600 gold, and a right-aligned helper
    "Balance 1,000 · top up" 12px muted. Validate against balance; "top up" is a link.
  - **Split chips** (single-select): "Winner takes all" / "Split 3 ways" (selected) / "Top 10".
  - **2×2 field grid**, `gap:14px`: Entry fee, Max entrants, Word limit, Closes (date picker).
  - **Live projection panel** — `--ns-surface` fill, 1px border, radius 10px, Crimson Pro 15px:
    "At 200 entrants your pool grows to **60,000 TALE** from entry fees. Unfilled slots refund
    automatically." Recompute on every field change: `pool + (entryFee × maxEntrants)`.
  - Footer: "Back" (outline) + "Continue to rules" (solid accent, `flex:1`).

### 6. Competition detail page
**File:** `Competition Detail.dc.html`
**Route:** `/competitions/:slug`
**Purpose:** Give a writer everything needed to decide to enter, then enter — brief, rules, scoring,
judges, dates, money, and who else is writing.

#### Layout
Same app shell (236px sidebar + `flex:1` main, 44px horizontal padding). Main column, top to bottom:
breadcrumb bar → hero → tab bar → a `grid-template-columns: 1fr 348px; gap:48px` body with a
**sticky** right rail (`position:sticky; top:24px`). Root is `min-height:100vh`.

#### 6.1 Breadcrumb bar
`padding:22px 44px`, bottom border `#201E1B`, `gap:20px`.
- "← All prizes" 13px weight 600 `#B3ABA0` — back link (history back, falling back to the index).
- Trail "Competitions · Short fiction · The Lantern Society" 12px `#6B655C`; each segment links.
- Right: **Share** and **Save** outline buttons (13px weight 600 `#E8E1D6`, border `#33302B`,
  radius 9px, padding `9px 16px`), then avatar + handle. Save is a toggle — filled accent when saved.

#### 6.2 Hero
`padding:44px 44px 38px`, bottom border, same two-layer background as the index hero but with the
radial at `80% 120% at 82% 0%`. Inner `display:flex; gap:44px; align-items:flex-start`.
- **Cover** — `width:250px; flex:none; aspect-ratio:3/4`, border `#2A2724`, radius 12px, generated
  cover gradient over `linear-gradient(200deg,#211E1C,#141312)`, `box-shadow:0 20px 40px -24px rgba(0,0,0,.8)`,
  padding 22px, contents space-between: eyebrow "VOL. IX · SHORT FICTION" (10px `.2em` uppercase
  `#8A8378`), short name in Cormorant **74px** `line-height:.84` weight 300, judge line in Crimson
  Pro italic 14px `#B3ABA0`. Same `<CompetitionCover>` component as the index, largest size.
- **Right column** (`flex:1`, `gap:20px`):
  - Status line: pulsing 6px accent dot + "LIVE · CLOSES IN 6D 14H" (10px weight 700 `.22em`
    `--ns-accent`) + "148 OF 200 SLOTS TAKEN" (10px `.18em` `#6B655C`).
  - Title — Cormorant **68px** `line-height:.98` weight 300 `letter-spacing:-.02em` `max-width:22ch`.
  - Description — Crimson Pro 21px `line-height:1.5` `#B3ABA0` `max-width:58ch`.
  - **4-up stat strip** — `grid-template-columns:repeat(4,1fr)`, 1px `#262320` top and bottom rules
    and 1px dividers between cells (first cell has no left padding, last no right). Each cell: label
    10px `.18em` uppercase `#6B655C`, value Cormorant **36px**. Cells: **Prize pool** `40,000` in
    `--ns-gold-bright`, **Entry** `250`, **Word limit** `2,000`, **Judged** `Blind` (all `--ns-ink`).
  - CTA row: primary "Enter for 250 TALE" (paper fill `#F5F1EA` on `#0E0E0D`, radius 10px, padding
    `15px 30px`), secondary "Add to reading list", then a Crimson Pro italic 15px `#8A8378`
    reassurance: "Refunded in full if the prize doesn't fill". Label the primary with the real fee;
    when the user already has a draft it becomes "Continue your draft".

#### 6.3 Tab bar
`padding:0 44px`, bottom border `#201E1B`, `gap:28px`. Tabs `padding:18px 0`, 13px.
Active: weight 600 `#F5F1EA` with `box-shadow: inset 0 -2px 0 #EF4444` as the underline.
Inactive: weight 500 `#8A8378`, with counts in `#6B655C`.
Tabs: **The brief** (active) · **Rules & scoring** · **Entrants 148** · **Discussion 31** ·
**Past winners**.
In the mock every section is stacked in the left column so the whole spec is visible at once. In the
app, make these real tabs (shadcn `Tabs`, URL hash synced) with the brief as default; "Rules &
scoring" holds §6.5+§6.6, "Entrants" the §6.8 list in full, "Discussion" a thread, "Past winners"
prior editions of the same prize.

#### 6.4 The brief
Left column sections are separated by `38px` gaps and 1px `#201E1B` rules. Each opens with a 10px
`.2em` uppercase `#6B655C` eyebrow.
- Lede — Crimson Pro **23px** `line-height:1.5` `#E8E1D6` `max-width:64ch`.
- Body paragraphs — Crimson Pro **18px** `line-height:1.68` `#B3ABA0` `max-width:68ch`.
- **Pull quote** — `border-left:2px solid #D4A94A`, `padding:4px 0 4px 20px`; quote in Crimson Pro
  italic 19px `#E8E1D6` `max-width:56ch`; attribution 12px `#6B655C` `letter-spacing:.06em`.
  This is the host's editable rich-text field — render with `tailwindcss-typography` (`prose`) using
  the body font, and keep the gold-rule blockquote treatment.

#### 6.5 How it's scored
`grid-template-columns:repeat(3,1fr); gap:16px`. Card: border `#262320`, bg `#151413`, radius 12px,
padding 20px — criterion name Cormorant 24px, weight number Cormorant 26px `--ns-gold-bright`,
description Crimson Pro 15px `#8A8378`. Below the grid, a 13px `#6B655C` note on how scores combine.
Weights come from the competition record and must sum to 100 — surface that as a host-side validation.

#### 6.6 The rules
`grid-template-columns:1fr 1fr; gap:14px 40px`. Each rule: zero-padded numeral in Cormorant 20px
`#6B655C` in a fixed 22px column, text Crimson Pro 17px `line-height:1.5` `#B3ABA0`,
`padding-bottom:14px`, bottom border `#1B1917`. Rules are an ordered list on the record; render as
many as exist and let the grid flow.

#### 6.7 Your judges
Two `flex:1` cards, `gap:16px`, same card styling. Each: 52px circular generated avatar (stripe
gradient over `#211E1C`, border `#33302B`), then name Cormorant 24px, role 11px `.14em` uppercase
`#6B655C`, bio Crimson Pro 16px `#8A8378` with titles in `<em>` at `#B3ABA0`. Wrap to a grid if more
than two judges. Use real judge avatars when the profile has one.

#### 6.8 Who's writing
Header row: eyebrow + 1px rule (`flex:1`) + "See all" 12px weight 600 `#B3ABA0`.
Overlapping avatar stack: 38px circles, `border:2px solid #0E0E0D`, `margin-left:-12px` after the
first, last chip shows `+143` at 11px weight 600 `#B3ABA0`. Beside it, Crimson Pro 17px `#8A8378`:
"including 3 writers you follow. Names stay hidden from the judges."
Because judging is blind, show avatars but **never** map an avatar to a submission.

#### 6.9 Sticky rail (348px)
Four stacked cards, `gap:16px`.

**a. Entry card** — border `#2A2724`, bg `#161514`, radius 14px, two padded regions split by a
1px `#262320` rule.
- Top (`padding:22px`): "CLOSES IN" label + absolute date "14 Aug, 23:59 GMT" 11px `#8A8378`; then
  three equal `#1C1A18` tiles (radius 9px, `padding:12px 0`) with Cormorant **32px** numerals over
  10px `.14em` uppercase unit labels — **days / hrs / min**. The smallest live unit is
  `--ns-accent`; the others `--ns-ink`. Ticks every 60s (every 1s inside the final hour); under 1h
  the tiles become hrs/min/sec.
- Bottom (`padding:22px`): slots row + 4px progress bar (fill `--ns-accent`) + urgency line
  "52 left · 12 taken in the last 24 hours" 12px `#6B655C`; 1px rule; "Entry fee" with the amount in
  Cormorant 24px and a gold `TALE` suffix; "Your balance after / 750 TALE" 13px; primary
  **Enter this prize** (full-width paper button, radius 10px, padding 15px); secondary
  **Start a draft first**; footnote Crimson Pro 14px `#6B655C` centered: "Nothing is charged until
  you submit."
- State variants for this card: *insufficient balance* → primary becomes "Top up 250 TALE" and the
  balance-after line turns `--ns-accent`; *draft exists* → primary "Continue your draft", footnote
  shows last-saved time; *submitted* → replace the card with the **submitted** card (screen 3);
  *full* → disabled "Prize is full" + "Join the waitlist" secondary; *closed/judging* → countdown
  region swaps to "Judging · winners 8 Sep" and CTAs to "View shortlist".
- On viewports below 1280px this card unsticks and a compact fee+CTA bar docks to the bottom of the
  viewport instead.

**b. How the purse splits** — border `#262320`, bg `#151413`, radius 14px, padding 22px. Three rows:
rank numeral Cormorant 20px (1 = `--ns-gold-bright`, others `#8A8378`) in a 20px column, label
Crimson Pro 16px `#B3ABA0`, amount Cormorant 22px `--ns-ink`. Then a rule and a 12px `#6B655C` note
about universal feedback. Derive rows from the prize's split config.

**c. Key dates** — four rows, `gap:14px`: a 6px dot (`--ns-accent` for the current/next milestone,
`#33302B` for future ones) with `margin-top:7px`, then label 14px weight 600 (`--ns-ink` when
current, `#B3ABA0` otherwise) over date 13px `#8A8378`. Milestones: entries close, judging,
shortlist published, winners & payouts. Past milestones get a filled `#8A8378` dot and 60% opacity.

**d. Hosted by** — 40px rounded-square generated host mark, name Cormorant 22px, trust line
"11 prizes hosted · 100% paid out" 12px `#6B655C`, then a full-width outline "View their prizes"
button. The payout-record line is a real trust signal — pull it from host stats, and omit the line
rather than showing 0%.

#### Detail-page interactions
- **Enter** → if no draft, create one and route to the composer; if a draft exists, route to it.
  Charging happens at submit, not at draft creation — the footnote is a promise, honor it.
- **Tabs** sync to the URL hash so a shared link can open on Rules.
- **Sticky rail** must not overlap the footer; give the grid `align-items:start` (as in the mock).
- Countdowns, reduced-motion, and hover rules are identical to the index page.
- Blind judging: never render entrant handles against entries anywhere on this page before
  `resultsAt`.

---

## Generated covers
Competitions have **no photographic imagery**. Every cover is generated from the competition record:

- Background: two stacked layers — a `repeating-linear-gradient` of the accent or gold at low alpha
  (`0 2px, transparent 2px Npx`) over a flat dark fill (`#1C1A18` on cards, `#1A1815`-family
  elsewhere). Vary **angle** (30–160°) and **stripe period** (8–14px) deterministically from the
  competition id — hash the id, index into a small fixed set of {angle, period, tint} triples so a
  prize always looks the same everywhere.
- Foreground: the prize's short name (first 1–2 words, hard-wrapped) in Cormorant, `line-height:.9`,
  bottom-left aligned, sized to the tile (26px on rail cards, 38px on grid cards, up to 96px on a
  full cover panel).
- Optionally an eyebrow with the category at 9px `.2em` uppercase, top-left.

Implement this as a single `<CompetitionCover competition size>` component — the whole system depends
on it staying consistent.

## Interactions & Behavior
- **Card / row click** → navigate to the competition detail page (`/competitions/:slug`). The whole
  card and the whole table row are the hit target; the trailing button is a nested link to the same
  route (or straight to the entry composer when the user has already paid).
- **Hover**
  - Rail + grid cards: border → `--ns-border-strong`, translate `-2px`, `shadow-ns-lg`, 160ms
    `smooth` easing. If the existing `.book-cover` 3D tilt is used elsewhere for covers, apply it
    here too, but keep the tilt subtle (≤4°) — these are UI cards, not shelf objects.
  - Table rows: bg → `--ns-surface-hover`.
  - Buttons: primary paper → slight dim (`#E8E1D6`); accent → `--ns-accent-hover`; outline →
    border `--ns-border-strong`.
- **Live countdowns** — deadlines tick client-side (`1s` for < 1h, else `60s`). Format:
  `6d 14h` → `14h 22m` → `22m 08s`. Crossing the **72h** threshold flips the countdown and the row
  sub-line to `--ns-accent` weight 600.
- **Live dot** on the featured hero uses the existing `ns-glow-pulse` keyframe (~2s loop). Respect
  `prefers-reduced-motion` — drop the pulse and any card translate.
- **Filter chips** — multi-select, applied to the ledger table only (hero and rail are curated and
  unaffected). Reflect in the URL query so a filtered view is shareable. Zero results → the empty
  state from screen 2 with "Clear filters".
- **Sorting** — click a column head to sort; default "closing soonest". Show the active direction
  with a caret in the head.
- **Search** — debounce 250ms, matches title, category, host, tags. `⌘K` focuses it.
- **Rail** — horizontal scroll with snap; keyboard arrow support; the trailing dashed tile is
  focusable and jumps to the table.
- **Loading** — skeletons that hold the exact layout: hero title/description bars, four rail card
  shells, eight table rows. Use `--ns-surface` blocks with the existing shimmer; never a spinner.
- **Entering a prize** — if `balance < entryFee`, the Enter button stays enabled but opens a top-up
  prompt rather than failing silently. If `entrants === maxEntrants`, the action becomes a disabled
  "Full" chip.
- **Responsive**
  - `< 1280px`: stats card drops below the hero copy, full width; table drops the **Host** column.
  - `< 900px`: sidebar collapses to the app's existing icon rail; ledger table becomes stacked cards
    (title + pool + countdown + meta + action).
  - `< 640px`: hero title 44px; rail cards 78vw wide.

## State Management
Client state for this page:
- `filters: { status: 'open'|'upcoming'|'judging', free: boolean, bigPurse: boolean, category?: string }`
- `sort: { key: 'closesAt'|'pool'|'entryFee'|'entrants', dir: 'asc'|'desc' }` (default `closesAt asc`)
- `query: string` (debounced)
- `page` / cursor for the ledger list
- `now: number` — ticking clock driving every countdown (one interval for the page, not one per row)
- `hostDialog: { open: boolean, step: 1|2|3, draft: {...} }`

Data needs:
- `GET /competitions?status&sort&q&cursor` → `{ items: Competition[], total, nextCursor }`
- `GET /competitions/featured` → the editorially featured live prize
- `GET /competitions/closing-soon?limit=8` → rail
- `GET /me/balance` → sidebar balance + entry affordability
- Per-item user state on the `Competition` payload: `myEntry: { status: 'none'|'draft'|'submitted', wordCount?, updatedAt? }`

`Competition` shape the UI reads: `id, slug, title, shortName, category, host { name }, pool,
entryFee, wordLimit, entrants, maxEntrants, opensAt, closesAt, resultsAt, status, myEntry`.

## Design Tokens
Every hex in the prototype maps to an existing `--ns-*` token. Use the token, not the hex.

**Midnight (dark) theme**

| Prototype hex | Token | Used for |
|---|---|---|
| `#0E0E0D` | `--ns-bg` | page background |
| `#141312` | `--ns-surface` | sidebar |
| `#151413`, `#161514` | `--ns-surface` / `--ns-elevated` | cards, stats panel |
| `#181716`, `#171614` | `--ns-elevated` | balance card, search field |
| `#1C1A18` | `--ns-elevated` | cover tile base |
| `#F5F1EA` | `--ns-ink` | headings, primary button fill |
| `#E8E1D6` | `--ns-ink` (85%) | secondary button label |
| `#B3ABA0` | `--ns-ink-secondary` | body copy, table values |
| `#8A8378` | `--ns-ink-muted` | sub-lines |
| `#6B655C` | `--ns-ink-muted` (dimmer) | labels, placeholders |
| `#EF4444` | `--ns-accent` | urgency, live dot, active nav, draft rows |
| `#F87171` | `--ns-accent-hover` | accent hover |
| `rgba(239,68,68,.07–.16)` | `--ns-accent-subtle` | hero glow, draft-row wash |
| `#4A2320` | `--ns-accent` @ 30% | outline on the "Continue" action |
| `#D4A94A` | `--ns-gold-bright` | all prize-pool figures |
| `#B08D3F` | `--ns-gold` | gold accents, rank 1 |
| `#262320`, `#2A2724` | `--ns-border` | card + panel borders |
| `#33302B` | `--ns-border-strong` | outline buttons, chips |
| `#1B1917`, `#201E1B` | `--ns-border` (subtle) | table row rules, section rules |
| `#4ADE80` | success (add if missing) | "Free" entry fee |

**Daylight (light) theme** — used by the 1c state frames, in case those screens ship light too:
bg `#FDFCF9`, surface `#F7F5F0`, elevated `#FFFFFF`, ink `#1A1815`, ink-secondary `#4A453D`,
ink-muted `#8A8378` / `#A99F91`, accent `#B91C1C`, accent-hover/deep `#7F1414`, accent-subtle
`#FBF0EF`, gold `#B08D3F`, border `#E8E3D9`, border-strong `#D5CDBE`.

**Typography** (three-font Inkwell system)
| Role | Family | Sizes used here |
|---|---|---|
| `font-heading` | Cormorant | 76 / 52 / 40 / 38 / 34 / 32 / 30 / 26 / 24 / 22 (weights 300–500) |
| `font-body` | Crimson Pro | 20 / 19 / 17 / 16 / 15 (400, italic for entry titles) |
| `font-ui` | Hanken Grotesk | 14 / 13 / 12 / 11 / 10 (500–700; 10–11px always uppercase with `.14–.22em` tracking) |

Display sizes use tight leading (`.9–1.05`) and `letter-spacing:-.02em`. Never set a Cormorant
display line below 22px, and never set UI text below 10px.

**Spacing** — 4px base; the values actually used are 4, 7, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26,
28, 30, 34, 40, 44, 48, 56. Section padding is 44px horizontal; card padding 18–24px.

**Radius** — 8px `rounded-ns` (chips' inner controls, small buttons, cover tiles) · 10px (inputs,
buttons) · 12px `rounded-ns-lg` (cards) · 14px (stats panel) · 16px `rounded-ns-xl` (page shell) ·
99px (pills).

**Shadows** — `shadow-ns-lg` on hover-raised cards; `0 24px 60px -30px rgba(20,14,8,.6)` on the page
shell in the mock (that's the canvas presentation, not part of the page — skip it in the app).

**Motion** — 160ms `smooth` for hover/color, 220ms `spring` for card lift and dialog entry;
`ns-fade-in` + `ns-slide-up` for list mounts (stagger 30ms, cap at 8 items); `ns-glow-pulse` for the
live dot.

## Assets
**None.** No photographs, illustrations, or bitmap assets are used or needed.
- Covers are CSS-generated (see [Generated covers](#generated-covers)).
- Icons in the prototype are placeholder shapes (rings, ✓, ✕, ▾, →). Replace all of them with the
  codebase's existing icon set — in a shadcn project that's **lucide-react**: `Search`, `Check`, `X`,
  `ChevronDown`, `ArrowRight`.
- Fonts are Google Fonts: **Cormorant** (300–600 + italic), **Crimson Pro** (300–500 + italic),
  **Hanken Grotesk** (400–700). Self-host them if the app already self-hosts its fonts.

## Files
| File | What it is |
|---|---|
| `Competitions Midnight Ledger.dc.html` | **The chosen direction.** Full populated Competitions page, Midnight Edition. Open in a browser. |
| `Competition Detail.dc.html` | The competition detail page (`/competitions/:slug`) — hero, brief, scoring, rules, judges, entrants, and the sticky entry rail. |
| `Competitions All Directions.dc.html` | The full exploration canvas: `1a` a light editorial hero+grid alternative, `1b` the chosen direction, `1c` the four state frames (empty, submitted, results, host-a-prize). |
| `support.js` | Runtime needed to open the two HTML files locally. Not part of the deliverable — do not port it. |

Both HTML files are self-contained references: all styling is inline, there is no build step, and
there is no application logic to read. Treat the markup as a spec for visual values only, and this
README as the spec for structure and behavior.
