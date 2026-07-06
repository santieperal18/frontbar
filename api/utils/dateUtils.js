const DEFAULT_BUSINESS_OFFSET_MINUTES = -180;

const businessOffsetMinutes = Number(
  process.env.BUSINESS_TIMEZONE_OFFSET_MINUTES || DEFAULT_BUSINESS_OFFSET_MINUTES
);

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseDateString(dateString) {
  const match = String(dateString || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

export function getBusinessDateString(date = new Date()) {
  const shifted = new Date(date.getTime() + businessOffsetMinutes * 60000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function addBusinessDays(dateString, days) {
  const parsed = parseDateString(dateString) || parseDateString(getBusinessDateString());
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function getBusinessDateRange(dateString = getBusinessDateString()) {
  const parsed = parseDateString(dateString) || parseDateString(getBusinessDateString());
  const startUtc = Date.UTC(parsed.year, parsed.month - 1, parsed.day) - businessOffsetMinutes * 60000;
  return {
    start: new Date(startUtc),
    end: new Date(startUtc + 24 * 60 * 60 * 1000 - 1)
  };
}

export function getBusinessDateRangeBetween(fechaDesde, fechaHasta) {
  const startRange = getBusinessDateRange(fechaDesde);
  const endRange = getBusinessDateRange(fechaHasta || fechaDesde);
  return {
    start: startRange.start,
    end: endRange.end
  };
}
