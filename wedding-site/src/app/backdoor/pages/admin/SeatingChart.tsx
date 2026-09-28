import { useEffect } from 'react';
import { BackdoorGate } from '../../components/BackdoorGate';
import { AdminGate } from '../../components/AdminGate';
import { SeatingChart } from '../SeatingChart';
import { SEATING_VENDOR_AUTH_KEY } from '../../lib/backdoor';

// The owner-facing path to the seating chart. The base <SeatingChart>
// component (pages/SeatingChart.tsx) is dual-purpose: it's also served
// directly at /vendor/seating with no backdoor/admin gate at all, so an
// outside florist/coordinator can use it with just the vendor password.
// This wrapper adds the backdoor + admin gates for the owner path, then
// pre-unlocks that same vendor password so owners aren't asked twice.
export function AdminSeatingChart() {
  useEffect(() => {
    localStorage.setItem(SEATING_VENDOR_AUTH_KEY, 'true');
  }, []);

  return (
    <BackdoorGate>
      <AdminGate>
        <SeatingChart />
      </AdminGate>
    </BackdoorGate>
  );
}
