// Oshxonaning mahalliy vaqt zonasi. Bu ATAYIN shu yerda qat'iy
// belgilangan (hardcode) — bu "sozlama" emas, texnik infratuzilma
// konstantasi (MUHIM PRINSIP #1 mahal vaqtlari/geofencing/yopiq
// kunlar/admin ID kabi BIZNES sozlamalariga tegishli, ular hamon
// to'liq AdminConfig/MealWindow orqali bazada saqlanadi).
const TIMEZONE = 'Asia/Tashkent';

const WEEKDAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function getPartsInTimezone(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  if (parts.hour === '24') parts.hour = '00';
  return parts;
}

function getTodayDateString(date = new Date()) {
  const p = getPartsInTimezone(date);
  return `${p.year}-${p.month}-${p.day}`;
}

function getCurrentHHMM(date = new Date()) {
  const p = getPartsInTimezone(date);
  return `${p.hour}:${p.minute}`;
}

function getWeekday(date = new Date()) {
  const p = getPartsInTimezone(date);
  return WEEKDAY_MAP[p.weekday];
}

function formatDateTime(date = new Date()) {
  return `${getTodayDateString(date)} ${getCurrentHHMM(date)}`;
}

module.exports = { TIMEZONE, getTodayDateString, getCurrentHHMM, getWeekday, formatDateTime };
