import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Story } from "./pages/Story";
import { Details } from "./pages/Details";
import { Schedule } from "./pages/Schedule";
import { Gallery } from "./pages/Gallery";
import { RSVPPage } from "./pages/RSVPPage";
import { Travel } from "./pages/Travel";
import { Registry } from "./pages/Registry";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "story", Component: Story },
      { path: "details", Component: Details },
      { path: "schedule", Component: Schedule },
      { path: "gallery", Component: Gallery },
      { path: "rsvp", Component: RSVPPage },
      { path: "travel", Component: Travel },
      { path: "registry", Component: Registry },
    ],
  },
]);
