
  # Wedding website design

  This is a code bundle for Wedding website design. The original project is available at https://www.figma.com/design/cOlGzhfB7BFJfa2tI6UWnV/Wedding-website-design.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Analytics

  The site supports free Google Analytics 4 tracking plus hidden invite attribution for email clicks.

  Set `VITE_GA_MEASUREMENT_ID` before building or deploying:

  ```bash
  VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX npm run build
  ```

  If you email a link like `https://baoben.love/?src=save_the_date&guest=amy123&utm_source=save_the_date_email&utm_medium=email&utm_campaign=save_the_date`, the app will:
  - store `save_the_date` and `amy123` in local storage
  - remove `src` and `guest` from the visible URL immediately
  - send a one-time `save_the_date_click` event when the guest lands from the email link
  - attach `invite_source` and `guest_id` to later `page_view` events during that browser session

  In GA4, register custom dimensions for the `invite_source` and `guest_id` event parameters if you want to report on them in the dashboard.

  ## RSVP

  The `wedding-site` app now includes a household-based RSVP flow that is meant to run on Netlify with Supabase:

  - Guests arrive through a main-site invite link such as `https://baoben.love/?invite=<token>`
  - The app stores that invite token locally and keeps the household identity available across the site
  - The RSVP page can also look up a household by invitation name + allowed email
  - Netlify functions under `wedding-site/netlify/functions` read and update invitation records in Supabase

  ### Supabase setup

  Run the SQL in `wedding-site/supabase/schema.sql` to create the `invites` table.

  The current implementation expects one row per household with fields like:

  - `token`
  - `party_name`
  - `primary_email`
  - `secondary_email`
  - `guest_names` as a JSON array
  - `max_guests`

  ### Environment variables

  Frontend:

  ```bash
  VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
  VITE_RSVP_CONTACT_EMAIL=wedding@baokrakoff.com
  ```

  Netlify function environment:

  ```bash
  SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  SUPABASE_INVITES_TABLE=invites
  USE_MOCK_INVITES=false
  ```

  ### Local development

  The RSVP API lives in Netlify functions, so this flow is best tested with `netlify dev` from `wedding-site` rather than plain `vite`.

  If you want to test before creating Supabase tables, you can set `USE_MOCK_INVITES=true`.
  In that mode the Netlify functions read from `wedding-site/generated/invites/invite_manifest.json` and keep RSVP updates in memory for the current local session.

  ## Printed Invitations

  For hard-copy invitations, the recommended flow is:

  - print a QR code that points to `https://baoben.love/?invite=<token>`
  - also print a typed fallback like `baoben.love/rsvp`
  - if guests visit the fallback URL, they can identify themselves with the invitation name + allowed email

  A helper script is available at `wedding-site/scripts/generate_invite_assets.py`.

  Run it from the repo root:

  ```bash
  conda run -n cpj python wedding-site/scripts/generate_invite_assets.py
  ```

  It reads `emails/testList.csv` by default and writes:

  - `wedding-site/generated/invites/invite_manifest.json`
  - `wedding-site/generated/invites/printable_invites.csv`
  - `wedding-site/generated/invites/supabase_invites.csv`
  - `wedding-site/generated/invites/qr/*.png`

  The script reuses tokens from the existing manifest when possible, so you can rerun it without changing every household QR code.
  
