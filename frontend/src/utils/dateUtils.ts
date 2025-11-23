// Utility functions for Persian date formatting and currency

/**
 * Converts a date to Persian (Jalali) format
 * Format: YYYY/MM/DD
 */
export function formatPersianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'

  // Simple conversion to Jalali (Persian) calendar
  // This is a simplified version - for production, use a library like moment-jalaali or date-fns-jalali
  const gregorianYear = d.getFullYear()
  const gregorianMonth = d.getMonth() + 1
  const gregorianDay = d.getDate()

  // Convert Gregorian to Jalali
  const jalali = gregorianToJalali(gregorianYear, gregorianMonth, gregorianDay)

  return `${jalali.year}/${String(jalali.month).padStart(2, '0')}/${String(jalali.day).padStart(2, '0')}`
}

/**
 * Converts Gregorian date to Jalali (Persian) date
 */
function gregorianToJalali(gy: number, gm: number, gd: number): { year: number; month: number; day: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let jy = gy <= 1600 ? 0 : 979
  let gy2 = gy > 1600 ? gy - 1600 : gy - 621
  let days =
    (365 * gy2 +
      Math.floor((gy2 + 3) / 4) -
      Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400) -
      80 +
      gd +
      g_d_m[gm - 1]) -
    (gy > 1600 ? 0 : 226899)

  jy += 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  jy += Math.floor((days - 1) / 365)

  if (days > 365) days = (days - 1) % 365
  let jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  let jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30)

  return { year: jy, month: jm, day: jd }
}

/**
 * Formats a number as Iranian Rial currency
 */
export function formatRial(amount: number): string {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats a number as Iranian Rial currency without currency symbol
 * Returns: "1,234,567 ریال"
 */
export function formatRialSimple(amount: number, includeRial: boolean = true): string {
  const formatted = new Intl.NumberFormat('fa-IR').format(amount)
  return includeRial ? formatted + ' ریال' : formatted
}

/**
 * Parses a Persian date string (YYYY/MM/DD) to Gregorian date
 */
export function parsePersianDate(persianDate: string): { year: number; month: number; day: number } {
  const parts = persianDate.split('/')
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  }
}

/**
 * Converts Jalali (Persian) date to Gregorian date
 */
function jalaliToGregorian(jy: number, jm: number, jd: number): { year: number; month: number; day: number } {
  const gy = jy <= 979 ? 621 : 1600
  let jy2 = jy <= 979 ? 0 : jy - 979
  let days = (365 * jy2) + (Math.floor(jy2 / 33) * 8) + Math.floor(((jy2 % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186)
  let gy2 = gy + 400 * Math.floor(days / 146097)
  days %= 146097
  if (days > 36524) {
    gy2 += 100 * Math.floor(--days / 36524)
    days %= 36524
    if (days >= 365) days++
  }
  gy2 += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    gy2 += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let gd = days + 1
  const sal_a = [0, 31, ((gy2 % 4 === 0 && gy2 % 100 !== 0) || (gy2 % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let gm = 0
  while (gm < 13 && gd > sal_a[gm]) {
    gd -= sal_a[gm]
    gm++
  }
  return { year: gy2, month: gm, day: gd }
}

/**
 * Converts a Persian date string (YYYY/MM/DD) to a Gregorian Date object
 */
export function parsePersianDateToDate(persianDate: string): Date {
  const { year, month, day } = parsePersianDate(persianDate)
  const gregorian = jalaliToGregorian(year, month, day)
  return new Date(gregorian.year, gregorian.month - 1, gregorian.day)
}

