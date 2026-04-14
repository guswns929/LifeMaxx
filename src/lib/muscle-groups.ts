export interface MuscleGroup {
  slug: string;
  displayName: string;
  view: "anterior" | "posterior" | "both";
  size: "large" | "medium" | "small";
  optimalFrequency: number;
  suggestedExercises: string[];
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    slug: "chest",
    displayName: "Chest",
    view: "anterior",
    size: "large",
    optimalFrequency: 2,
    suggestedExercises: ["Bench Press", "Incline Dumbbell Press", "Cable Fly", "Push-Up"],
  },
  {
    slug: "front-deltoids",
    displayName: "Shoulders (Front)",
    view: "anterior",
    size: "medium",
    optimalFrequency: 2,
    suggestedExercises: ["Overhead Press", "Arnold Press", "Front Raise"],
  },
  {
    slug: "biceps",
    displayName: "Biceps",
    view: "anterior",
    size: "small",
    optimalFrequency: 2.5,
    suggestedExercises: ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl"],
  },
  {
    slug: "triceps",
    displayName: "Triceps",
    view: "both",
    size: "small",
    optimalFrequency: 2.5,
    suggestedExercises: ["Tricep Pushdown", "Skull Crusher", "Overhead Tricep Extension", "Dips"],
  },
  {
    slug: "forearm",
    displayName: "Forearms",
    view: "anterior",
    size: "small",
    optimalFrequency: 2,
    suggestedExercises: ["Wrist Curl", "Reverse Wrist Curl", "Farmer's Walk"],
  },
  {
    slug: "abs",
    displayName: "Abs",
    view: "anterior",
    size: "small",
    optimalFrequency: 3,
    suggestedExercises: ["Hanging Leg Raise", "Cable Crunch", "Ab Wheel Rollout", "Plank"],
  },
  {
    slug: "obliques",
    displayName: "Obliques",
    view: "anterior",
    size: "small",
    optimalFrequency: 2,
    suggestedExercises: ["Cable Woodchop", "Russian Twist", "Side Plank"],
  },
  {
    slug: "quadriceps",
    displayName: "Quads",
    view: "anterior",
    size: "large",
    optimalFrequency: 2,
    suggestedExercises: ["Squat", "Leg Press", "Leg Extension", "Bulgarian Split Squat"],
  },
  {
    slug: "calves",
    displayName: "Calves",
    view: "both",
    size: "small",
    optimalFrequency: 3,
    suggestedExercises: ["Standing Calf Raise", "Seated Calf Raise"],
  },
  {
    slug: "trapezius",
    displayName: "Traps",
    view: "posterior",
    size: "medium",
    optimalFrequency: 2,
    suggestedExercises: ["Barbell Shrug", "Dumbbell Shrug", "Face Pull"],
  },
  {
    slug: "upper-back",
    displayName: "Lats / Upper Back",
    view: "posterior",
    size: "large",
    optimalFrequency: 2,
    suggestedExercises: ["Pull-Up", "Barbell Row", "Lat Pulldown", "Seated Cable Row"],
  },
  {
    slug: "lower-back",
    displayName: "Lower Back",
    view: "posterior",
    size: "medium",
    optimalFrequency: 2,
    suggestedExercises: ["Deadlift", "Back Extension", "Good Morning"],
  },
  {
    slug: "back-deltoids",
    displayName: "Shoulders (Rear)",
    view: "posterior",
    size: "small",
    optimalFrequency: 2,
    suggestedExercises: ["Face Pull", "Reverse Fly", "Rear Delt Cable Fly"],
  },
  {
    slug: "gluteal",
    displayName: "Glutes",
    view: "posterior",
    size: "large",
    optimalFrequency: 2,
    suggestedExercises: ["Hip Thrust", "Romanian Deadlift", "Glute Bridge", "Squat"],
  },
  {
    slug: "hamstring",
    displayName: "Hamstrings",
    view: "posterior",
    size: "large",
    optimalFrequency: 2,
    suggestedExercises: ["Romanian Deadlift", "Leg Curl", "Nordic Hamstring Curl"],
  },
  {
    slug: "abductors",
    displayName: "Abductors (Outer Thigh)",
    view: "posterior",
    size: "medium",
    optimalFrequency: 2,
    suggestedExercises: ["Hip Abduction Machine", "Cable Hip Abduction", "Clamshells", "Side-Lying Leg Raise"],
  },
  {
    slug: "adductor",
    displayName: "Adductors (Inner Thigh)",
    view: "anterior",
    size: "medium",
    optimalFrequency: 2,
    suggestedExercises: ["Hip Adduction Machine", "Copenhagen Plank", "Sumo Squat", "Lateral Lunges"],
  },
];

export function getMuscleBySlug(slug: string): MuscleGroup | undefined {
  return MUSCLE_GROUPS.find((m) => m.slug === slug);
}

export function getMusclesByView(view: "anterior" | "posterior"): MuscleGroup[] {
  return MUSCLE_GROUPS.filter((m) => m.view === view || m.view === "both");
}

export function getSlugDisplayMap(): Record<string, string> {
  return Object.fromEntries(MUSCLE_GROUPS.map((m) => [m.slug, m.displayName]));
}
