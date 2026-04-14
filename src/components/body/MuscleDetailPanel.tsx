"use client";

import { getMuscleBySlug } from "@/lib/muscle-groups";
import { getScoreBgColor, getScoreLabel } from "@/lib/scoring";
import { formatWeight, type UnitSystem } from "@/lib/units";
import Link from "next/link";

export interface MuscleStats {
  slug: string;
  workoutCount: number;
  daysSinceLastTrained: number | null;
  developmentScore: number;
  populationPercentile: number | null;
  recentExercises: {
    name: string;
    bestWeightKg: number;
    bestReps: number;
    date: string;
  }[];
}

interface MuscleDetailPanelProps {
  stats: MuscleStats | null;
  units: UnitSystem;
  onClose: () => void;
  onLogWorkout: () => void;
}

export default function MuscleDetailPanel({
  stats,
  units,
  onClose,
  onLogWorkout,
}: MuscleDetailPanelProps) {
  if (!stats) return null;

  const muscle = getMuscleBySlug(stats.slug);
  if (!muscle) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface shadow-xl overflow-y-auto animate-slide-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {muscle.displayName}
              </h2>
              <p className="text-sm text-text-muted mt-1">
                {stats.daysSinceLastTrained !== null
                  ? stats.daysSinceLastTrained === 0
                    ? "Trained today"
                    : `Last trained ${stats.daysSinceLastTrained} day${stats.daysSinceLastTrained === 1 ? "" : "s"} ago`
                  : "Never trained"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface-raised rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-text-primary">{stats.workoutCount}</p>
              <p className="text-xs text-text-muted">Workouts</p>
            </div>
            <div className="bg-surface-raised rounded-lg p-3 text-center">
              <div className={`inline-block px-2 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(stats.developmentScore)}`}>
                {stats.developmentScore}
              </div>
              <p className="text-xs text-text-muted mt-1">{getScoreLabel(stats.developmentScore)}</p>
            </div>
            <div className="bg-surface-raised rounded-lg p-3 text-center">
              {stats.populationPercentile !== null && stats.populationPercentile > 0 ? (
                <>
                  <p className="text-2xl font-bold text-green-500">{stats.populationPercentile}%</p>
                  <p className="text-xs text-text-muted">Better than {stats.populationPercentile}% of population</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-text-muted">--</p>
                  <p className="text-xs text-text-muted">Log exercises to see ranking</p>
                </>
              )}
            </div>
          </div>

          {/* Recent Exercises */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Recent Exercises</h3>
            {stats.recentExercises.length > 0 ? (
              <div className="space-y-2">
                {stats.recentExercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-subtle">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                      <p className="text-xs text-text-muted">{ex.date}</p>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {formatWeight(ex.bestWeightKg, units)} x {ex.bestReps}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No exercises recorded yet</p>
            )}
          </div>

          {/* Suggested Exercises */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Suggested Exercises</h3>
            <div className="space-y-1">
              {muscle.suggestedExercises.map((name) => (
                <div key={name} className="flex items-center gap-2 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-sm text-text-secondary">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onLogWorkout}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Log Workout
            </button>
            <Link
              href={`/muscle/${stats.slug}`}
              className="flex-1 border border-border hover:bg-surface-raised text-text-secondary font-medium py-2.5 px-4 rounded-lg transition-colors text-center"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
