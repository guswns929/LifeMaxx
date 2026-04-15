"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Model from "react-body-highlighter";
import type { Muscle, IExerciseData, IMuscleStats } from "react-body-highlighter";

export interface MuscleActivity {
  name: string;
  muscles: Muscle[];
  frequency: number;
}

export type MapMode = "weekly" | "overall";

export interface OverallMuscleData {
  slug: string;
  developmentScore: number; // 0-100
  percentile: number | null;
}

interface BodyDiagramProps {
  data: MuscleActivity[];
  overallData?: OverallMuscleData[];
  mode?: MapMode;
  onModeChange?: (mode: MapMode) => void;
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

// Color scales for the two modes
// Weekly: strain-based (blue -> yellow -> orange -> red)
const WEEKLY_COLORS = ["#60A5FA", "#FACC15", "#F97316", "#EF4444", "#DC2626"];
// Overall: development-based (wider gradient from grey through green to gold)
const OVERALL_COLORS = ["#6B7280", "#22C55E", "#16A34A", "#EAB308", "#F59E0B"];

export default function BodyDiagram({ data, overallData, mode = "weekly", onModeChange, onMuscleClick }: BodyDiagramProps) {
  const [view, setView] = useState<"anterior" | "posterior">("anterior");
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Build the model data based on mode
  const modelData = mode === "overall" && overallData
    ? overallData
        .filter((d) => d.developmentScore > 0)
        .map((d) => ({
          name: d.slug,
          muscles: [d.slug as Muscle],
          // Map development score (0-100) to frequency bins (1-5) for color intensity
          frequency: Math.max(1, Math.min(5, Math.ceil(d.developmentScore / 20))),
        }))
    : data;

  // Get frequency for a muscle slug
  const getFrequency = useCallback(
    (slug: string): number => {
      const entry = modelData.find((d) => d.muscles.includes(slug as Muscle));
      return entry?.frequency ?? 0;
    },
    [modelData]
  );

  // Get tooltip text based on mode
  const getTooltipInfo = useCallback(
    (slug: string): { label: string; detail: string | null } => {
      if (mode === "overall" && overallData) {
        const d = overallData.find((o) => o.slug === slug);
        if (d) {
          const pctText = d.percentile != null ? ` | Top ${100 - d.percentile}%` : "";
          return {
            label: MUSCLE_NAMES[slug] || slug,
            detail: `Dev: ${d.developmentScore}/100${pctText}`,
          };
        }
      }
      const freq = getFrequency(slug);
      return {
        label: MUSCLE_NAMES[slug] || slug,
        detail: freq > 0 ? `${freq} session${freq !== 1 ? "s" : ""} this week` : null,
      };
    },
    [mode, overallData, getFrequency]
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
      const related = (e as MouseEvent).relatedTarget as Element | null;
      if (!related || !svg!.contains(related)) {
        setHovered(null);
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
  }, [view, mode]);

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

      el.style.transition = "filter 0.15s ease, opacity 0.15s ease";

      if (id && NON_INTERACTABLE.has(id)) {
        el.style.cursor = "default";
        el.style.opacity = "0.3";
        el.style.pointerEvents = "none";
      } else {
        el.addEventListener("mouseenter", () => {
          el.style.filter = "brightness(1.5) drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))";
        });
        el.addEventListener("mouseleave", () => {
          el.style.filter = "";
        });
      }
    });
  }, [view, modelData]);

  const colors = mode === "overall" ? OVERALL_COLORS : WEEKLY_COLORS;

  return (
    <div className="flex flex-col items-center">
      {/* Mode + View Toggle */}
      <div className="flex flex-col gap-2 mb-4 w-full">
        {onModeChange && (
          <div className="flex gap-1 bg-surface-raised rounded-lg p-1 self-center">
            <button
              onClick={() => onModeChange("weekly")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === "weekly"
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => onModeChange("overall")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === "overall"
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Overall
            </button>
          </div>
        )}
        <div className="flex gap-1 bg-surface-raised rounded-lg p-1 self-center">
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
      </div>

      {/* Body Model */}
      <div ref={containerRef} className="w-full max-w-[320px] relative body-diagram-hover">
        <Model
          data={modelData}
          style={{ width: "100%", padding: "0" }}
          onClick={(e: IMuscleStats) => {
            if (!NON_INTERACTABLE.has(e.muscle)) {
              onMuscleClick(e.muscle);
            }
          }}
          type={view}
          highlightedColors={colors}
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
            {(() => {
              const info = getTooltipInfo(hovered);
              return (
                <>
                  <div>{info.label}</div>
                  {info.detail && (
                    <div className={mode === "overall" ? "text-amber-400 text-[10px]" : "text-green-400 text-[10px]"}>
                      {info.detail}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Legend */}
      {mode === "weekly" ? (
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-text-muted">
          <div className="w-3 h-3 rounded bg-[#44403C]" />
          <span>Untrained</span>
          <div className="w-3 h-3 rounded bg-[#60A5FA] ml-2" />
          <span>Light</span>
          <div className="w-3 h-3 rounded bg-[#FACC15] ml-1" />
          <span>Moderate</span>
          <div className="w-3 h-3 rounded bg-[#EF4444] ml-1" />
          <span>Heavy</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-text-muted">
          <div className="w-3 h-3 rounded bg-[#44403C]" />
          <span>No Data</span>
          <div className="w-3 h-3 rounded bg-[#6B7280] ml-2" />
          <span>Beginner</span>
          <div className="w-3 h-3 rounded bg-[#22C55E] ml-1" />
          <span>Developing</span>
          <div className="w-3 h-3 rounded bg-[#EAB308] ml-1" />
          <span>Strong</span>
          <div className="w-3 h-3 rounded bg-[#F59E0B] ml-1" />
          <span>Elite</span>
        </div>
      )}
      <p className="text-xs text-text-muted mt-1">
        {mode === "weekly" ? "Showing this week's training load" : "Showing overall muscle development"}
      </p>
    </div>
  );
}
