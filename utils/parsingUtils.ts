
/**
 * Parses a string like "84 cm", "84,5", or "8" into a number.
 * @param input The string or number to parse.
 * @returns A number if parsing is successful, otherwise null.
 */
export function parseCm(input: string | number | undefined): number | null {
  if (typeof input === 'number') {
    return isFinite(input) ? input : null;
  }
  if (typeof input !== 'string' || !input.trim()) {
      return null;
  }
  const cleaned = input.trim().replace(/\s+/g, '').replace(/,/, '.').replace(/cm$/i, '');
  const value = parseFloat(cleaned);
  return isFinite(value) && value > 0 ? value : null;
}
