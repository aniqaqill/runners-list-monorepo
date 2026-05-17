import type { Event } from '@/types/event';

// Malaysia timezone offset in hours (UTC+8)
const MALAYSIA_TIMEZONE_OFFSET = 8;

/**
 * Get current date in Malaysia timezone as date-only components
 * This ensures consistent date comparison regardless of server timezone
 */
const getMalaysiaDateComponents = (): { year: number; month: number; day: number } => {
  const now = new Date();
  // Add Malaysia offset to get Malaysia local time in UTC representation
  const malaysiaTime = new Date(now.getTime() + MALAYSIA_TIMEZONE_OFFSET * 60 * 60 * 1000);
  return {
    year: malaysiaTime.getUTCFullYear(),
    month: malaysiaTime.getUTCMonth(),
    day: malaysiaTime.getUTCDate(),
  };
};

/**
 * Parse event date string (YYYY-MM-DD or ISO format) into date components
 * Handles both "2026-01-26" and "2026-01-26T00:00:00Z" formats
 */
const parseEventDate = (dateString: string): { year: number; month: number; day: number } => {
  // Extract just the date part (YYYY-MM-DD)
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return { year, month: month - 1, day }; // month is 0-indexed for Date.UTC
};

/**
 * Get UTC timestamp for a date (midnight)
 */
const getDateTimestamp = (year: number, month: number, day: number): number => {
  return Date.UTC(year, month, day);
};

/**
 * Load events from the API
 * Sorts by date (upcoming first) and filters out past events optionally
 */
export const loadEvents = async (): Promise<Event[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Helper to sort events
  const sortEvents = (data: Event[]) => {
    return data.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Try fetching from API if URL is present
  if (apiUrl) {
    try {
      // Append /races when NEXT_PUBLIC_API_URL is the API v1 base (e.g. http://localhost:8080/api/v1)
      const res = await fetch(`${apiUrl}/races`, { next: { revalidate: 60 } });
      if (res.ok) {
        const response = await res.json();
        // API returns { data: [...], error: false }
        const remoteEvents = response.data || response;
        if (Array.isArray(remoteEvents)) {
          return sortEvents(remoteEvents);
        }
      }
      console.error('API response error:', res.statusText);
    } catch (err) {
      console.error('Failed to fetch events from API:', err);
    }
  }

  // Return empty array if API fails or no URL
  return [];
};

/**
 * Get unique states from events for filter dropdown
 */
export const getUniqueStates = (events: Event[]): string[] => {
  const states = events
    .map((e) => e.state)
    .filter((s) => s && s.trim() !== '');
  return [...new Set(states)].sort();
};

/**
 * Get unique distances from events for filter chips
 */
export const getUniqueDistances = (events: Event[]): string[] => {
  const distances = events
    .map((e) => e.distance)
    .filter((d) => d && d.trim() !== '');
  return [...new Set(distances)].sort((a, b) => {
    // Sort by numeric value
    const numA = parseInt(a) || 999;
    const numB = parseInt(b) || 999;
    return numA - numB;
  });
};

/**
 * Check if event has ended (timezone-aware for Malaysia)
 */
export const isEventEnded = (dateString: string): boolean => {
  const event = parseEventDate(dateString);
  const today = getMalaysiaDateComponents();
  
  const eventTimestamp = getDateTimestamp(event.year, event.month, event.day);
  const todayTimestamp = getDateTimestamp(today.year, today.month, today.day);
  
  return eventTimestamp < todayTimestamp;
};

/**
 * Check if event is this week (timezone-aware for Malaysia)
 */
export const isThisWeek = (dateString: string): boolean => {
  const event = parseEventDate(dateString);
  const today = getMalaysiaDateComponents();
  
  const eventTimestamp = getDateTimestamp(event.year, event.month, event.day);
  const todayTimestamp = getDateTimestamp(today.year, today.month, today.day);
  const weekFromNowTimestamp = todayTimestamp + 7 * 24 * 60 * 60 * 1000;
  
  return eventTimestamp >= todayTimestamp && eventTimestamp <= weekFromNowTimestamp;
};

/**
 * Check if event is this month (timezone-aware for Malaysia)
 */
export const isThisMonth = (dateString: string): boolean => {
  const event = parseEventDate(dateString);
  const today = getMalaysiaDateComponents();
  
  return event.year === today.year && event.month === today.month;
};

/**
 * Format date for display
 * Uses explicit date components to avoid timezone parsing issues
 */
export const formatEventDate = (dateString: string): string => {
  const event = parseEventDate(dateString);
  // Create date at noon UTC to avoid any DST/timezone edge cases during formatting
  const date = new Date(Date.UTC(event.year, event.month, event.day, 12, 0, 0));
  return date.toLocaleDateString('en-MY', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  });
};

/**
 * Get days until event (timezone-aware for Malaysia)
 */
export const getDaysUntil = (dateString: string): number => {
  const event = parseEventDate(dateString);
  const today = getMalaysiaDateComponents();
  
  const eventTimestamp = getDateTimestamp(event.year, event.month, event.day);
  const todayTimestamp = getDateTimestamp(today.year, today.month, today.day);
  
  return Math.ceil((eventTimestamp - todayTimestamp) / (1000 * 60 * 60 * 24));
};