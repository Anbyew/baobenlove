import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Story } from "./pages/Story";
import { Details } from "./pages/Details";
import { Schedule } from "./pages/Schedule";
import { RSVPPage } from "./pages/RSVPPage";
import { Travel } from "./pages/Travel";
import { Registry } from "./pages/Registry";
import { Garden } from "./pages/Garden";
import { Escape } from "./pages/Escape";
import { FAQ } from "./pages/FAQ";
import { ProfilePage } from "./pages/ProfilePage";
import { SeatingChart } from "./backdoor/pages/SeatingChart";
import { Backdoor } from "./backdoor/pages/Backdoor";
import { MasterTimeline } from "./backdoor/pages/MasterTimeline";
import { SetupChecklist } from "./backdoor/pages/SetupChecklist";
import { KeyInfo } from "./backdoor/pages/KeyInfo";
import { AdminDashboard } from "./backdoor/pages/admin/AdminDashboard";
import { AdminSeatingChart } from "./backdoor/pages/admin/SeatingChart";
import { PackingList } from "./backdoor/pages/admin/PackingList";

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
      { path: "garden", Component: Garden },
      { path: "dance", Component: Escape },
      { path: "escape", Component: Escape },
      { path: "faq", Component: FAQ },
      { path: "profile", Component: ProfilePage },
    ],
  },
  { path: "/backdoor", Component: Backdoor },
  { path: "/backdoor/timeline", Component: MasterTimeline },
  { path: "/backdoor/setup", Component: SetupChecklist },
  { path: "/backdoor/info", Component: KeyInfo },
  // Admin group — each of these is wrapped in BackdoorGate + AdminGate
  // (its own two gates), so none of them is reachable without both the
  // backdoor password/email login AND the Admin password, even by direct URL.
  { path: "/backdoor/admin/dashboard", Component: AdminDashboard },
  { path: "/backdoor/admin/seating", Component: AdminSeatingChart },
  { path: "/backdoor/admin/packing", Component: PackingList },
  // Vendor-facing path — no backdoor/admin gate at all, just the seating
  // chart's own vendor password, so an outside florist/coordinator can use
  // it without owner access.
  { path: "/vendor/seating", Component: SeatingChart },
]);
