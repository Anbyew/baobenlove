# Wedding Site — TODO

## Before Launch (must-have)

### 🪨 Deploy Moonboard backend to EC2
Moonboard page is committed (frontend) but the backend changes aren't live yet.

**What's needed:**
1. Start EC2 instance `i-0d1842a28a23b35ab` (currently stopped)
2. Deploy updated `server/db.js` + `server/index.js` (new `moonboard_holds` table + `/moonboard` endpoints, `pocket` shape) to EC2
3. `pm2 restart baobenlove`
4. Verify `/api/moonboard` works on the live site

---

### ⚠️ Gmail OAuth — Publish App (prevent 7-day token expiry)
The OAuth app is in Testing mode — refresh tokens expire after 7 days.

**What's needed:**
1. Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Click **Publish App** → Confirm
3. Gmail Send is a sensitive scope — Google shows a warning to users but no formal verification needed for personal use

---

### 👥 Replace test guest list with real one
When the real guest list is ready:
1. Replace `~/app/guests.tsv` on EC2 with the full list (same TSV format)
2. `ssh -i ~/Desktop/baobenlove-key.pem ubuntu@32.194.163.99`
3. `rm ~/app/server/data/wedding.db && pm2 restart baobenlove`
4. DB re-seeds automatically from the new TSV

**RSVP deadline:** August 1, 2026

---

## 🗄️ Database Migration (next big task)

Migrate from the current flat `invites` table to a fully normalized schema. Two open questions to resolve first:
1. **RSVP Guests** — per-member attendance tracking (`rsvp_guests` table), or household headcount only?
2. **Registry Items** — seed a curated list now, or just track click-throughs for now?

### New Schema

**`households`** — central entity
| Column | Notes |
|---|---|
| id, token | token = URL invite token |
| party_name, informal_name | |
| affiliation, relation | |
| max_adults | Hidden. Admin-set. Caps adult members + attendance |
| children_welcome | bool, default false |
| max_children | int nullable — null = uncapped |
| created_at | |

**`members`** — individuals within a household
| Column | Notes |
|---|---|
| id, household_id | |
| title | Mr. \| Mrs. \| Ms. \| Dr. \| Prof. |
| first_name, last_name, display_name | |
| email, phone | nullable |
| age_group | adult \| child \| infant |
| speaks_chinese | bool nullable |
| dietary_restrictions | text nullable |
| is_primary | main contact for household |
| created_at, updated_at | |

Rules: adult members ≤ `max_adults` · children only if `children_welcome` · guests cannot add beyond cap or edit cap

**`rsvp`** — one per household
| Column | Notes |
|---|---|
| id, household_id (UNIQUE) | |
| status | pending \| yes \| no |
| attending_adults, attending_children | adults ≤ max_adults |
| song_request, notes | |
| submitted_at, updated_at | |

**`rsvp_guests`** *(optional — see open question above)*
| Column | Notes |
|---|---|
| id, rsvp_id, member_id | |
| attending | bool |

**`registry_items`**
| Column | Notes |
|---|---|
| id, store, name, url | |
| price_range, priority | high \| medium \| low |
| is_active | bool |

**`registry_interactions`**
| Column | Notes |
|---|---|
| id, household_id (nullable), item_id (nullable) | |
| event_type | view \| click_out \| purchase_confirm |
| url, metadata JSON, created_at | |

**`sessions`** *(updated)*
| Column | Notes |
|---|---|
| id, token | |
| household_id, member_id (nullable) | which person in household |
| email, name, language | |
| created_at, expires_at, last_seen_at | |

**`events`** *(unchanged)*

### Relationships
```
households ──< members
           ──  rsvp ──< rsvp_guests >── members
           ──< registry_interactions >── registry_items
           ──< sessions >── members
           ──< events
```

### Implementation steps (once questions resolved)
1. Rewrite `server/db.js` — new schema, migrate TSV seeding to populate `households` + `members`
2. Update `server/index.js` — new endpoints for members, rsvp, registry
3. Build profile slide-over panel (guest-facing)
4. Build RSVP form update (household + per-member)
5. Wire registry click tracking

---

## Up Next (post-launch)

### 🎁 Personalized Display
Use household session to customize the site per guest.
- Show guest's name in greeting (e.g. "Welcome, Emily & Ben")
- Conditionally show China celebration details based on `affiliation` field

### 🛍️ Registry Tracking
Log which registry items guests click/view, tied to household session.

### 📋 RSVP
Already built — session system is live, just needs the real guest list.

---

## AWS Backend ✅
EC2 t2.micro (free tier) + SQLite + Express + PM2 + Nginx

- Instance ID: `i-0d1842a28a23b35ab`
- Elastic IP: `32.194.163.99` (static, free while running)
- Key: `~/Desktop/baobenlove-key.pem`
- App: `/home/ubuntu/app/server/`
- SSH: `ssh -i ~/Desktop/baobenlove-key.pem ubuntu@32.194.163.99`
- Restart: `pm2 restart baobenlove`
- Netlify proxies `baoben.love/api/*` → EC2
- Dev proxy: `vite.config.ts` forwards `localhost:5173/api/*` → EC2

**Query analytics:**
```bash
ssh -i ~/Desktop/baobenlove-key.pem ubuntu@32.194.163.99 \
  "sqlite3 ~/app/server/data/wedding.db 'SELECT * FROM events ORDER BY created_at DESC LIMIT 20;'"
```

**Query sessions:**
```bash
ssh -i ~/Desktop/baobenlove-key.pem ubuntu@32.194.163.99 \
  "sqlite3 ~/app/server/data/wedding.db 'SELECT email, name, created_at FROM sessions;'"
```

---

## Nice to Have

### 📸 Story page photos on live site
The `assets/Wedding Cherries/` folder is gitignored (738 MB) so proposal/story photos don't load on baoben.love.

**Options:**
- Upload selected photos to Cloudinary (free tier) and update photo URLs in `Story.tsx`
- Or resize/compress and commit a small set directly to git

### 🖼️ Gallery page
Currently exists as a route but content may need updating.

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
