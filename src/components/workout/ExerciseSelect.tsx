"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string;
}

interface ExerciseSelectProps {
  onSelect: (exercise: Exercise) => void;
  excludeIds?: string[];
}

export default function ExerciseSelect({
  onSelect,
  excludeIds = [],
}: ExerciseSelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchExercises = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/exercises?q=${encodeURIComponent(searchTerm)}`
        );
        if (!res.ok) throw new Error("Failed to fetch exercises");
        const data: Exercise[] = await res.json();

        const filtered = excludeIds.length
          ? data.filter((ex) => !excludeIds.includes(ex.id))
          : data;

        setResults(filtered);
        setIsOpen(filtered.length > 0);
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

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchExercises(value);
      }, 300);
    },
    [fetchExercises]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSelect = useCallback(
    (exercise: Exercise) => {
      onSelect(exercise);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search exercises..."
          className="block w-full rounded-lg border border-border bg-surface-raised px-3 py-2 pl-9 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
          aria-label="Search exercises"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
          {isLoading ? (
            <svg
              className="h-4 w-4 animate-spin text-text-muted"
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
          ) : (
            <svg
              className="h-4 w-4 text-text-muted"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <ul
          className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-border bg-surface shadow-lg"
          role="listbox"
        >
          {results.map((exercise) => (
            <li
              key={exercise.id}
              role="option"
              aria-selected={false}
              className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-surface-raised transition-colors"
              onClick={() => handleSelect(exercise)}
            >
              <span className="text-sm font-medium text-text-primary truncate">
                {exercise.name}
              </span>
              <span className="inline-flex items-center shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-xs font-medium text-text-secondary ring-1 ring-inset ring-border">
                {exercise.primaryMuscles}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
