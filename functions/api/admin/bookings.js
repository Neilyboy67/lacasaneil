// Admin bookings endpoint: behind Cloudflare Access.
//   GET  /api/admin/bookings          — full list with all fields (Airtable + Airbnb)
//   POST /api/admin/bookings          — create a booking in Airtable

import { listBookings, createBooking, listGuests } from "../../_lib/airtable.js";
import { fetchAirbnbBookings } from "../../_lib/airbnb-ical.js";
import { requireAccess, jsonResponse, readJsonBody } from "../../_lib/access.js";

export const onRequestGet = async ({ request, env }) => {
  const unauth = requireAccess(request);
  if (unauth) return unauth;

  const [airtable, airbnb, guests] = await Promise.all([
    listBookings(env).catch(e => ({ error: e.message })),
    fetchAirbnbBookings(env).catch(e => ({ error: e.message })),
    listGuests(env).catch(() => []),
  ]);

  if (airtable.error) return jsonResponse({ error: airtable.error }, 500);

  const guestById = Object.fromEntries(guests.map(g => [g.id, g]));

  const airtableEnriched = airtable.map(b => ({
    ...b,
    id: `airtable:${b.id}`,
    airtable_record_id: b.id,
    guest: b.guest_id ? {
      id: b.guest_id,
      name: guestById[b.guest_id]?.primary_name || guestById[b.guest_id]?.party_label || null,
      email: guestById[b.guest_id]?.email || null,
      whatsapp: guestById[b.guest_id]?.whatsapp || null,
    } : null,
  }));

  return jsonResponse({
    bookings: [...airtableEnriched, ...(Array.isArray(airbnb) ? airbnb : [])],
    guests,
  });
};

export const onRequestPost = async ({ request, env }) => {
  const unauth = requireAccess(request);
  if (unauth) return unauth;

  const body = await readJsonBody(request);
  if (!body) return jsonResponse({ error: "invalid body" }, 400);

  const fields = pickBookingFields(body);
  if (!fields.check_in || !fields.check_out) {
    return jsonResponse({ error: "check_in and check_out required" }, 400);
  }
  if (body.guest_id) fields.guest_id = [body.guest_id];

  try {
    const booking = await createBooking(env, fields);
    return jsonResponse({ booking });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
};

function pickBookingFields(body) {
  const allow = [
    "booking_id", "source_channel", "status",
    "check_in", "check_out", "party_size",
    "adults", "children", "infants",
    "total_eur", "paid_eur", "balance_eur",
    "payment_method", "confirmation_code", "notes",
  ];
  const out = {};
  for (const k of allow) {
    if (body[k] !== undefined && body[k] !== "" && body[k] !== null) out[k] = body[k];
  }
  return out;
}
