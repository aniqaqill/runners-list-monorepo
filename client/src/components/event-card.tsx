'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, ExternalLink, Timer, Sparkles, Share2, Check } from 'lucide-react';
import type { Event } from '@/types/event';
import { formatEventDate, getDaysUntil, isEventEnded } from '@/utils/loadEvents';

interface EventCardProps {
  event: Event;
  index: number;
}

/**
 * Get color scheme for distance badge - GeckoTerminal style with glow
 */
const getDistanceStyle = (distance: string): { bg: string; glow: string } => {
  if (!distance) return { bg: 'bg-gray-500/20 text-gray-400', glow: '' };
  if (distance.includes('5km')) return { bg: 'bg-emerald-500/20 text-emerald-400', glow: 'shadow-emerald-500/20' };
  if (distance.includes('10km')) return { bg: 'bg-blue-500/20 text-blue-400', glow: 'shadow-blue-500/20' };
  if (distance.includes('21km')) return { bg: 'bg-purple-500/20 text-purple-400', glow: 'shadow-purple-500/20' };
  if (distance.includes('42km')) return { bg: 'bg-orange-500/20 text-orange-400', glow: 'shadow-orange-500/20' };
  if (distance.includes('50km') || distance.includes('Ultra')) return { bg: 'bg-red-500/20 text-red-400', glow: 'shadow-red-500/20' };
  return { bg: 'bg-gray-500/20 text-gray-400', glow: '' };
};

/**
 * GeckoTerminal-inspired Event Card with glassmorphism and micro-interactions
 */
export default function EventCard({ event, index }: EventCardProps) {
  const ended = isEventEnded(event.date);
  const daysUntil = getDaysUntil(event.date);
  const distanceStyle = getDistanceStyle(event.distance);
  const [copied, setCopied] = useState(false);

  /**
   * Share event using Web Share API with clipboard fallback
   */
  const handleShare = useCallback(async () => {
    const shareData = {
      title: event.name,
      text: `Check out ${event.name} on ${formatEventDate(event.date)} in ${event.location || event.state}!`,
      url: event.registration_url,
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(event.registration_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      // User cancelled share or error occurred - fail silently
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  }, [event]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.04,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -6, 
        transition: { duration: 0.2 } 
      }}
      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
        ended
          ? 'opacity-50'
          : ''
      }`}
    >
      {/* Background with gradient border effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${ended ? '' : 'group-hover:blur-xl'}`} />
      
      {/* Card body with glassmorphism */}
      <div className={`relative rounded-2xl border backdrop-blur-xl p-5 h-full transition-all duration-300 ${
        ended
          ? 'bg-gray-100/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800/50'
          : 'bg-white/80 dark:bg-white/5 border-white/30 dark:border-white/10 group-hover:border-purple-500/30 dark:group-hover:border-purple-500/20 group-hover:shadow-xl group-hover:shadow-purple-500/10'
      }`}>
        
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <motion.h3 
              className="font-semibold text-fluid-lg text-foreground leading-tight line-clamp-2"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              {event.name}
              {ended && (
                <span className="ml-2 text-fluid-xs text-red-500/70 font-normal">(Ended)</span>
              )}
            </motion.h3>

            {/* Days Until Badge with glow */}
            {!ended && daysUntil <= 14 && daysUntil > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shrink-0 px-2.5 py-1 rounded-full text-fluid-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30"
              >
                {daysUntil === 1 ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Tomorrow
                  </span>
                ) : `${daysUntil}d`}
              </motion.span>
            )}
          </div>

          {/* Info Row with micro-interactions */}
          <div className="space-y-2 mb-4">
            <motion.div 
              className="flex items-center gap-2 text-fluid-sm text-muted-foreground"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.15 }}
            >
              <Calendar className="w-4 h-4 shrink-0 text-purple-500/70" />
              <span>{formatEventDate(event.date)}</span>
            </motion.div>

            {event.location && (
              <motion.div 
                className="flex items-center gap-2 text-fluid-sm text-muted-foreground"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
              >
                <MapPin className="w-4 h-4 shrink-0 text-blue-500/70" />
                <span className="line-clamp-1">{event.location}</span>
              </motion.div>
            )}
          </div>

          {/* Tags Row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {event.distance && (
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-fluid-xs font-medium ${distanceStyle.bg} shadow-sm ${distanceStyle.glow}`}
              >
                <Timer className="w-3 h-3" />
                {event.distance}
              </motion.span>
            )}

            {event.state && (
              <motion.span 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-fluid-xs font-medium bg-primary/10 text-primary shadow-sm"
              >
                {event.state}
              </motion.span>
            )}
          </div>

          {/* CTA Buttons Row */}
          <div className="flex items-center gap-2">
            {/* Register Button with glow effect */}
            <motion.a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-fluid-sm font-medium transition-all duration-300 overflow-hidden ${
                ended
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed pointer-events-none'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40'
              }`}
            >
              {/* Shimmer effect on hover */}
              {!ended && (
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              )}
              <ExternalLink className="w-4 h-4 relative" />
              <span className="relative">{ended ? 'Event Ended' : 'Register Now'}</span>
            </motion.a>

            {/* Share Button */}
            <motion.button
              onClick={handleShare}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center justify-center p-3 rounded-xl transition-all duration-300 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/10 dark:bg-white/5 text-muted-foreground border border-white/20 dark:border-white/10 hover:border-purple-500/30 hover:text-purple-500'
              } backdrop-blur-sm`}
              aria-label="Share event"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="share"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Share2 className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
