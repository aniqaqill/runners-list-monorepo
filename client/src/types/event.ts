/**
 * Event type matching the API/scraper schema
 */
export interface Event {
  name: string;
  location: string;
  state: string;
  distance: string;
  date: string;
  description: string;
  registration_url: string;
}

/**
 * Distance category for filtering
 */
export type DistanceCategory = '5km' | '10km' | '21km' | '42km' | '50km+' | 'other';

/**
 * Malaysian states for filtering
 */
export const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
] as const;

export type MalaysianState = (typeof MALAYSIAN_STATES)[number];

/**
 * Filter state for events
 */
export interface EventFilters {
  search: string;
  state: string;
  distance: string;
  month: string;
  quickFilter: 'all' | 'thisWeek' | 'thisMonth' | 'upcoming';
}
