// lib/utils/date.ts
export const istDateString = (d = new Date()) => {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000) // shift UTC -> IST
  return ist.toISOString().slice(0, 10) // YYYY-MM-DD
}