// Public read-only bookings endpoint.
// Returns the merged Airbnb + Airtable bookings list with NO PII —
// just the date range and source channel per booking. Safe to expose unauthenticated.

import { listBookings } from "../_lib/airtable.js";
import { fetchAirbnbBookings } from "../_lib/airbnb-ical.js";

export const onRequestGet = async ({ env }) => {
  const [airtable, airbnb] = await Promise.all([
    listBookings(env).catch(() => []),
    fetchAirbnbBookings(env).catch(() => []),
  ]);

  // Drop Airbnb-channel rows from Airtable to avoid double-counting against the iCal source.
  const airtableNonAirbnb = airtable
    .filter(b => b.check_in && b.check_out)
    .filter(b => (b.source_channel || "").toLowerCase() !== "airbnb");

  const merged = [
    ...airtableNonAirbnb.map(b => ({
      id: `airtable:${b.id}`,
      source_channel: b.source_channel || "Direct",
      status: b.status,
      check_in: b.check_in,
      check_out: b.check_out,
    })),
    ...airbnb.map(b => ({
      id: b.id,
      source_channel: "Airbnb",
      status: b.status,
      check_in: b.check_in,
      check_out: b.check_out,
    })),
  ];

  return new Response(JSON.stringify({ bookings: merged }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
};
