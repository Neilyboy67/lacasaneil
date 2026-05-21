// Outbound iCal feed at https://lacasaneil.com/calendar.ics
// Airbnb subscribes to this URL in its listing-calendar settings so direct
// bookings created in Airtable get pushed out (Airbnb refetches every few hours).
//
// We deliberately EXCLUDE Airbnb-channel rows from Airtable to avoid loops.

import { listBookings } from "./_lib/airtable.js";

export const onRequestGet = async ({ env }) => {
  let bookings = [];
  try {
    bookings = await listBookings(env);
  } catch (e) {
    return new Response(`# fetch failed: ${e.message}\n`, {
      status: 500,
      headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
  }

  const exportable = bookings
    .filter(b => b.check_in && b.check_out)
    .filter(b => (b.source_channel || "").toLowerCase() !== "airbnb");

  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//La Casa Neil//Calendar 1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:La Casa Neil — Direct bookings",
    "X-WR-TIMEZONE:Europe/Madrid",
  ];

  for (const b of exportable) {
    const uid = `${b.booking_id || b.id}@lacasaneil.com`;
    const dtstart = b.check_in.replace(/-/g, "");
    const dtend = b.check_out.replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:Reserved (${b.source_channel || "Direct"})`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": "inline; filename=\"lacasaneil.ics\"",
    },
  });
};
