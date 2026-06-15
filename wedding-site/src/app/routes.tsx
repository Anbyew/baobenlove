import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Story } from "./pages/Story";
import { Details } from "./pages/Details";
import { Schedule } from "./pages/Schedule";
import { RSVPPage } from "./pages/RSVPPage";
import { Travel } from "./pages/Travel";
import { Registry } from "./pages/Registry";
import { Moonboard } from "./pages/Moonboard";
import { Garden } from "./pages/Garden";
import { Escape } from "./pages/Escape";
import { Climb } from "./pages/Climb";
import { FAQ } from "./pages/FAQ";
import { ProfilePage } from "./pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "story", Component: Story },
      { path: "details", Component: Details },
      { path: "schedule", Component: Schedule },
      { path: "rsvp", Component: RSVPPage },
      { path: "travel", Component: Travel },
      { path: "registry", Component: Registry },
      { path: "moonboard", Component: Moonboard },
      { path: "garden", Component: Garden },
      { path: "escape", Component: Escape },
      { path: "climb", Component: Climb },
      { path: "faq", Component: FAQ },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);
