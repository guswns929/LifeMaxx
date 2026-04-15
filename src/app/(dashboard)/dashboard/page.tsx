"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import StatsCards from "@/components/dashboard/StatsCards";
import BodyDiagram, { type MuscleActivity } from "@/components/body/BodyDiagram";
import MuscleDetailPanel, { type MuscleStats } from "@/components/body/MuscleDetailPanel";
import WorkoutDetailModal from "@/components/workout/WorkoutDetailModal";
import { MUSCLE_GROUPS } from "@/lib/muscle-groups";
import { getExerciseRanking, getMuscleRanking, type ExerciseRanking } from "@/lib/rankings";
import type { Muscle } from "react-body-highlighter";

// Map DB exercise names to strength standard names
const STANDARD_NAME_MAP: Record<string, string> = {
  "Barbell Bench Press": "Bench Press",
  "Incline Barbell Bench Press": "Bench Press",
  "Dumbbell Bench Press": "Bench Press",
  "Barbell Squat": "Squat",
  "Front Squat": "Squat",
  "Barbell Deadlift": "Deadlift",
  "Sumo Deadlift": "Deadlift",
  "Trap Bar Deadlift": "Deadlift",
  "Overhead Press": "Overhead Press",
  "Dumbbell Shoulder Press": "Overhead Press",
  "Barbell Row": "Barbell Row",
  "Pendlay Row": "Barbell Row",
  "Barbell Curl": "Barbell Curl",
  "EZ-Bar Curl": "Barbell Curl",
  "Pull-Ups": "Pull-Up",
  "Chin-Ups": "Pull-Up",
  "Weighted Pull-Ups": "Pull-Up",
};

interface WorkoutData {
  id: string;
  date: string;
  name: string | null;
  notes: string | null;
  isDetailed: boolean;
  strainScore?: number | null;
  activityType?: string | null;
  durationMin?: number | null;
  exercises: {
    exercise: { name: string; primaryMuscles: string; secondaryMuscles: string | null };
    sets: { weightKg: number; reps: number; rpe: number | null }[];
  }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [muscleStats, setMuscleStats] = useState<MuscleStats | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [units, setUnits] = useState<"metric" | "imperial">("imperial");
  const [userSex, setUserSex] = useState<"male" | "female">("male");
  const [userWeightKg, setUserWeightKg] = useState<number>(80);

