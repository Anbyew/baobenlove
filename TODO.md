# Wedding Site — TODO

## ✅ Done

### Gmail OAuth — Publish App (prevent 7-day token expiry)
Generated a new refresh token, installed on EC2, restarted server. `/send-otp` confirmed working again. (Double-check the OAuth consent screen is set to "Published" under the Audience tab in Google Cloud Console — if it's still "Testing," this token may expire again in ~7 days.)

### Verify login & session flow end-to-end
Ran the full flow against the live EC2 backend with a real inbox:
1. ✅ Invite token lookup → OTP email sent
2. ✅ OTP verified → session created, household identified correctly ("Dr. Emily Bao and Dr. Ben Bao")
3. ✅ Session validates via `session/validate` (30-day TTL implemented in `server/db.js`, not separately time-tested)
4. ✅ Either email in a household (`bellabenbao@gmail.com` / `baobaoyuwei@gmail.com`) logs in to the same household session

Testing with real (non-test) guest entries will happen naturally once the real guest list is loaded (see below).

---

## 📋 Can Wait (post-launch)

### 👥 Replace test guest list with real one
When the real guest list is ready:
1. Replace `~/app/guests.tsv` on EC2 with the full list (same TSV format)
2. `ssh baobenlove`
3. `rm ~/app/server/data/wedding.db && pm2 restart baobenlove`
4. DB re-seeds automatically from the new TSV
5. Smoke-test login with a couple of real guest emails to confirm OTP + session flow works for the real list

**RSVP deadline:** August 1, 2026

---

### 📋 Finish RSVP
Form and session system are built (see Done ✅) — once the real guest list is loaded, do an end-to-end test: invite lookup, household-aware OTP login, submitting attendance/dietary/song request, and confirming it persists correctly in the DB.

---

### 🛍️ Finish Registry (incl. Venmo)
Registry page currently only links out to the Moonboard and Garden fund pages — decide if that's the final design or if a traditional registry (stores, honeymoon fund, etc.) should be added back, then build it out.

**Venmo connection (@baobenlove):** Moonboard and Garden funding both deep-link to `venmo://paycharge` / `venmo.com/baobenlove` (`wedding-site/src/app/lib/venmo.ts`). Confirm:
1. The `@baobenlove` Venmo account exists and is set up to receive payments
2. The deep link / fallback URL actually opens and prefills correctly on mobile + desktop
3. Either Yuwei or Ben can see incoming payments and match them to guest names/messages

---

## 🗄️ Database Migration (next big task)

Migrate from the current flat `invites` table to a normalized schema. Design decisions resolved:
- **RSVP**: one shared decision per household (status: pending/yes/no), editable until the deadline. `rsvp_guests` records *which* members are covered by that single RSVP (for per-person dietary/seating detail) — not separate per-person yes/no votes.
- **Registry items**: skipped for now — Registry page is just Moonboard/Garden/Movement-game links, and click-tracking via `events` already covers visibility. Add a `registry_items` table later if a traditional store registry gets built.

### New Schema

**`households`** — replaces `invites`
| Column | Notes |
|---|---|
| id, token | token = URL invite token |
| party_name, informal_name | |
| affiliation, relation | |
| max_adults | hidden cap |
| max_children | int, default 0 — `max_children > 0` implies children welcome |
| rehearsal_dinner | bool, default false — drives the rehearsal dinner section (see Up Next) |
| created_at | |

**`household_emails`** — split out from members for login lookup
| Column | Notes |
|---|---|
| id, household_id | |
| email | indexed — OTP login matches any email in household |

Why separate: TSV emails and guest names are loose comma-separated lists with no guaranteed 1:1 mapping. Login is household-level ("any email in household works"), so keep that lookup decoupled from per-person `members`.

**`members`** — individuals, for RSVP/display/personalization
| Column | Notes |
|---|---|
| id, household_id | |
| title, first_name, last_name, display_name | |
| age_group | adult \| child \| infant |
| speaks_chinese | bool nullable |
| dietary_restrictions | text nullable |
| created_at, updated_at | |

(no `email`/`phone`, no `is_primary` — login emails live in `household_emails`; revisit `is_primary` if a "main contact" feature is ever needed)

**`rsvp`** — one per household, editable until deadline
| Column | Notes |
|---|---|
| id, household_id (UNIQUE) | |
| status | pending \| yes \| no — the single shared decision |
| song_request, notes | |
| submitted_at, updated_at | updated_at bumps on every edit |

**`rsvp_guests`** — which members are covered by the household's RSVP
| Column | Notes |
|---|---|
| id, rsvp_id, member_id | |
| attending | bool |

Rule: when `rsvp.status = 'no'`, `rsvp_guests` can be empty/ignored. When `'yes'`, one row per attending member.

**`sessions`** *(updated)*
| Column | Notes |
|---|---|
| id, token | |
| household_id, member_id (nullable) | |
| email, name, language | |
| created_at, expires_at, last_seen_at | |

**`events`** / **`moonboard_holds`** — unchanged (just `invite_id` → `household_id`)

### Relationships
```
households ──< household_emails
           ──< members
           ──  rsvp ──< rsvp_guests >── members
           ──< sessions
           ──< events
```

### Migration plan
Since this touches live `sessions` and `invites` data:
1. Write a one-time backfill script: for each `invites` row → create `households` row, split `emails` JSON → `household_emails`, split `guest_names` JSON → `members`, and if `attendance` is already set, create the corresponding `rsvp`/`rsvp_guests` rows
2. Run backfill, verify row counts match
3. Rewrite `server/db.js` — new schema + TSV seeding → `households`/`household_emails`/`members`
4. Update `server/index.js` — new endpoints for members, rsvp
5. Build profile slide-over panel (guest-facing)
6. Update RSVP form for household + per-member

---

## Up Next (post-launch)

### 🎁 Personalized Display
Use household session to customize the site per guest.
- Show guest's name in greeting (e.g. "Welcome, Emily & Ben")
- Conditionally show China celebration details based on `affiliation` field

### 🍽️ Rehearsal Dinner (invite-dependent)
Some guests are invited to the rehearsal dinner, others aren't.
- Add a `rehearsal_dinner` flag (per household, in invites/guest list)
- Add rehearsal dinner info (date, time, location) to the **Details** page
- Conditionally show that section only to guests whose household has the flag, based on their logged-in session

### 🛍️ Registry Tracking
Log which registry items guests click/view, tied to household session.

### 🎮 New Registry Fund Page — "Movement" Game
A third interactive fund page (alongside Moonboard + Garden), with a funny/movement theme. Two ideas, both pending refinement:

1. **"Escape the Reception"** — a cartoon getaway car/scooter races down a road toward "HONEYMOON." Guests fund removing comedic obstacles in its path (in-laws with confetti cannons, forgotten passport, Uber "3 minutes away" for 45 min, DJ playing one more song). Each funded obstacle gets crossed out with a "POOF" and the car lurches forward. Guests can leave a snarky note on the obstacle they cleared.
   - Pro: broadly funny, doesn't need inside-joke context, obstacle list is easy to personalize
2. **"Drag Ben Up the Mountain"** — pixel-art Ben scrambles up a mountain (nod to climbing/Moonboard theme) toward a honeymoon flag at the top. Guests fund "boosts" (donut, coffee, motivational yell from Yuwei) that bump him up the slope with goofy captions.
   - Pro: ties into climbing theme, affectionately roasts Ben

Both liked — to refine: pick one (or do both?), define funding tiers/amounts, obstacle/boost list, visuals (reuse Garden/Moonboard drag-and-drop + SVG patterns), and Venmo integration.

---

## AWS Backend ✅
EC2 t2.micro (free tier) + SQLite + Express + PM2 + Nginx

- Instance ID: `i-0d1842a28a23b35ab`
- Elastic IP: `32.194.163.99` (static, free while running)
- Key: `~/.ssh/baobenlove-key.pem`
- App: `/home/ubuntu/app/server/`
- SSH: `ssh baobenlove` (alias configured in `~/.ssh/config`)
- Restart: `pm2 restart baobenlove`
- Netlify proxies `baoben.love/api/*` → EC2
- Dev proxy: `vite.config.ts` forwards `localhost:5173/api/*` → EC2

**Query analytics:**
```bash
ssh baobenlove \
  "sqlite3 ~/app/server/data/wedding.db 'SELECT * FROM events ORDER BY created_at DESC LIMIT 20;'"
```

**Query sessions:**
```bash
ssh baobenlove \
  "sqlite3 ~/app/server/data/wedding.db 'SELECT email, name, created_at FROM sessions;'"
```

---

## Nice to Have

### 🖼️ Gallery page
`Gallery.tsx` exists but is **not wired into `routes.tsx`** (unreachable) and expects 36 images at `/gallery/img_1.jpg`–`img_36.jpg`, which don't exist in `wedding-site/public/`. Either finish it (add route + images) or remove the dead file.

---

## Done ✅
- Cormorant Garamond + Jost fonts
- Scroll-triggered reveal animations
- Parallax home page hero
- Text clip reveal on names
- Page loader (one-time per session)
- Diamond custom cursor
- White-gold shimmer on latin phrase
- Q&A page
- Netlify deployment
- DNS cutover from GitHub Pages → Netlify (baoben.love)
- EC2 backend (Express + SQLite) deployed and running
- Gmail OAuth configured on EC2
- Netlify → EC2 API proxy configured
- Frontend API calls updated from Netlify Functions → `/api`
- Household-aware OTP auth (any email in household works)
- 30-day server-side sessions (no re-auth on return visits)
- Page view analytics logged to EC2 SQLite with household ID
- Vite dev proxy for local full-stack testing
- Moonboard (Climbing Board Fund) — backend deployed to EC2, live and verified
- Story page photos (`Wedding Cherries Web`, 14MB) committed to git, loading on live site
- Garden fund page added, linked from Registry alongside Moonboard
