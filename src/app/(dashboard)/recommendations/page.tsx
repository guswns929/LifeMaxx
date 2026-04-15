"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { MUSCLE_GROUPS } from "@/lib/muscle-groups";
import { getScoreLabel, getScoreBgColor } from "@/lib/scoring";
import StrengthRadar from "@/components/charts/StrengthRadar";

interface WorkoutExercise {
  exercise: {
    name: string;
    primaryMuscles: string;
    secondaryMuscles: string | null;
  };
  sets: { weightKg: number; reps: number }[];
}

interface WorkoutData {
  id: string;
  date: string;
  exercises: WorkoutExercise[];
}

interface MuscleScore {
  slug: string;
  displayName: string;
  score: number;
  workoutCount: number;
  daysSinceLastTrained: number | null;
  suggestedExercises: string[];
}

export default function RecommendationsPage() {
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/workouts?limit=200");
      if (res.ok) {
        const data = await res.json();
        setWorkouts(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const muscleScores = useMemo(() => {
    const now = new Date();
    const scores: MuscleScore[] = MUSCLE_GROUPS.map((mg) => {
      const muscleWorkouts = workouts.filter((w) =>
        w.exercises.some(
          (we) =>
            we.exercise.primaryMuscles.includes(mg.slug) ||
            (we.exercise.secondaryMuscles?.includes(mg.slug) ?? false)
        )
      );

      // Weighted count: primary = 1.0, secondary-only = 0.4
      let effectiveCount = 0;
      muscleWorkouts.forEach((w) => {
        const hasPrimary = w.exercises.some((we) => we.exercise.primaryMuscles.includes(mg.slug));
        effectiveCount += hasPrimary ? 1 : 0.4;
      });
      const count = Math.round(effectiveCount);
      let daysSinceLastTrained: number | null = null;

      if (muscleWorkouts.length > 0) {
        const lastDate = new Date(muscleWorkouts[0].date);
        daysSinceLastTrained = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      // Simple score: frequency + recency
      let score = 0;
      if (count > 0) {
        const frequencyScore = Math.min(50, count * 5);
        const recencyScore =
          daysSinceLastTrained !== null
            ? Math.max(0, 50 - daysSinceLastTrained * 3.5)
            : 0;
        score = Math.round(frequencyScore + recencyScore);
      }

      return {
        slug: mg.slug,
        displayName: mg.displayName,
        score: Math.min(100, score),
        workoutCount: count,
        daysSinceLastTrained,
        suggestedExercises: mg.suggestedExercises,
      };
    });

    return scores;
  }, [workouts]);

  const avgScore = useMemo(() => {
    if (muscleScores.length === 0) return 0;
    return Math.round(
      muscleScores.reduce((sum, m) => sum + m.score, 0) / muscleScores.length
    );
  }, [muscleScores]);

  const laggingMuscles = useMemo(
    () =>
      muscleScores
        .filter((m) => m.score < avgScore && m.score > 0)
        .sort((a, b) => a.score - b.score),
    [muscleScores, avgScore]
  );

  const neglectedMuscles = useMemo(
    () =>
      muscleScores.filter(
        (m) =>
          m.daysSinceLastTrained === null || m.daysSinceLastTrained >= 10
      ),
    [muscleScores]
  );

  const radarData = useMemo(
    () =>
      muscleScores.map((m) => ({
        muscle: m.displayName,
        score: m.score,
      })),
    [muscleScores]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Recommendations</h1>

      {/* Strength Radar */}
      <StrengthRadar data={radarData} title="Muscle Development Balance" />

      {/* Lagging Muscles */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-1">
          Lagging Muscles
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Below your average score of {avgScore} -- prioritize these in upcoming
          workouts
        </p>

        {laggingMuscles.length > 0 ? (
          <div className="space-y-4">
            {laggingMuscles.map((m) => (
              <div
                key={m.slug}
                className="border border-border-subtle rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-text-primary">
                    {m.displayName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBgColor(m.score)}`}
                    >
                      {m.score} - {getScoreLabel(m.score)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-muted mb-2">
                  {m.workoutCount} workout{m.workoutCount !== 1 ? "s" : ""} total
                  {m.daysSinceLastTrained !== null &&
                    ` -- last trained ${m.daysSinceLastTrained} day${m.daysSinceLastTrained !== 1 ? "s" : ""} ago`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {m.suggestedExercises.map((ex) => (
                    <span
                      key={ex}
                      className="inline-block bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-md"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-6">
            {workouts.length === 0
              ? "Log workouts to get personalized recommendations"
              : "All muscles are at or above average -- great balance!"}
          </p>
        )}
      </div>

      {/* Neglected Muscles */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-1">
          Neglected Muscles
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Not trained in 10+ days or never trained
        </p>

        {neglectedMuscles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {neglectedMuscles.map((m) => (
              <div
                key={m.slug}
                className="border border-border-subtle rounded-lg p-4"
              >
                <h3 className="text-sm font-medium text-text-primary mb-1">
                  {m.displayName}
                </h3>
                <p className="text-xs text-text-muted mb-2">
                  {m.daysSinceLastTrained === null
                    ? "Never trained"
                    : `${m.daysSinceLastTrained} days since last session`}
                </p>
                <div className="flex flex-wrap gap-1">
                  {m.suggestedExercises.slice(0, 2).map((ex) => (
                    <span
                      key={ex}
                      className="inline-block bg-surface-raised text-text-secondary text-xs px-2 py-0.5 rounded-md"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-6">
            No neglected muscles -- you are training everything consistently!
          </p>
        )}
      </div>
    </div>
  );
}