  const fetchData = useCallback(async () => {
    try {
      const [workoutsRes, settingsRes] = await Promise.all([
        fetch("/api/workouts?limit=100"),
        fetch("/api/settings"),
      ]);
      if (workoutsRes.ok) {
        const data = await workoutsRes.json();
        setWorkouts(data);
      }
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setUnits(settings.preferredUnits || "imperial");
        if (settings.sex) setUserSex(settings.sex);
        if (settings.bodyWeightKg) setUserWeightKg(settings.bodyWeightKg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete(workoutId: string) {
    if (!confirm("Delete this workout? This cannot be undone.")) return;
    setDeletingId(workoutId);
    try {
      const res = await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
      if (res.ok) {
        setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRename(workoutId: string, newName: string) {
    if (!newName.trim()) { setRenamingId(null); return; }
    try {
      const res = await fetch(`/api/workouts/${workoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setWorkouts((prev) => prev.map((w) => w.id === workoutId ? { ...w, name: newName.trim() } : w));
      }
    } finally {
      setRenamingId(null);
    }
  }

  // Parse muscle JSON safely
  function parseMuscles(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : raw.split(",").map((m) => m.trim());
    } catch {
      return raw.split(",").map((m) => m.trim());
    }
  }

  // Build muscle activity data for body diagram
  const muscleActivityMap = new Map<string, number>();
  const now = new Date();
  workouts.forEach((w) => {
    w.exercises.forEach((we) => {
      const muscles = parseMuscles(we.exercise.primaryMuscles);
      const secondary = parseMuscles(we.exercise.secondaryMuscles);
      [...muscles, ...secondary].forEach((m) => {
        muscleActivityMap.set(m, (muscleActivityMap.get(m) || 0) + 1);
      });
    });
  });

  const bodyData: MuscleActivity[] = MUSCLE_GROUPS.map((mg) => ({
    name: mg.slug,
    muscles: [mg.slug as Muscle],
    frequency: muscleActivityMap.get(mg.slug) || 0,
  })).filter((d) => d.frequency > 0);

  // Stats
  const totalWorkouts = workouts.length;
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekMuscles = new Set<string>();
  workouts
    .filter((w) => new Date(w.date) >= oneWeekAgo)
    .forEach((w) =>
      w.exercises.forEach((we) =>
        parseMuscles(we.exercise.primaryMuscles).forEach((m) => weekMuscles.add(m))
      )
    );

  // Streak calculation
  let streak = 0;
  const sortedDates = [...new Set(workouts.map((w) => new Date(w.date).toDateString()))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date(now);
    expected.setDate(expected.getDate() - i);
    if (new Date(sortedDates[i]).toDateString() === expected.toDateString()) {
      streak++;
    } else break;
  }

  // Muscle click handler
  const handleMuscleClick = (muscleSlug: string) => {
    setSelectedMuscle(muscleSlug);

    // Count workouts where this muscle is targeted (primary = full, secondary = 0.4 weight)
    let effectiveCount = 0;
    const allMuscleWorkouts = workouts.filter((w) =>
      w.exercises.some(
        (we) =>
          we.exercise.primaryMuscles.includes(muscleSlug) ||
          (we.exercise.secondaryMuscles?.includes(muscleSlug) ?? false)
      )
    );

    allMuscleWorkouts.forEach((w) => {
      const hasPrimary = w.exercises.some((we) => we.exercise.primaryMuscles.includes(muscleSlug));
      effectiveCount += hasPrimary ? 1 : 0.4;
    });

    const daysSince =
      allMuscleWorkouts.length > 0
        ? Math.floor(
            (now.getTime() - new Date(allMuscleWorkouts[0].date).getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

    const recentExercises = allMuscleWorkouts
      .flatMap((w) =>
        w.exercises
          .filter(
            (we) =>
              we.exercise.primaryMuscles.includes(muscleSlug) ||
              (we.exercise.secondaryMuscles?.includes(muscleSlug) ?? false)
          )
          .map((we) => ({
            name: we.exercise.name,
            bestWeightKg: Math.max(...we.sets.map((s) => s.weightKg), 0),
            bestReps: Math.max(...we.sets.map((s) => s.reps), 0),
            date: new Date(w.date).toLocaleDateString(),
          }))
      )
      .slice(0, 5);

    // Compute population percentile from exercise rankings
    const exerciseRankings: ExerciseRanking[] = [];
    for (const ex of recentExercises) {
      const standardName = STANDARD_NAME_MAP[ex.name] ?? ex.name;
      const ranking = getExerciseRanking(standardName, ex.bestWeightKg, ex.bestReps, userSex, userWeightKg);
      if (ranking) exerciseRankings.push(ranking);
    }
    const muscleRanking = getMuscleRanking(exerciseRankings);
    const percentile = exerciseRankings.length > 0 ? muscleRanking.percentile : null;

    setMuscleStats({
      slug: muscleSlug,
      workoutCount: allMuscleWorkouts.length,
      daysSinceLastTrained: daysSince,
      developmentScore: Math.min(100, Math.round(effectiveCount * 8) + (daysSince !== null ? Math.max(0, 50 - daysSince * 3) : 0)),
      populationPercentile: percentile,
      recentExercises,
    });
  };

  function getWorkoutLabel(w: WorkoutData): string {
    if (w.name) return w.name;
    if (w.exercises.length > 0) {
      const names = w.exercises.map((e) => e.exercise.name);
      return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ");
    }
    if (w.activityType) return `WHOOP: Activity ${w.activityType}`;
    return w.notes || "Workout";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <button
          onClick={() => { setEditingWorkout(null); setShowWorkoutModal(true); }}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          + Log Workout
        </button>
      </div>

      <StatsCards
        totalWorkouts={totalWorkouts}
        musclesTrained={weekMuscles.size}
        streak={streak}
        overallScore={totalWorkouts > 0 ? Math.min(100, totalWorkouts * 5) : null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Muscle Map</h2>
          <BodyDiagram data={bodyData} onMuscleClick={handleMuscleClick} />
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Recent Workouts</h2>
          {workouts.length > 0 ? (
            <div className="space-y-2">
              {workouts.slice(0, 10).map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border-subtle hover:bg-surface-raised transition-colors group">
                  <div className="min-w-0 flex-1">
                    {renamingId === w.id ? (
                      <input
                        autoFocus
                        className="text-sm font-medium text-text-primary bg-transparent border-b border-green-500 outline-none w-full"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRename(w.id, renameValue)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(w.id, renameValue);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                    ) : (
                      <p
                        className="text-sm font-medium text-text-primary truncate cursor-pointer"
                        onDoubleClick={() => { setRenamingId(w.id); setRenameValue(getWorkoutLabel(w)); }}
                        title="Double-click to rename"
                      >
                        {getWorkoutLabel(w)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span>
                        {new Date(w.date).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric",
                        })}
                      </span>
                      {w.exercises.length > 0 && (
                        <span>&middot; {w.exercises.reduce((sum, e) => sum + e.sets.length, 0)} sets</span>
                      )}
                      {w.strainScore != null && (
                        <span>&middot; Strain {w.strainScore.toFixed(1)}</span>
                      )}
                      {w.durationMin != null && (
                        <span>&middot; {w.durationMin}min</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    <button
                      onClick={() => { setRenamingId(w.id); setRenameValue(getWorkoutLabel(w)); }}
                      className="p-1.5 rounded-md text-text-muted hover:text-blue-500 hover:bg-blue-900/20 transition-colors"
                      title="Rename workout"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setEditingWorkout(w); setShowWorkoutModal(true); }}
                      className="p-1.5 rounded-md text-text-muted hover:text-green-500 hover:bg-green-900/20 transition-colors"
                      title="Edit workout"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={deletingId === w.id}
                      className="p-1.5 rounded-md text-text-muted hover:text-red-500 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      title="Delete workout"
                    >
                      {deletingId === w.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">
              <p className="mb-2">No workouts yet</p>
              <p className="text-sm">Click &quot;Log Workout&quot; to get started</p>
            </div>
          )}
        </div>
      </div>

      {selectedMuscle && muscleStats && (
        <MuscleDetailPanel
          stats={muscleStats}
          units={units}
          onClose={() => {
            setSelectedMuscle(null);
            setMuscleStats(null);
          }}
          onLogWorkout={() => {
            setSelectedMuscle(null);
            setMuscleStats(null);
            setShowWorkoutModal(true);
          }}
        />
      )}

      {showWorkoutModal && (
        <WorkoutDetailModal
          units={units}
          editWorkout={editingWorkout}
          onClose={() => { setShowWorkoutModal(false); setEditingWorkout(null); }}
          onSaved={() => {
            setShowWorkoutModal(false);
            setEditingWorkout(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
