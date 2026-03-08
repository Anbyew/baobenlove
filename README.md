
  # Wedding website design

  This is a code bundle for Wedding website design. The original project is available at https://www.figma.com/design/cOlGzhfB7BFJfa2tI6UWnV/Wedding-website-design.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Analytics

  The site supports free Google Analytics 4 tracking plus hidden invite-source attribution.

  Set `VITE_GA_MEASUREMENT_ID` before building or deploying:

  ```bash
  VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX npm run build
  ```

  If you email a link like `https://baoben.love/?src=email_batch_a`, the app will:
  - store `email_batch_a` in local storage
  - remove `src` from the visible URL immediately
  - send `invite_source_captured` and `page_view` events to GA4

  In GA4, register a custom dimension for the `invite_source` event parameter if you want to report on it in the dashboard.
  
