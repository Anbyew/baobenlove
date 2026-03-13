
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
  
