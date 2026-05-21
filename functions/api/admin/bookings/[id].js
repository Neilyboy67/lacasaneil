// Single-booking admin endpoint: behind Cloudflare Access.
//   GET    /api/admin/bookings/:id   — fetch one Airtable booking
//   PATCH  /api/admin/bookings/:id   — update an Airtable booking
//   DELETE /api/admin/bookings/:id   — delete an Airtable booking

import { getBooking, updateBooking, deleteBooking } from "../../../_lib/airtable.js";
import { requireAccess, jsonResponse, readJsonBody } from "../../../_lib/access.js";

export const onRequestGet = async ({ request, env, params }) => {
  const unauth = requireAccess(request);
  if (unauth) return unauth;
  try {
    const booking = await getBooking(env, params.id);
    return jsonResponse({ booking });
  } catch (e) {
    return jsonResponse({ error: e.message }, 404);
  }
};

export const onRequestPatch = async ({ request, env, params }) => {
  const unauth = requireAccess(request);
  if (unauth) return unauth;

  const body = await readJsonBody(request);
  if (!body) return jsonResponse({ error: "invalid body" }, 400);

  const fields = pickBookingFields(body);
  if (body.guest_id !== undefined) {
    fields.guest_id = body.guest_id ? [body.guest_id] : [];
  }

  try {
    const booking = await updateBooking(env, params.id, fields);
    return jsonResponse({ booking });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
};

export const onRequestDelete = async ({ request, env, params }) => {
  const unauth = requireAccess(request);
  if (unauth) return unauth;
  try {
    await deleteBooking(env, params.id);
    return jsonResponse({ deleted: true });
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
    if (body[k] !== undefined && body[k] !== null) out[k] = body[k] === "" ? null : body[k];
  }
  return out;
}
