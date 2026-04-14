"use client";

import { useState, useCallback } from "react";
import SetRow from "./SetRow";
import ExerciseSelect from "./ExerciseSelect";

interface SetData {
  weightKg: number;
  reps: number;
  rpe: number | null;
  isWarmup: boolean;
}

interface WorkoutExerciseData {
  exerciseId: string;
  exerciseName: string;
  sets: SetData[];
}

interface EditWorkoutInput {
  id: string;
  date: string;
  notes: string | null;
  exercises: {
    exercise: { id?: string; name: string; primaryMuscles: string; secondaryMuscles: string | null };
    exerciseId?: string;
    exerciseName?: string;
    sets: { weightKg: number; reps: number; rpe: number | null; isWarmup?: boolean }[];
  }[];
}

interface WorkoutDetailModalProps {
  workout?: {
    id: string;
    date: string;
    notes: string | null;
    exercises: WorkoutExerciseData[];
  } | null;
  editWorkout?: EditWorkoutInput | null;
  units: "metric" | "imperial";
  onClose: () => void;
  onSaved: () => void;
}

function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DEFAULT_SET: SetData = {
  weightKg: 0,
  reps: 0,
  rpe: null,
  isWarmup: false,
};

export default function WorkoutDetailModal({
  workout,
  editWorkout,
  units,
  onClose,
  onSaved,
}: WorkoutDetailModalProps) {
  const sourceWorkout = workout || editWorkout;
  const isEditing = !!sourceWorkout;

  // Convert editWorkout format to internal format
  function initExercises(): WorkoutExerciseData[] {
    if (workout?.exercises) return workout.exercises;
    if (editWorkout?.exercises) {
      return editWorkout.exercises.map((e) => ({
        exerciseId: e.exerciseId || e.exercise?.id || "",
        exerciseName: e.exerciseName || e.exercise?.name || "",
        sets: e.sets.map((s) => ({
          weightKg: s.weightKg,
          reps: s.reps,
          rpe: s.rpe,
          isWarmup: s.isWarmup ?? false,
        })),
      }));
    }
    return [];
  }

  const [date, setDate] = useState(
    sourceWorkout?.date ? sourceWorkout.date.split("T")[0] : todayISO()
  );
  const [notes, setNotes] = useState(sourceWorkout?.notes ?? "");
  const [exercises, setExercises] = useState<WorkoutExerciseData[]>(initExercises);
  const [showExerciseSelect, setShowExerciseSelect] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Exercise management ---

  const handleAddExercise = useCallback(
    (exercise: { id: string; name: string; primaryMuscles: string }) => {
      setExercises((prev) => [
        ...prev,
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: [{ ...DEFAULT_SET }],
        },
      ]);
      setShowExerciseSelect(false);
    },
    []
  );

  const handleRemoveExercise = useCallback((index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Set management ---

  const handleSetChange = useCallback(
    (exerciseIndex: number, setIndex: number, data: SetData) => {
      setExercises((prev) =>
        prev.map((ex, ei) => {
          if (ei !== exerciseIndex) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s, si) => (si === setIndex ? data : s)),
          };
        })
      );
    },
    []
  );

  const handleAddSet = useCallback((exerciseIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        return { ...ex, sets: [...ex.sets, { ...DEFAULT_SET }] };
      })
    );
  }, []);

  const handleRemoveSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setExercises((prev) =>
        prev.map((ex, ei) => {
          if (ei !== exerciseIndex) return ex;
          return {
            ...ex,
            sets: ex.sets.filter((_, si) => si !== setIndex),
          };
        })
      );
    },
    []
  );

  // --- Save ---

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const body = {
        date,
        notes: notes || null,
        exercises: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
        })),
      };

      const workoutId = workout?.id || editWorkout?.id;
      const url = isEditing && workoutId
        ? `/api/workouts/${workoutId}`
        : "/api/workouts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save workout");

      onSaved();
    } catch {
      // Let the user retry
    } finally {
      setSaving(false);
    }
  }, [date, notes, exercises, isEditing, workout, editWorkout, onSaved]);

  // IDs already added, for excludeIds on ExerciseSelect
  const addedExerciseIds = exercises.map((ex) => ex.exerciseId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "Edit Workout" : "New Workout"}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl mx-4 my-8 bg-white border border-stone-200 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">
            {isEditing ? "Edit Workout" : "Log Workout"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-5">
          {/* Date */}
          <div>
            <label
              htmlFor="workout-date"
              className="mb-1.5 block text-sm font-medium text-stone-900"
            >
              Date
            </label>
            <input
              id="workout-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="workout-notes"
              className="mb-1.5 block text-sm font-medium text-stone-900"
            >
              Notes
            </label>
            <textarea
              id="workout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="How did it go?"
              className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors resize-none"
            />
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-900">Exercises</h3>

            {exercises.length === 0 && !showExerciseSelect && (
              <p className="text-sm text-stone-400 py-3 text-center">
                No exercises added yet. Add one to get started.
              </p>
            )}

            {exercises.map((exercise, exerciseIndex) => {
              // Count non-warmup sets for numbering
              let workingSetNum = 0;

              return (
                <div
                  key={`${exercise.exerciseId}-${exerciseIndex}`}
                  className="rounded-xl border border-stone-200 bg-stone-50/50"
                >
                  {/* Exercise header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
                    <span className="text-sm font-semibold text-stone-900">
                      {exercise.exerciseName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exerciseIndex)}
                      className="rounded-md p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${exercise.exerciseName}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Column headers */}
                  <div className="flex items-center gap-2 px-4 pt-2 pb-1">
                    <span className="w-7 shrink-0 text-center text-xs text-stone-400">
                      Set
                    </span>
                    <span className="flex-1 text-xs text-stone-400">
                      Weight
                    </span>
                    <span className="w-16 shrink-0 text-xs text-stone-400">
                      Reps
                    </span>
                    <span className="w-16 shrink-0 text-xs text-stone-400">
                      RPE
                    </span>
                    <span className="w-10 shrink-0" />
                    <span className="w-6 shrink-0" />
                  </div>

                  {/* Sets */}
                  <div className="px-4 pb-2">
                    {exercise.sets.map((set, setIndex) => {
                      if (!set.isWarmup) {
                        workingSetNum += 1;
                      }
                      return (
                        <SetRow
                          key={setIndex}
                          setNumber={set.isWarmup ? 0 : workingSetNum}
                          weightKg={set.weightKg}
                          reps={set.reps}
                          rpe={set.rpe}
                          isWarmup={set.isWarmup}
                          units={units}
                          onChange={(data) =>
                            handleSetChange(exerciseIndex, setIndex, data)
                          }
                          onRemove={() =>
                            handleRemoveSet(exerciseIndex, setIndex)
                          }
                        />
                      );
                    })}
                  </div>

                  {/* Add set button */}
                  <div className="px-4 pb-3">
                    <button
                      type="button"
                      onClick={() => handleAddSet(exerciseIndex)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add Set
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Exercise */}
            {showExerciseSelect ? (
              <div className="space-y-2">
                <ExerciseSelect
                  onSelect={handleAddExercise}
                  excludeIds={addedExerciseIds}
                />
                <button
                  type="button"
                  onClick={() => setShowExerciseSelect(false)}
                  className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowExerciseSelect(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50/50 transition-colors w-full justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Exercise
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 active:bg-stone-100 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || exercises.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving && (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {saving ? "Saving..." : isEditing ? "Update Workout" : "Save Workout"}
          </button>
        </div>
      </div>
    </div>
  );
}
