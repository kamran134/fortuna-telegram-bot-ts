/**
 * Validation utilities
 */

/**
 * Validate game creation format
 * Expected format: DD.MM.YYYY/HH:MM/HH:MM/limit/location/label
 */
export function validateGameFormat(text: string): boolean {
  const parts = text.split('/');
  if (parts.length !== 6) return false;

  const [date, start, end, limit, location, label] = parts;

  // Validate date format (DD.MM.YYYY)
  const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (!dateRegex.test(date)) return false;

  // Validate time format (HH:MM)
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(start) || !timeRegex.test(end)) return false;

  // Validate limit is a number
  if (isNaN(Number(limit)) || Number(limit) <= 0) return false;

  // Validate location and label are not empty
  if (!location.trim() || !label.trim()) return false;

  return true;
}

/**
 * Parse game creation command
 */
export function parseGameCommand(text: string): {
  date: string;
  start: string;
  end: string;
  users_limit: number;
  location: string;
  label: string;
} | null {
  const parts = text.split('/');
  if (parts.length !== 6) return null;

  const [date, start, end, limit, location, label] = parts;

  return {
    date: date.trim(),
    start: start.trim(),
    end: end.trim(),
    users_limit: parseInt(limit.trim(), 10),
    location: location.trim(),
    label: label.trim(),
  };
}

/**
 * Validate user edit format
 * Expected format: userId/firstName/lastName/fullnameAz
 */
export function validateUserEditFormat(text: string): boolean {
  const parts = text.split('/');
  return parts.length >= 2 && !isNaN(Number(parts[0]));
}

/**
 * Parse user edit command
 */
export function parseUserEditCommand(text: string): {
  userId: number;
  firstName?: string;
  lastName?: string;
  fullnameAz?: string;
} | null {
  const parts = text.split('/');
  if (parts.length < 2) return null;

  const userId = parseInt(parts[0], 10);
  if (isNaN(userId)) return null;

  return {
    userId,
    firstName: parts[1]?.trim() || undefined,
    lastName: parts[2]?.trim() || undefined,
    fullnameAz: parts[3]?.trim() || undefined,
  };
}

/**
 * Validate change limit format
 * Expected format: label/limit
 */
export function validateChangeLimitFormat(text: string): boolean {
  const parts = text.split('/');
  return parts.length === 2 && !isNaN(Number(parts[1]));
}

/**
 * Parse change limit command
 */
export function parseChangeLimitCommand(text: string): {
  label: string;
  limit: number;
} | null {
  const parts = text.split('/');
  if (parts.length !== 2) return null;

  const limit = parseInt(parts[1], 10);
  if (isNaN(limit)) return null;

  return {
    label: parts[0].trim(),
    limit,
  };
}
