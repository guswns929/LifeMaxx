"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getMuscleBySlug } from "@/lib/muscle-groups";
import { calculateE1RM } from "@/lib/scoring";
import { formatWeight, type UnitSystem } from "@/lib/units";
import ProgressChart from "@/components/charts/ProgressChart";
import VolumeChart from "@/components/charts/VolumeChart";

interface SetData {
  weightKg: number;
  reps: number;
  rpe: number | null;
}

interface WorkoutExercise {
  exercise: {
    name: string;
    primaryMuscles: string;
    secondaryMuscles: string | null;
  };
  sets: SetData[];
}

interface WorkoutData {
  id: string;
  date: string;
  exercises: WorkoutExercise[];
}

export default function MuscleDetailPage() {
  const pathname = usePathname();
  const slug = pathname.split("/").pop() || "";
  const muscle = getMuscleBySlug(slug);

  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [units, setUnits] = useState<UnitSystem>("imperial");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [workoutsRes, settingsRes] = await Promise.all([
        fetch("/api/workouts?limit=200"),
        fetch("/api/settings"),
      ]);
      if (workoutsRes.ok) {
        const data = await workoutsRes.json();
        setWorkouts(data);
      }
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setUnits(settings.preferredUnits || "imperial");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Include workouts where this muscle is primary OR secondary
  const muscleWorkouts = useMemo(
    () =>
      workouts.filter((w) =>
        w.exercises.some(
          (we) =>
            we.exercise.primaryMuscles.includes(slug) ||
            (we.exercise.secondaryMuscles?.includes(slug) ?? false)
        )
      ),
    [workouts, slug]
  );

  // Weighted workout count: primary = 1.0, secondary-only = 0.4
  const effectiveCount = useMemo(() => {
    let count = 0;
    muscleWorkouts.forEach((w) => {
      const hasPrimary = w.exercises.some((we) => we.exercise.primaryMuscles.includes(slug));
      count += hasPrimary ? 1 : 0.4;
    });
    return count;
  }, [muscleWorkouts, slug]);

  // Calculate e1RM progress data: best e1RM per workout
  const progressData = useMemo(() => {
    return muscleWorkouts
      .map((w) => {
        let bestE1RM = 0;
        w.exercises
          .filter(
            (we) =>
              we.exercise.primaryMuscles.includes(slug) ||
              (we.exercise.secondaryMuscles?.includes(slug) ?? false)
          )
          .forEach((we) => {
            we.sets.forEach((s) => {
              if (s.weightKg > 0 && s.reps > 0) {
                const e1rm = calculateE1RM(s.weightKg, s.reps);
                if (e1rm > bestE1RM) bestE1RM = e1rm;
              }
            });
          });
        return { date: w.date, value: Math.round(bestE1RM * 10) / 10 };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [muscleWorkouts, slug]);

  // Calculate weekly volume data (secondary exercises contribute 40% volume)
  const volumeData = useMemo(() => {
    const weeklyMap = new Map<string, number>();
    muscleWorkouts.forEach((w) => {
      const date = new Date(w.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      let volume = 0;
      w.exercises
        .filter(
          (we) =>
            we.exercise.primaryMuscles.includes(slug) ||
            (we.exercise.secondaryMuscles?.includes(slug) ?? false)
        )
        .forEach((we) => {
          const isPrimary = we.exercise.primaryMuscles.includes(slug);
          const multiplier = isPrimary ? 1.0 : 0.4;
          we.sets.forEach((s) => {
            volume += s.weightKg * s.reps * multiplier;
          });
        });

      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + volume);
    });

    return Array.from(weeklyMap.entries())
      .map(([week, volume]) => ({ week, volume: Math.round(volume) }));
  }, [muscleWorkouts, slug]);

  // Exercise history
  const exerciseHistory = useMemo(() => {
    const history: {
      name: string;
      date: string;
      bestWeight: number;
      bestReps: number;
    }[] = [];

    muscleWorkouts.forEach((w) => {
      w.exercises
        .filter(
          (we) =>
            we.exercise.primaryMuscles.includes(slug) ||
            (we.exercise.secondaryMuscles?.includes(slug) ?? false)
        )
        .forEach((we) => {
          let bestWeight = 0;
          let bestReps = 0;
          we.sets.forEach((s) => {
            if (s.weightKg > bestWeight || (s.weightKg === bestWeight && s.reps > bestReps)) {
              bestWeight = s.weightKg;
              bestReps = s.reps;
            }
          });
          if (bestWeight > 0) {
            history.push({
              name: we.exercise.name,
              date: new Date(w.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              bestWeight,
              bestReps,
            });
          }
        });
    });

    return history;
  }, [muscleWorkouts, slug]);

  // Stats — weighted development score (secondary = 40% contribution)
  const totalWorkouts = muscleWorkouts.length;
  const devScore = Math.min(100, Math.round(effectiveCount * 8));
  const lastTrained =
    muscleWorkouts.length > 0
      ? new Date(muscleWorkouts[0].date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Never";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!muscle) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-text-muted hover:text-text-primary"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="bg-surface rounded-xl border border-border p-12 shadow-sm text-center">
          <p className="text-text-muted">Muscle group not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-text-muted hover:text-text-primary"
      >
        &larr; Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-text-primary">{muscle.displayName}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <p className="text-sm text-text-muted">Total Workouts</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{totalWorkouts}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <p className="text-sm text-text-muted">Development Score</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{devScore}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <p className="text-sm text-text-muted">Last Trained</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{lastTrained}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart
          data={progressData}
          units={units}
          title={`${muscle.displayName} e1RM Progress`}
        />
        <VolumeChart
          data={volumeData}
          title={`${muscle.displayName} Weekly Volume`}
        />
      </div>

      {/* Exercise History Table */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Exercise History</h2>
        {exerciseHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-text-muted">Exercise</th>
                  <th className="text-left py-2 pr-4 font-medium text-text-muted">Date</th>
                  <th className="text-left py-2 font-medium text-text-muted">Best Set</th>
                </tr>
              </thead>
              <tbody>
                {exerciseHistory.map((row, i) => (
                  <tr key={i} className="border-b border-border-subtle last:border-0">
                    <td className="py-2 pr-4 text-text-primary">{row.name}</td>
                    <td className="py-2 pr-4 text-text-secondary">{row.date}</td>
                    <td className="py-2 text-text-primary">
                      {formatWeight(row.bestWeight, units)} x {row.bestReps}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-8">
            No exercise history for this muscle group
          </p>
        )}
      </div>
    </div>
  );
}
