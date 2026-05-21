// Shared 6-month calendar renderer used by /calendar/ (public) and /calendar/admin/.
// Reuses the .cal-* styles from /assets/site.css.

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

export function buildDateIndex(bookings) {
  // Map YYYY-MM-DD -> booking object (the one that covers that day)
  const idx = new Map();
  for (const b of bookings) {
    if (!b.check_in || !b.check_out) continue;
    const start = new Date(b.check_in + "T00:00:00Z");
    const end = new Date(b.check_out + "T00:00:00Z");
    for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
      idx.set(d.toISOString().slice(0, 10), b);
    }
  }
  return idx;
}

export function renderCalendar(opts) {
  const { container, bookings, months = 6, mode = "public", onDayClick } = opts;
  const idx = buildDateIndex(bookings);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  container.innerHTML = "";
  container.className = "cal-months";
  for (let m = 0; m < months; m++) {
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + m, 1));
    container.appendChild(buildMonth(monthStart, idx, todayStr, mode, onDayClick));
  }
}

function buildMonth(monthStart, idx, todayStr, mode, onDayClick) {
  const wrap = document.createElement("div");
  wrap.className = "cal-month";

  const title = document.createElement("div");
  title.className = "cal-month-title";
  title.textContent = `${MONTHS[monthStart.getUTCMonth()]} ${monthStart.getUTCFullYear()}`;
  wrap.appendChild(title);

  const wk = document.createElement("div");
  wk.className = "cal-weekdays";
  for (const w of WEEKDAYS) {
    const d = document.createElement("div");
    d.className = "cal-weekday";
    d.textContent = w;
    wk.appendChild(d);
  }
  wrap.appendChild(wk);

  const days = document.createElement("div");
  days.className = "cal-days";
  // Monday=0 .. Sunday=6
  const firstWeekday = (monthStart.getUTCDay() + 6) % 7;
  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement("div");
    blank.className = "cal-day empty";
    days.appendChild(blank);
  }
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
  for (let d = new Date(monthStart); d < monthEnd; d.setUTCDate(d.getUTCDate() + 1)) {
    const ds = d.toISOString().slice(0, 10);
    const cell = document.createElement("div");
    cell.className = "cal-day";
    cell.dataset.date = ds;
    cell.textContent = d.getUTCDate();

    const booking = idx.get(ds);
    const past = ds < todayStr;
    const isToday = ds === todayStr;

    if (booking) {
      cell.classList.add("booked");
      cell.dataset.source = (booking.source_channel || "Direct").toLowerCase();
      if (mode === "admin") {
        cell.title = labelFor(booking);
        cell.style.cursor = "pointer";
      } else {
        cell.title = "Booked";
      }
    } else if (!past) {
      cell.classList.add("available");
      if (mode === "admin") cell.style.cursor = "pointer";
    }
    if (past) cell.classList.add("past");
    if (isToday) cell.classList.add("today");

    if (mode === "admin" && onDayClick) {
      cell.addEventListener("click", () => onDayClick(ds, booking || null));
    }
    days.appendChild(cell);
  }
  wrap.appendChild(days);
  return wrap;
}

function labelFor(b) {
  const src = b.source_channel || "Direct";
  if (b.guest?.name) return `${b.guest.name} (${src})`;
  if (b.booking_id) return `${b.booking_id} (${src})`;
  return `Booked (${src})`;
}
