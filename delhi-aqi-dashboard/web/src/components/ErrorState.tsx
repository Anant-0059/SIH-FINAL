"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Failed to load air quality telemetry data.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-w-lg mx-auto my-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        Data Connection Issue
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
