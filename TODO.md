# Wedding Site — TODO

## Before Launch (must-have)

### 🔐 Email Auth Gate
Re-enable the guest email verification flow once Gmail OAuth is set up.

**What's needed:**
1. Go to [Google Cloud Console](https://console.cloud.google.com) → create/select a project
2. Enable the **Gmail API**
3. Create OAuth 2.0 credentials (Web application)
4. Add `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` to Netlify env vars
   - Site: https://app.netlify.com/projects/baobenlove/configuration/env
5. In `src/app/App.tsx`, uncomment `EmailAuthGate` (it's already wired up, just commented out)

**Files involved:**
- `src/app/App.tsx` — uncomment `<EmailAuthGate>`
- `src/app/components/EmailAuthGate.tsx` — frontend flow (complete)
- `netlify/functions/send-otp.mjs` — sends OTP via Gmail (complete)
- `netlify/functions/verify-otp.mjs` — verifies OTP (complete)
- `netlify/functions/lookup-by-email.mjs` — looks up guest on invite list (complete)

---

### 🗃️ Supabase (RSVP database)
Reactivate the paused Supabase project so RSVPs are saved.

**What's needed:**
1. Log into [supabase.com](https://supabase.com) → find project → click **Restore**
2. Verify env vars in Netlify are still valid (they were set previously):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_INVITES_TABLE`
3. Make sure `USE_MOCK_INVITES=false` in Netlify env vars
4. Test the RSVP page end-to-end

**RSVP deadline:** August 1, 2026

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
