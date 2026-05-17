'use client';

import React from 'react';

/**
 * Skeleton loading card with shimmer animation
 */
export default function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 p-5">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Title skeleton */}
      <div className="h-6 w-3/4 rounded-lg bg-gray-200 dark:bg-gray-700 mb-4" />

      {/* Date skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Location skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Button skeleton */}
      <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

/**
 * Grid of skeleton cards
 */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
