"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Model from "react-body-highlighter";
import type { Muscle, IExerciseData, IMuscleStats } from "react-body-highlighter";

export interface MuscleActivity {
  name: string;
  muscles: Muscle[];
  frequency: number;
}

interface BodyDiagramProps {
  data: MuscleActivity[];
  onMuscleClick: (muscle: string) => void;
}

// Muscles that are not interactable - hide or dim them
const NON_INTERACTABLE: Set<string> = new Set(["head", "neck", "knees", "left-soleus", "right-soleus"]);

// Map slug to display name for tooltip
const MUSCLE_NAMES: Record<string, string> = {
  chest: "Chest",
  "front-deltoids": "Front Delts",
  "back-deltoids": "Rear Delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearm: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  quadriceps: "Quads",
  hamstring: "Hamstrings",
  gluteal: "Glutes",
  calves: "Calves",
  trapezius: "Traps",
  "upper-back": "Lats / Upper Back",
  "lower-back": "Lower Back",
  adductor: "Adductors (Inner Thigh)",
  abductors: "Abductors (Outer Thigh)",
};

export default function BodyDiagram({ data, onMuscleClick }: BodyDiagramProps) {
  const [view, setView] = useState<"anterior" | "posterior">("anterior");
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Get frequency for a muscle slug
  const getFrequency = useCallback(
    (slug: string): number => {
      const entry = data.find((d) => d.muscles.includes(slug as Muscle));
      return entry?.frequency ?? 0;
    },
    [data]
  );

  // Attach hover listeners to SVG paths after render
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const svg = container.querySelector("svg");
    if (!svg) return;

    function handleMouseOver(e: Event) {
      const target = e.target as SVGElement;
      if (!target || target.tagName !== "path") return;

      // Find the muscle slug - the library groups paths by muscle
      // Each path has a parent <g> or is identified by its fill + position
      const parent = target.closest("[id]");
      const muscleId = parent?.id;

      if (muscleId && !NON_INTERACTABLE.has(muscleId)) {
        setHovered(muscleId);
      }
    }

    function handleMouseMove(e: Event) {
      const me = e as MouseEvent;
      const rect = container!.getBoundingClientRect();
      setTooltipPos({
        x: me.clientX - rect.left,
        y: me.clientY - rect.top,
      });
    }

    function handleMouseOut(e: Event) {
      const target = e.target as SVGElement;
      const related = (e as MouseEvent).relatedTarget as Element | null;
      // Only clear if leaving the SVG entirely or going to a different muscle
      if (!related || !svg!.contains(related)) {
        setHovered(null);
      } else if (related.tagName === "path") {
        // Will be handled by the next mouseover
      }
    }

    svg.addEventListener("mouseover", handleMouseOver);
    svg.addEventListener("mousemove", handleMouseMove);
    svg.addEventListener("mouseout", handleMouseOut);

    return () => {
      svg.removeEventListener("mouseover", handleMouseOver);
      svg.removeEventListener("mousemove", handleMouseMove);
      svg.removeEventListener("mouseout", handleMouseOut);
    };
  }, [view]);

  // Hide non-interactable parts and add hover brightness
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const svg = container.querySelector("svg");
    if (!svg) return;

    const allPaths = svg.querySelectorAll("path");
    allPaths.forEach((path) => {
      const el = path as SVGPathElement;
      const parent = el.closest("[id]");
      const id = parent?.id;

      // Add transition to all paths
      el.style.transition = "filter 0.15s ease, opacity 0.15s ease";

      if (id && NON_INTERACTABLE.has(id)) {
        el.style.cursor = "default";
        el.style.opacity = "0.3";
        el.style.pointerEvents = "none";
      } else {
        // Add hover handlers directly to each interactive path
        el.addEventListener("mouseenter", () => {
          el.style.filter = "brightness(1.5) drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))";
        });
        el.addEventListener("mouseleave", () => {
          el.style.filter = "";
        });
      }
    });
  }, [view, data]);

  return (
    <div className="flex flex-col items-center">
      {/* View Toggle */}
      <div className="flex gap-1 mb-4 bg-surface-raised rounded-lg p-1">
        <button
          onClick={() => setView("anterior")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === "anterior"
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          Front
        </button>
        <button
          onClick={() => setView("posterior")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === "posterior"
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          Back
        </button>
      </div>

      {/* Body Model */}
      <div ref={containerRef} className="w-full max-w-[320px] relative body-diagram-hover">
        <Model
          data={data}
          style={{ width: "100%", padding: "0" }}
          onClick={(e: IMuscleStats) => {
            if (!NON_INTERACTABLE.has(e.muscle)) {
              onMuscleClick(e.muscle);
            }
          }}
          type={view}
          highlightedColors={["#86EFAC", "#4ADE80", "#22C55E", "#16A34A", "#15803D"]}
          bodyColor="#44403C"
        />

        {/* Hover Tooltip */}
        {hovered && MUSCLE_NAMES[hovered] && (
          <div
            className="absolute z-10 pointer-events-none bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap border border-stone-700"
            style={{
              left: Math.min(tooltipPos.x + 12, 240),
              top: tooltipPos.y - 32,
            }}
          >
            <div>{MUSCLE_NAMES[hovered]}</div>
            {getFrequency(hovered) > 0 && (
              <div className="text-green-400 text-[10px]">
                {getFrequency(hovered)} session{getFrequency(hovered) !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-text-muted">
        <div className="w-3 h-3 rounded bg-[#44403C]" />
        <span>Untrained</span>
        <div className="w-3 h-3 rounded bg-[#86EFAC] ml-2" />
        <span>Light</span>
        <div className="w-3 h-3 rounded bg-[#22C55E] ml-1" />
        <span>Moderate</span>
        <div className="w-3 h-3 rounded bg-[#15803D] ml-1" />
        <span>Heavy</span>
      </div>
      <p className="text-xs text-text-muted mt-1">Click a muscle group for details</p>

    </div>
  );
}
