// Fetch and parse the Airbnb iCal feed into booking-like objects.
// Each VEVENT is a contiguous booked range — Airbnb does not expose guest info via iCal.

export async function fetchAirbnbBookings(env) {
  const res = await fetch(env.AIRBNB_ICAL_URL, {
    headers: { "User-Agent": "lacasaneil.com calendar sync" },
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`Airbnb iCal fetch ${res.status}`);
  const text = await res.text();
  return parseICal(text);
}

function parseICal(text) {
  const out = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  for (const block of blocks) {
    const startMatch = block.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/);
    const endMatch = block.match(/DTEND(?:;VALUE=DATE)?:(\d{8})/);
    const uidMatch = block.match(/UID:([^\r\n]+)/);
    const summaryMatch = block.match(/SUMMARY:([^\r\n]+)/);
    if (!startMatch || !endMatch) continue;
    out.push({
      id: `airbnb:${uidMatch ? uidMatch[1].trim() : `${startMatch[1]}-${endMatch[1]}`}`,
      source_channel: "Airbnb",
      status: classifyStatus(startMatch[1], endMatch[1]),
      check_in: isoDate(startMatch[1]),
      check_out: isoDate(endMatch[1]),
      summary: summaryMatch ? summaryMatch[1].trim() : null,
      // PII-free flag for downstream consumers
      readOnly: true,
    });
  }
  return out;
}

function isoDate(s) {
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function classifyStatus(start8, end8) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  if (end8 <= today) return "Past";
  if (start8 <= today && today < end8) return "In-stay";
  return "Booked";
}
