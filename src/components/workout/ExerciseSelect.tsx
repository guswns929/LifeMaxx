"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MUSCLE_GROUPS } from "@/lib/muscle-groups";

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string;
  isCustom?: boolean;
  linkedExerciseId?: string | null;
}

interface ExerciseSelectProps {
  onSelect: (exercise: Exercise) => void;
  excludeIds?: string[];
}

const MUSCLE_FILTERS = MUSCLE_GROUPS.map((m) => ({ slug: m.slug, label: m.displayName }));

export default function ExerciseSelect({
  onSelect,
  excludeIds = [],
}: ExerciseSelectProps) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [results, setResults] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchExercises = useCallback(
    async (searchTerm: string, muscle: string | null) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set("q", searchTerm);
        if (muscle) params.set("muscle", muscle);
        const res = await fetch(`/api/exercises?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Exercise[] = await res.json();
        const filtered = excludeIds.length ? data.filter((ex) => !excludeIds.includes(ex.id)) : data;
        setResults(filtered);
        setIsOpen(true);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [excludeIds]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchExercises(value, muscleFilter), 200);
    },
    [fetchExercises, muscleFilter]
  );

  const handleMuscleFilter = (slug: string) => {
    const newFilter = muscleFilter === slug ? null : slug;
    setMuscleFilter(newFilter);
    fetchExercises(query, newFilter);
  };

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleSelect = useCallback(
    (exercise: Exercise) => {
      onSelect(exercise);
      setQuery("");
      setResults([]);
      setIsOpen(false);
      setMuscleFilter(null);
    },
    [onSelect]
  );

  function parseMuscles(raw: string): string[] {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return raw.split(",").map((s) => s.trim()); }
  }

  // ── Create Custom Exercise ──
  const [createName, setCreateName] = useState("");
  const [createEquipment, setCreateEquipment] = useState("barbell");
  const [createCategory, setCreateCategory] = useState("compound");
  const [createPrimary, setCreatePrimary] = useState<string[]>([]);
  const [createSecondary, setCreateSecondary] = useState<string[]>([]);
  const [createLinkedId, setCreateLinkedId] = useState<string | null>(null);
  const [createLinkedName, setCreateLinkedName] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [linkResults, setLinkResults] = useState<Exercise[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  function toggleMuscle(slug: string, list: "primary" | "secondary") {
    if (list === "primary") {
      setCreatePrimary((p) => p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]);
      setCreateSecondary((p) => p.filter((s) => s !== slug));
    } else {
      setCreateSecondary((p) => p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]);
      setCreatePrimary((p) => p.filter((s) => s !== slug));
    }
  }

  async function searchLinkedExercise(q: string) {
    setLinkSearch(q);
    if (!q.trim()) { setLinkResults([]); return; }
    const res = await fetch(`/api/exercises?q=${encodeURIComponent(q)}`);
    if (res.ok) setLinkResults(await res.json());
  }

  async function handleCreate() {
    if (!createName.trim() || createPrimary.length === 0) {
      setCreateError("Name and at least one primary muscle required");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          category: createCategory,
          equipment: createEquipment,
          primaryMuscles: createPrimary.join(","),
          secondaryMuscles: createSecondary.join(","),
          linkedExerciseId: createLinkedId,
        }),
      });
      if (res.ok) {
        const ex = await res.json();
        handleSelect(ex);
        resetCreate();
      } else {
        const data = await res.json();
        setCreateError(data.error || "Failed to create");
      }
    } finally {
      setCreating(false);
    }
  }

  function resetCreate() {
    setShowCreateForm(false);
    setCreateName("");
    setCreatePrimary([]);
    setCreateSecondary([]);
    setCreateLinkedId(null);
    setCreateLinkedName("");
    setCreateError("");
  }

  if (showCreateForm) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Create Custom Exercise</h3>
          <button onClick={resetCreate} className="text-xs text-text-muted hover:text-text-primary">Cancel</button>
        </div>
        {createError && <p className="text-xs text-red-500">{createError}</p>}
        <input
          value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Exercise name"
          className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <select value={createCategory} onChange={(e) => setCreateCategory(e.target.value)}
            className="rounded-lg border border-border bg-surface-raised px-2 py-1.5 text-sm text-text-primary">
            <option value="compound">Compound</option>
            <option value="isolation">Isolation</option>
          </select>
          <select value={createEquipment} onChange={(e) => setCreateEquipment(e.target.value)}
            className="rounded-lg border border-border bg-surface-raised px-2 py-1.5 text-sm text-text-primary">
            <option value="barbell">Barbell</option>
            <option value="dumbbell">Dumbbell</option>
            <option value="cable">Cable</option>
            <option value="machine">Machine</option>
            <option value="bodyweight">Bodyweight</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted mb-1">Primary Muscles (100% strain)</p>
          <div className="flex flex-wrap gap-1">
            {MUSCLE_FILTERS.map((m) => (
              <button key={m.slug} type="button" onClick={() => toggleMuscle(m.slug, "primary")}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  createPrimary.includes(m.slug) ? "bg-green-500 text-white border-green-500"
                    : createSecondary.includes(m.slug) ? "opacity-40 border-border text-text-muted"
                    : "border-border text-text-secondary hover:border-green-500"
                }`}>{m.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted mb-1">Secondary Muscles (40% strain)</p>
          <div className="flex flex-wrap gap-1">
            {MUSCLE_FILTERS.map((m) => (
              <button key={m.slug} type="button" onClick={() => toggleMuscle(m.slug, "secondary")}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  createSecondary.includes(m.slug) ? "bg-blue-500 text-white border-blue-500"
                    : createPrimary.includes(m.slug) ? "opacity-40 border-border text-text-muted"
                    : "border-border text-text-secondary hover:border-blue-500"
                }`}>{m.label}</button>
            ))}
          </div>
        </div>
        {/* Link to existing exercise */}
        <div>
          <p className="text-xs font-medium text-text-muted mb-1">Link to Existing Exercise (for e1RM / ranking tracking)</p>
          {createLinkedId ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-primary">{createLinkedName}</span>
              <button onClick={() => { setCreateLinkedId(null); setCreateLinkedName(""); }} className="text-xs text-red-500">Remove</button>
            </div>
          ) : (
            <div className="relative">
              <input value={linkSearch} onChange={(e) => searchLinkedExercise(e.target.value)}
                placeholder="Search exercise to link..."
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-green-500" />
              {linkResults.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full max-h-40 overflow-auto rounded-lg border border-border bg-surface shadow-lg">
                  {linkResults.slice(0, 10).map((ex) => (
                    <li key={ex.id} onClick={() => { setCreateLinkedId(ex.id); setCreateLinkedName(ex.name); setLinkSearch(""); setLinkResults([]); }}
                      className="px-3 py-1.5 text-xs cursor-pointer hover:bg-surface-raised text-text-primary">{ex.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <button onClick={handleCreate} disabled={creating || !createName.trim() || createPrimary.length === 0}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
          {creating ? "Creating..." : "Create Exercise"}
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Muscle group filter chips */}
      <div className="flex flex-wrap gap-1">
        {MUSCLE_FILTERS.map((m) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => handleMuscleFilter(m.slug)}
            className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors ${
              muscleFilter === m.slug
                ? "bg-green-500 text-white border-green-500"
                : "border-border text-text-muted hover:text-text-primary hover:border-text-secondary"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
            else fetchExercises(query, muscleFilter);
          }}
          placeholder={muscleFilter ? `Search ${MUSCLE_GROUPS.find((m) => m.slug === muscleFilter)?.displayName} exercises...` : "Search exercises..."}
          className="block w-full rounded-lg border border-border bg-surface-raised px-3 py-2 pl-9 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
          {isLoading ? (
            <svg className="h-4 w-4 animate-spin text-text-muted" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-border bg-surface shadow-lg">
          {results.map((exercise) => {
            const muscles = parseMuscles(exercise.primaryMuscles);
            return (
              <li
                key={exercise.id}
                className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-surface-raised transition-colors"
                onClick={() => handleSelect(exercise)}
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-text-primary truncate block">
                    {exercise.name}
                    {exercise.isCustom && <span className="ml-1 text-[10px] text-amber-500">(custom)</span>}
                  </span>
                </div>
                <span className="inline-flex items-center shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-green-500 ring-1 ring-inset ring-green-500/20">
                  {muscles.map((m) => m.replace(/-/g, " ")).join(", ")}
                </span>
              </li>
            );
          })}

          {/* Create custom */}
          <li
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-raised transition-colors border-t border-border text-green-500"
            onClick={() => { setIsOpen(false); setShowCreateForm(true); setCreateName(query); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-sm font-medium">Create custom exercise{query ? `: "${query}"` : ""}</span>
          </li>

          {results.length === 0 && !isLoading && (
            <li className="px-3 py-3 text-sm text-text-muted text-center">No exercises found</li>
          )}
        </ul>
      )}
    </div>
  );
}
