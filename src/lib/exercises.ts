export interface ExerciseDefinition {
  name: string;
  category: "compound" | "isolation";
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight";
  primaryMuscles: string[];
  secondaryMuscles: string[];
  isStrengthStandard: boolean;
}

export const EXERCISES: ExerciseDefinition[] = [
  // Chest
  { name: "Bench Press", category: "compound", equipment: "barbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: true },
  { name: "Incline Bench Press", category: "compound", equipment: "barbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Incline Dumbbell Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Dumbbell Bench Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Cable Fly", category: "isolation", equipment: "cable", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids"], isStrengthStandard: false },
  { name: "Push-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Chest Dip", category: "compound", equipment: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front-deltoids"], isStrengthStandard: false },
  { name: "Pec Deck", category: "isolation", equipment: "machine", primaryMuscles: ["chest"], secondaryMuscles: [], isStrengthStandard: false },

  // Shoulders
  { name: "Overhead Press", category: "compound", equipment: "barbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps", "trapezius"], isStrengthStandard: true },
  { name: "Dumbbell Shoulder Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Arnold Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Lateral Raise", category: "isolation", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Front Raise", category: "isolation", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Face Pull", category: "isolation", equipment: "cable", primaryMuscles: ["back-deltoids"], secondaryMuscles: ["trapezius"], isStrengthStandard: false },
  { name: "Reverse Fly", category: "isolation", equipment: "dumbbell", primaryMuscles: ["back-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Rear Delt Cable Fly", category: "isolation", equipment: "cable", primaryMuscles: ["back-deltoids"], secondaryMuscles: [], isStrengthStandard: false },

  // Arms
  { name: "Barbell Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], isStrengthStandard: true },
  { name: "Dumbbell Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], isStrengthStandard: false },
  { name: "Hammer Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], isStrengthStandard: false },
  { name: "Preacher Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Concentration Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Tricep Pushdown", category: "isolation", equipment: "cable", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Skull Crusher", category: "isolation", equipment: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Overhead Tricep Extension", category: "isolation", equipment: "dumbbell", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Dips", category: "compound", equipment: "bodyweight", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "front-deltoids"], isStrengthStandard: false },
  { name: "Close-Grip Bench Press", category: "compound", equipment: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: ["chest"], isStrengthStandard: false },
  { name: "Wrist Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["forearm"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Reverse Wrist Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["forearm"], secondaryMuscles: [], isStrengthStandard: false },

  // Back
  { name: "Deadlift", category: "compound", equipment: "barbell", primaryMuscles: ["lower-back", "hamstring", "gluteal"], secondaryMuscles: ["trapezius", "forearm", "quadriceps"], isStrengthStandard: true },
  { name: "Barbell Row", category: "compound", equipment: "barbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "lower-back", "back-deltoids"], isStrengthStandard: true },
  { name: "Pull-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "forearm"], isStrengthStandard: true },
  { name: "Lat Pulldown", category: "compound", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps"], isStrengthStandard: false },
  { name: "Seated Cable Row", category: "compound", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "T-Bar Row", category: "compound", equipment: "barbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "lower-back"], isStrengthStandard: false },
  { name: "Dumbbell Row", category: "compound", equipment: "dumbbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps"], isStrengthStandard: false },
  { name: "Back Extension", category: "isolation", equipment: "bodyweight", primaryMuscles: ["lower-back"], secondaryMuscles: ["gluteal", "hamstring"], isStrengthStandard: false },
  { name: "Good Morning", category: "compound", equipment: "barbell", primaryMuscles: ["lower-back"], secondaryMuscles: ["hamstring", "gluteal"], isStrengthStandard: false },
  { name: "Barbell Shrug", category: "isolation", equipment: "barbell", primaryMuscles: ["trapezius"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Dumbbell Shrug", category: "isolation", equipment: "dumbbell", primaryMuscles: ["trapezius"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Farmer's Walk", category: "compound", equipment: "dumbbell", primaryMuscles: ["forearm", "trapezius"], secondaryMuscles: ["abs"], isStrengthStandard: false },

  // Legs
  { name: "Squat", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring", "lower-back", "abs"], isStrengthStandard: true },
  { name: "Front Squat", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps"], secondaryMuscles: ["gluteal", "abs"], isStrengthStandard: false },
  { name: "Leg Press", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Leg Extension", category: "isolation", equipment: "machine", primaryMuscles: ["quadriceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Bulgarian Split Squat", category: "compound", equipment: "dumbbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Leg Curl", category: "isolation", equipment: "machine", primaryMuscles: ["hamstring"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Romanian Deadlift", category: "compound", equipment: "barbell", primaryMuscles: ["hamstring", "gluteal"], secondaryMuscles: ["lower-back"], isStrengthStandard: false },
  { name: "Nordic Hamstring Curl", category: "isolation", equipment: "bodyweight", primaryMuscles: ["hamstring"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Hip Thrust", category: "compound", equipment: "barbell", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Glute Bridge", category: "compound", equipment: "bodyweight", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Standing Calf Raise", category: "isolation", equipment: "machine", primaryMuscles: ["calves"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Seated Calf Raise", category: "isolation", equipment: "machine", primaryMuscles: ["calves"], secondaryMuscles: [], isStrengthStandard: false },

  // Core
  { name: "Hanging Leg Raise", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], isStrengthStandard: false },
  { name: "Cable Crunch", category: "isolation", equipment: "cable", primaryMuscles: ["abs"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Ab Wheel Rollout", category: "compound", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["lower-back"], isStrengthStandard: false },
  { name: "Plank", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], isStrengthStandard: false },
  { name: "Cable Woodchop", category: "compound", equipment: "cable", primaryMuscles: ["obliques"], secondaryMuscles: ["abs"], isStrengthStandard: false },
  { name: "Russian Twist", category: "isolation", equipment: "bodyweight", primaryMuscles: ["obliques"], secondaryMuscles: ["abs"], isStrengthStandard: false },
  { name: "Side Plank", category: "isolation", equipment: "bodyweight", primaryMuscles: ["obliques"], secondaryMuscles: ["abs"], isStrengthStandard: false },
];
