'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, Archive, Sparkles, Zap, CalendarDays, Grid3X3 } from 'lucide-react';
import type { EventFilters } from '@/types/event';

interface FilterPanelProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  states: string[];
  distances: string[];
  totalEvents: number;
  filteredCount: number;
  showArchived: boolean;
  onToggleArchived: () => void;
  archivedCount: number;
}

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: '0', label: 'Jan' },
  { value: '1', label: 'Feb' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Apr' },
  { value: '4', label: 'May' },
  { value: '5', label: 'Jun' },
  { value: '6', label: 'Jul' },
  { value: '7', label: 'Aug' },
  { value: '8', label: 'Sep' },
  { value: '9', label: 'Oct' },
  { value: '10', label: 'Nov' },
  { value: '11', label: 'Dec' },
];

const QUICK_FILTERS = [
  { value: 'upcoming', label: 'Upcoming', icon: Sparkles },
  { value: 'thisWeek', label: 'This Week', icon: Zap },
  { value: 'thisMonth', label: 'This Month', icon: CalendarDays },
  { value: 'all', label: 'All', icon: Grid3X3 },
] as const;

/**
 * GeckoTerminal-inspired filter panel with glassmorphism
 */
export default function FilterPanel({
  filters,
  onFiltersChange,
  states,
  distances,
  filteredCount,
  showArchived,
  onToggleArchived,
  archivedCount,
}: FilterPanelProps) {
  const hasActiveFilters =
    filters.search ||
    filters.state ||
    filters.distance ||
    filters.month;

  return (
    <div className="space-y-4 mb-8">
      {/* Search Bar with glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300" />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-purple-500" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-fluid-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 dark:focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
          />
          {filters.search && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-200/80 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Quick Filters - Pill style with micro-interactions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10">
          {QUICK_FILTERS.map((qf) => {
            const Icon = qf.icon;
            const isActive = filters.quickFilter === qf.value;
            return (
              <motion.button
                key={qf.value}
                onClick={() => onFiltersChange({ ...filters, quickFilter: qf.value })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative px-3 py-2 rounded-xl text-fluid-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/25"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? '' : ''}`} />
                <span className="relative z-10">{qf.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent hidden sm:block" />

        {/* Dropdown Filters with enhanced styling */}
        <motion.select
          whileHover={{ scale: 1.02 }}
          value={filters.state}
          onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-fluid-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all hover:border-purple-500/30"
        >
          <option value="">All States</option>
          {states.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </motion.select>

        <motion.select
          whileHover={{ scale: 1.02 }}
          value={filters.distance}
          onChange={(e) => onFiltersChange({ ...filters, distance: e.target.value })}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-fluid-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all hover:border-purple-500/30"
        >
          <option value="">All Distances</option>
          {distances.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </motion.select>

        <motion.select
          whileHover={{ scale: 1.02 }}
          value={filters.month}
          onChange={(e) => onFiltersChange({ ...filters, month: e.target.value })}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-fluid-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all hover:border-purple-500/30"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </motion.select>

        {/* Clear button */}
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFiltersChange({ search: '', state: '', distance: '', month: '', quickFilter: 'upcoming' })}
            className="px-3 py-2 rounded-xl text-fluid-sm text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10 transition-all"
          >
            Clear
          </motion.button>
        )}
      </motion.div>

      {/* Results count & Archive toggle */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between text-fluid-sm"
      >
        <span className="text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredCount}</span> events
        </span>

        {archivedCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleArchived}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              showArchived
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10 border border-transparent'
            }`}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'Hide' : 'Show'} past ({archivedCount})
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
