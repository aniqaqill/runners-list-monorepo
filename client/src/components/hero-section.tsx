'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Calendar, ChevronDown, Zap, Activity } from 'lucide-react';
import type { Event } from '@/types/event';
import { isEventEnded, isThisWeek } from '@/utils/loadEvents';

interface HeroWithStatsProps {
  events: Event[];
}

const getStatesCount = (events: Event[]): number => {
  const states = events.filter((e) => e.state).map((e) => e.state);
  return new Set(states).size;
};

/**
 * GeckoTerminal-inspired Hero with animated gradients and glassmorphism stats
 */
export function HeroSection({ events }: HeroWithStatsProps) {
  const upcomingEvents = events.filter((e) => !isEventEnded(e.date));
  const thisWeekEvents = events.filter((e) => isThisWeek(e.date));
  const statesCount = getStatesCount(events);

  const stats = [
    { label: 'Total Events', value: events.length, icon: Calendar, color: 'text-purple-500' },
    { label: 'Upcoming', value: upcomingEvents.length, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'This Week', value: thisWeekEvents.length, icon: Zap, color: 'text-amber-500' },
    { label: 'States', value: statesCount, icon: MapPin, color: 'text-blue-500' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 h-[700px] md:h-[800px]">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50 via-background to-background dark:from-purple-950/50 dark:via-background dark:to-background" />
        
        {/* Animated orbs */}
        <motion.div 
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-20 right-1/4 w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-500/15 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-40 -left-20 w-[400px] h-[400px] bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-[80px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-pink-400/10 dark:bg-pink-500/5 rounded-full blur-[60px]" 
        />
      </div>

      {/* Hero Content */}
      <div className="relative pt-28 pb-10 md:pt-36 md:pb-14">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Live Badge */}
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/10 text-fluid-sm font-medium mb-8 shadow-lg shadow-purple-500/10"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-muted-foreground">Live</span>
              <span className="text-foreground font-semibold">2026 Events</span>
            </motion.span>

            {/* Title with gradient */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-fluid-4xl font-bold mb-4 tracking-tight"
            >
              <span className="text-foreground">Malaysia </span>
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                Runners List
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-fluid-lg mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Your comprehensive guide to running events across Malaysia. 
              <span className="hidden sm:inline"> Filter by state, distance, and date to find your next race.</span>
            </motion.p>

            {/* CTA Button with glow */}
            <motion.a
              href="#events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-foreground text-background font-semibold shadow-2xl shadow-black/20 dark:shadow-purple-500/20 overflow-hidden transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Activity className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Explore Events</span>
              <ChevronDown className="w-5 h-5 relative z-10 animate-bounce" />
            </motion.a>
          </motion.div>
        </div>

        {/* Stats Cards with glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="container mx-auto px-4 mt-14 max-w-4xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative p-4 md:p-5 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/30"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative text-center">
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color} opacity-70`} />
                  <div className="text-fluid-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-fluid-xs text-muted-foreground">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function StatsSection() {
  return null;
}
