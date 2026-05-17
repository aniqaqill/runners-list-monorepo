'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Event, EventFilters } from '@/types/event';
import {
  getUniqueStates,
  getUniqueDistances,
  isEventEnded,
  isThisWeek,
  isThisMonth,
} from '@/utils/loadEvents';
import EventCard from './event-card';
import FilterPanel from './filter-panel';

interface EventsGridProps {
  events: Event[];
}

/**
 * Events grid with filtering, archive toggle, and animations
 */
export default function EventsGrid({ events }: EventsGridProps) {
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    state: '',
    distance: '',
    month: '',
    quickFilter: 'upcoming', // Default to upcoming
  });
  const [showArchived, setShowArchived] = useState(false);

  // Get unique values for filter dropdowns
  const states = useMemo(() => getUniqueStates(events), [events]);
  const distances = useMemo(() => getUniqueDistances(events), [events]);

  // Separate past events (archived)
  const { upcomingEvents, archivedEvents } = useMemo(() => {
    const upcoming: Event[] = [];
    const archived: Event[] = [];
    events.forEach((event) => {
      if (isEventEnded(event.date)) {
        archived.push(event);
      } else {
        upcoming.push(event);
      }
    });
    return { upcomingEvents: upcoming, archivedEvents: archived };
  }, [events]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    // Start with upcoming or all events based on archive toggle
    const baseEvents = showArchived ? events : upcomingEvents;

    return baseEvents.filter((event) => {
      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesSearch =
          event.name.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.state.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // State filter
      if (filters.state && event.state !== filters.state) {
        return false;
      }

      // Distance filter
      if (filters.distance && event.distance !== filters.distance) {
        return false;
      }

      // Month filter
      if (filters.month) {
        const eventDate = new Date(event.date);
        if (eventDate.getMonth() !== parseInt(filters.month)) {
          return false;
        }
      }

      // Quick filters (only apply to non-archived view)
      if (!showArchived) {
        if (filters.quickFilter === 'thisWeek') {
          if (!isThisWeek(event.date)) return false;
        } else if (filters.quickFilter === 'thisMonth') {
          if (!isThisMonth(event.date)) return false;
        }
        // 'upcoming' and 'all' are handled by baseEvents selection
      }

      return true;
    });
  }, [events, upcomingEvents, filters, showArchived]);

  return (
    <div>
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        states={states}
        distances={distances}
        totalEvents={events.length}
        filteredCount={filteredEvents.length}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived(!showArchived)}
        archivedCount={archivedEvents.length}
      />

      {/* Events Grid */}
      <AnimatePresence mode="wait">
        {filteredEvents.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl">
              🏃
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No events found
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Try adjusting your filters or search query.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto"
          >
            {filteredEvents.map((event, index) => (
              <EventCard key={`${event.name}-${event.date}`} event={event} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
