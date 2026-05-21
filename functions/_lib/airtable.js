// Thin Airtable client for the Bookings + Guests tables.
// Env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_BOOKINGS_TABLE, AIRTABLE_GUESTS_TABLE

const API = "https://api.airtable.com/v0";

async function airtable(env, method, path, body) {
  const res = await fetch(`${API}/${env.AIRTABLE_BASE_ID}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.error?.message || `airtable ${res.status}`;
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return data;
}

async function airtablePaginated(env, path) {
  const records = [];
  let offset;
  do {
    const url = offset ? `${path}${path.includes("?") ? "&" : "?"}offset=${offset}` : path;
    const data = await airtable(env, "GET", url);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

export async function listBookings(env) {
  const records = await airtablePaginated(env, env.AIRTABLE_BOOKINGS_TABLE);
  return records.map(normalizeBooking);
}

export async function getBooking(env, id) {
  const data = await airtable(env, "GET", `${env.AIRTABLE_BOOKINGS_TABLE}/${id}`);
  return normalizeBooking(data);
}

export async function createBooking(env, fields) {
  const data = await airtable(env, "POST", env.AIRTABLE_BOOKINGS_TABLE, { fields });
  return normalizeBooking(data);
}

export async function updateBooking(env, id, fields) {
  const data = await airtable(env, "PATCH", `${env.AIRTABLE_BOOKINGS_TABLE}/${id}`, { fields });
  return normalizeBooking(data);
}

export async function deleteBooking(env, id) {
  return airtable(env, "DELETE", `${env.AIRTABLE_BOOKINGS_TABLE}/${id}`);
}

export async function listGuests(env) {
  const records = await airtablePaginated(env, env.AIRTABLE_GUESTS_TABLE);
  return records.map(r => ({ id: r.id, ...r.fields }));
}

export async function createGuest(env, fields) {
  const data = await airtable(env, "POST", env.AIRTABLE_GUESTS_TABLE, { fields });
  return { id: data.id, ...data.fields };
}

function normalizeBooking(r) {
  const f = r.fields || {};
  return {
    id: r.id,
    booking_id: f.booking_id || null,
    guest_id: Array.isArray(f.guest_id) ? f.guest_id[0] : null,
    source_channel: f.source_channel || null,
    status: f.status || null,
    check_in: f.check_in || null,
    check_out: f.check_out || null,
    nights: f.nights || null,
    party_size: f.party_size || null,
    adults: f.adults ?? null,
    children: f.children ?? null,
    infants: f.infants ?? null,
    total_eur: f.total_eur ?? null,
    paid_eur: f.paid_eur ?? null,
    balance_eur: f.balance_eur ?? null,
    payment_method: f.payment_method || null,
    confirmation_code: f.confirmation_code || null,
    notes: f.notes || null,
  };
}
