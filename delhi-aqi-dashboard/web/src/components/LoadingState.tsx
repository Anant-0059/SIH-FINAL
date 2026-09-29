"use client";

import React from "react";

export const LoadingState: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Status Skeleton */}
      <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
          />
        ))}
      </div>

      {/* Gauge & Chart Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="lg:col-span-2 h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Map & Table Skeleton */}
      <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
};
