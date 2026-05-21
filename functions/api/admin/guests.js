// Admin guests endpoint: behind Cloudflare Access.
//   GET  /api/admin/guests  — list guests for the booking-edit dropdown
//   POST /api/admin/guests  — create a guest on the fly from the admin form

import { listGuests, createGuest } from "../../_lib/airtable.js";
import { requireAccess, jsonResponse, readJsonBody } from "../../_lib/access.js";

export const onRequestGet = async ({ request, env }) => {
  const unauth = requireAccess(request);
  if (unauth) return unauth;
  try {
    const guests = await listGuests(env);
    return jsonResponse({ guests });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
};

export const onRequestPost = async ({ request, env }) => {
  const unauth = requireAccess(request);
  if (unauth) return unauth;

  const body = await readJsonBody(request);
  if (!body) return jsonResponse({ error: "invalid body" }, 400);

  const allow = [
    "guest_id", "party_label", "primary_name", "email", "whatsapp",
    "country", "language_preference", "lifecycle_stage",
    "primary_source_channel", "party_type", "marketing_opt_in",
    "vip_flag", "notes",
  ];
  const fields = {};
  for (const k of allow) {
    if (body[k] !== undefined && body[k] !== "" && body[k] !== null) fields[k] = body[k];
  }
  if (!fields.primary_name && !fields.party_label) {
    return jsonResponse({ error: "primary_name or party_label required" }, 400);
  }

  try {
    const guest = await createGuest(env, fields);
    return jsonResponse({ guest });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
};
