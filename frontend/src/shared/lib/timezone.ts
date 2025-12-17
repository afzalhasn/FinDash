const IST_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MINUTES = 5 * 60 + 30;

type DateInput = Date | string;

const ensureDate = (value: DateInput): Date => (typeof value === 'string' ? new Date(value) : value);

export function formatIST(value: DateInput, options: { includeTime?: boolean } = {}): string {
  const date = ensureDate(value);
  const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: IST_TIMEZONE,
  });
  const formattedDate = dateFormatter.format(date);
  if (!options.includeTime) {
    return formattedDate;
  }
  const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: IST_TIMEZONE,
  });
  return `${formattedDate} • ${timeFormatter.format(date)}`;
}

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }
  return { year, month, day };
};

export function istBoundaryDate(value: string, { endOfDay = false } = {}): Date | undefined {
  const parts = parseDateInput(value);
  if (!parts) return undefined;
  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const utcMillis = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second);
  const adjusted = utcMillis - IST_OFFSET_MINUTES * 60 * 1000;
  return new Date(adjusted);
}

export function serializeISTBoundary(value: string, { endOfDay = false } = {}): string | undefined {
  const date = istBoundaryDate(value, { endOfDay });
  return date?.toISOString();
}
