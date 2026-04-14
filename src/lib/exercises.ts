export interface ExerciseDefinition {
  name: string;
  category: "compound" | "isolation";
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight" | "other";
  primaryMuscles: string[];
  secondaryMuscles: string[];
  isStrengthStandard: boolean;
}

export const EXERCISES: ExerciseDefinition[] = [
  // ════════════════════════════════════════
  // CHEST
  // ════════════════════════════════════════
  { name: "Bench Press", category: "compound", equipment: "barbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: true },
  { name: "Incline Bench Press", category: "compound", equipment: "barbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Decline Bench Press", category: "compound", equipment: "barbell", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front-deltoids"], isStrengthStandard: false },
  { name: "Dumbbell Bench Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Incline Dumbbell Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Decline Dumbbell Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Dumbbell Fly", category: "isolation", equipment: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids"], isStrengthStandard: false },
  { name: "Incline Dumbbell Fly", category: "isolation", equipment: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids"], isStrengthStandard: false },
  { name: "Cable Fly", category: "isolation", equipment: "cable", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids"], isStrengthStandard: false },
  { name: "Low Cable Fly", category: "isolation", equipment: "cable", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids"], isStrengthStandard: false },
  { name: "High Cable Fly", category: "isolation", equipment: "cable", primaryMuscles: ["chest"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Cable Crossover", category: "isolation", equipment: "cable", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids"], isStrengthStandard: false },
  { name: "Pec Deck", category: "isolation", equipment: "machine", primaryMuscles: ["chest"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Machine Chest Press", category: "compound", equipment: "machine", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front-deltoids"], isStrengthStandard: false },
  { name: "Smith Machine Bench Press", category: "compound", equipment: "machine", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front-deltoids"], isStrengthStandard: false },
  { name: "Chest Dip", category: "compound", equipment: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front-deltoids"], isStrengthStandard: false },
  { name: "Push-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Diamond Push-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["chest", "triceps"], secondaryMuscles: ["front-deltoids"], isStrengthStandard: false },
  { name: "Wide Push-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Decline Push-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids", "triceps"], isStrengthStandard: false },
  { name: "Floor Press", category: "compound", equipment: "barbell", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front-deltoids"], isStrengthStandard: false },
  { name: "Dumbbell Pullover", category: "isolation", equipment: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["upper-back", "triceps"], isStrengthStandard: false },
  { name: "Landmine Press", category: "compound", equipment: "barbell", primaryMuscles: ["chest", "front-deltoids"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Svend Press", category: "isolation", equipment: "other", primaryMuscles: ["chest"], secondaryMuscles: ["front-deltoids"], isStrengthStandard: false },
  { name: "Squeeze Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["chest"], secondaryMuscles: ["triceps"], isStrengthStandard: false },

  // ════════════════════════════════════════
  // SHOULDERS
  // ════════════════════════════════════════
  { name: "Overhead Press", category: "compound", equipment: "barbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps", "trapezius"], isStrengthStandard: true },
  { name: "Dumbbell Shoulder Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Arnold Press", category: "compound", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Push Press", category: "compound", equipment: "barbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps", "quadriceps", "trapezius"], isStrengthStandard: false },
  { name: "Z Press", category: "compound", equipment: "barbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps", "abs"], isStrengthStandard: false },
  { name: "Behind-the-Neck Press", category: "compound", equipment: "barbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps", "trapezius"], isStrengthStandard: false },
  { name: "Machine Shoulder Press", category: "compound", equipment: "machine", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Smith Machine OHP", category: "compound", equipment: "machine", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Lateral Raise", category: "isolation", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Cable Lateral Raise", category: "isolation", equipment: "cable", primaryMuscles: ["front-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Machine Lateral Raise", category: "isolation", equipment: "machine", primaryMuscles: ["front-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Front Raise", category: "isolation", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Plate Front Raise", category: "isolation", equipment: "other", primaryMuscles: ["front-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Cable Front Raise", category: "isolation", equipment: "cable", primaryMuscles: ["front-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Lu Raise", category: "isolation", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["trapezius"], isStrengthStandard: false },
  { name: "Y-Raise", category: "isolation", equipment: "dumbbell", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["trapezius"], isStrengthStandard: false },
  { name: "Face Pull", category: "isolation", equipment: "cable", primaryMuscles: ["back-deltoids"], secondaryMuscles: ["trapezius", "upper-back"], isStrengthStandard: false },
  { name: "Reverse Fly", category: "isolation", equipment: "dumbbell", primaryMuscles: ["back-deltoids"], secondaryMuscles: ["trapezius"], isStrengthStandard: false },
  { name: "Rear Delt Cable Fly", category: "isolation", equipment: "cable", primaryMuscles: ["back-deltoids"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Reverse Pec Deck", category: "isolation", equipment: "machine", primaryMuscles: ["back-deltoids"], secondaryMuscles: ["trapezius"], isStrengthStandard: false },
  { name: "Band Pull-Apart", category: "isolation", equipment: "other", primaryMuscles: ["back-deltoids"], secondaryMuscles: ["trapezius", "upper-back"], isStrengthStandard: false },
  { name: "Prone Y-Raise", category: "isolation", equipment: "dumbbell", primaryMuscles: ["back-deltoids", "trapezius"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Upright Row", category: "compound", equipment: "barbell", primaryMuscles: ["front-deltoids", "trapezius"], secondaryMuscles: ["biceps"], isStrengthStandard: false },
  { name: "Pike Push-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Handstand Push-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["front-deltoids"], secondaryMuscles: ["triceps", "trapezius"], isStrengthStandard: false },

  // ════════════════════════════════════════
  // BACK
  // ════════════════════════════════════════
  { name: "Deadlift", category: "compound", equipment: "barbell", primaryMuscles: ["lower-back", "hamstring", "gluteal"], secondaryMuscles: ["trapezius", "forearm", "quadriceps", "upper-back"], isStrengthStandard: true },
  { name: "Sumo Deadlift", category: "compound", equipment: "barbell", primaryMuscles: ["gluteal", "hamstring"], secondaryMuscles: ["lower-back", "upper-back", "quadriceps", "forearm"], isStrengthStandard: false },
  { name: "Trap Bar Deadlift", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "gluteal", "hamstring"], secondaryMuscles: ["lower-back", "upper-back", "trapezius", "forearm"], isStrengthStandard: false },
  { name: "Deficit Deadlift", category: "compound", equipment: "barbell", primaryMuscles: ["lower-back", "hamstring", "gluteal"], secondaryMuscles: ["upper-back", "forearm"], isStrengthStandard: false },
  { name: "Rack Pull", category: "compound", equipment: "barbell", primaryMuscles: ["upper-back", "lower-back"], secondaryMuscles: ["trapezius", "forearm", "gluteal"], isStrengthStandard: false },
  { name: "Snatch-Grip Deadlift", category: "compound", equipment: "barbell", primaryMuscles: ["lower-back", "hamstring", "gluteal"], secondaryMuscles: ["upper-back", "trapezius"], isStrengthStandard: false },
  { name: "Barbell Row", category: "compound", equipment: "barbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "lower-back", "back-deltoids"], isStrengthStandard: true },
  { name: "Pendlay Row", category: "compound", equipment: "barbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids", "lower-back"], isStrengthStandard: false },
  { name: "T-Bar Row", category: "compound", equipment: "barbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "lower-back"], isStrengthStandard: false },
  { name: "Dumbbell Row", category: "compound", equipment: "dumbbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "Chest-Supported Row", category: "compound", equipment: "dumbbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "Helms Row", category: "compound", equipment: "dumbbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "Kroc Row", category: "compound", equipment: "dumbbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "forearm"], isStrengthStandard: false },
  { name: "Meadows Row", category: "compound", equipment: "barbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "Seal Row", category: "compound", equipment: "barbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "Pull-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "forearm"], isStrengthStandard: true },
  { name: "Chin-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["upper-back", "biceps"], secondaryMuscles: ["forearm"], isStrengthStandard: false },
  { name: "Neutral-Grip Pull-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "forearm"], isStrengthStandard: false },
  { name: "Wide-Grip Pull-Up", category: "compound", equipment: "bodyweight", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps"], isStrengthStandard: false },
  { name: "Weighted Pull-Up", category: "compound", equipment: "other", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "forearm"], isStrengthStandard: false },
  { name: "Inverted Row", category: "compound", equipment: "bodyweight", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "Lat Pulldown", category: "compound", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "forearm"], isStrengthStandard: false },
  { name: "Close-Grip Lat Pulldown", category: "compound", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps"], isStrengthStandard: false },
  { name: "Wide-Grip Lat Pulldown", category: "compound", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps"], isStrengthStandard: false },
  { name: "Reverse-Grip Lat Pulldown", category: "compound", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps"], isStrengthStandard: false },
  { name: "Seated Cable Row", category: "compound", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "Single-Arm Cable Row", category: "compound", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "Straight-Arm Pulldown", category: "isolation", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["triceps"], isStrengthStandard: false },
  { name: "Lat Pullover (Cable)", category: "isolation", equipment: "cable", primaryMuscles: ["upper-back"], secondaryMuscles: ["chest"], isStrengthStandard: false },
  { name: "Lat Pullover (Dumbbell)", category: "isolation", equipment: "dumbbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["chest", "triceps"], isStrengthStandard: false },
  { name: "Lat Pullover (Machine)", category: "isolation", equipment: "machine", primaryMuscles: ["upper-back"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Machine Row", category: "compound", equipment: "machine", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps"], isStrengthStandard: false },
  { name: "Chest-Supported Machine Row", category: "compound", equipment: "machine", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps", "back-deltoids"], isStrengthStandard: false },
  { name: "Landmine Row", category: "compound", equipment: "barbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["biceps"], isStrengthStandard: false },
  { name: "Renegade Row", category: "compound", equipment: "dumbbell", primaryMuscles: ["upper-back"], secondaryMuscles: ["abs", "biceps"], isStrengthStandard: false },
  { name: "Back Extension", category: "isolation", equipment: "bodyweight", primaryMuscles: ["lower-back"], secondaryMuscles: ["gluteal", "hamstring"], isStrengthStandard: false },
  { name: "Reverse Hyperextension", category: "isolation", equipment: "machine", primaryMuscles: ["lower-back", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Superman Hold", category: "isolation", equipment: "bodyweight", primaryMuscles: ["lower-back"], secondaryMuscles: ["gluteal"], isStrengthStandard: false },
  { name: "Good Morning", category: "compound", equipment: "barbell", primaryMuscles: ["lower-back"], secondaryMuscles: ["hamstring", "gluteal"], isStrengthStandard: false },
  { name: "Barbell Shrug", category: "isolation", equipment: "barbell", primaryMuscles: ["trapezius"], secondaryMuscles: ["forearm"], isStrengthStandard: false },
  { name: "Dumbbell Shrug", category: "isolation", equipment: "dumbbell", primaryMuscles: ["trapezius"], secondaryMuscles: [], isStrengthStandard: false },

  // ════════════════════════════════════════
  // BICEPS
  // ════════════════════════════════════════
  { name: "Barbell Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], isStrengthStandard: true },
  { name: "EZ-Bar Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], isStrengthStandard: false },
  { name: "Dumbbell Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], isStrengthStandard: false },
  { name: "Hammer Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps", "forearm"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Incline Dumbbell Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Concentration Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Preacher Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["biceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Spider Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["biceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Drag Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["biceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Zottman Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps", "forearm"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Cross-Body Hammer Curl", category: "isolation", equipment: "dumbbell", primaryMuscles: ["biceps", "forearm"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Cable Curl", category: "isolation", equipment: "cable", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], isStrengthStandard: false },
  { name: "Cable Bayesian Curl", category: "isolation", equipment: "cable", primaryMuscles: ["biceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Machine Curl", category: "isolation", equipment: "machine", primaryMuscles: ["biceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "21s Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["biceps"], secondaryMuscles: ["forearm"], isStrengthStandard: false },
  { name: "Reverse Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["forearm", "biceps"], secondaryMuscles: [], isStrengthStandard: false },

  // ════════════════════════════════════════
  // TRICEPS
  // ════════════════════════════════════════
  { name: "Close-Grip Bench Press", category: "compound", equipment: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "front-deltoids"], isStrengthStandard: false },
  { name: "Skull Crusher", category: "isolation", equipment: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "EZ-Bar Skull Crusher", category: "isolation", equipment: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Dumbbell Skull Crusher", category: "isolation", equipment: "dumbbell", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "JM Press", category: "compound", equipment: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: ["chest"], isStrengthStandard: false },
  { name: "French Press", category: "isolation", equipment: "barbell", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Overhead Tricep Extension", category: "isolation", equipment: "dumbbell", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Tricep Pushdown", category: "isolation", equipment: "cable", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Tricep Rope Pushdown", category: "isolation", equipment: "cable", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Overhead Cable Extension", category: "isolation", equipment: "cable", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Cable Kickback", category: "isolation", equipment: "cable", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Dumbbell Kickback", category: "isolation", equipment: "dumbbell", primaryMuscles: ["triceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Dips", category: "compound", equipment: "bodyweight", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "front-deltoids"], isStrengthStandard: false },
  { name: "Bench Dips", category: "compound", equipment: "bodyweight", primaryMuscles: ["triceps"], secondaryMuscles: ["chest"], isStrengthStandard: false },

  // ════════════════════════════════════════
  // FOREARMS
  // ════════════════════════════════════════
  { name: "Wrist Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["forearm"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Reverse Wrist Curl", category: "isolation", equipment: "barbell", primaryMuscles: ["forearm"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Farmer's Walk", category: "compound", equipment: "dumbbell", primaryMuscles: ["forearm", "trapezius"], secondaryMuscles: ["abs", "obliques"], isStrengthStandard: false },
  { name: "Dead Hang", category: "isolation", equipment: "bodyweight", primaryMuscles: ["forearm"], secondaryMuscles: ["upper-back"], isStrengthStandard: false },
  { name: "Plate Pinch Hold", category: "isolation", equipment: "other", primaryMuscles: ["forearm"], secondaryMuscles: [], isStrengthStandard: false },

  // ════════════════════════════════════════
  // QUADRICEPS & COMPOUND LEGS
  // ════════════════════════════════════════
  { name: "Squat", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring", "lower-back", "abs"], isStrengthStandard: true },
  { name: "Front Squat", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps"], secondaryMuscles: ["gluteal", "abs"], isStrengthStandard: false },
  { name: "Overhead Squat", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps"], secondaryMuscles: ["gluteal", "abs", "front-deltoids"], isStrengthStandard: false },
  { name: "Pause Squat", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring", "lower-back"], isStrengthStandard: false },
  { name: "Box Squat", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring", "lower-back"], isStrengthStandard: false },
  { name: "Safety Bar Squat", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring", "lower-back"], isStrengthStandard: false },
  { name: "Zercher Squat", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["abs", "biceps", "upper-back"], isStrengthStandard: false },
  { name: "Goblet Squat", category: "compound", equipment: "dumbbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["abs"], isStrengthStandard: false },
  { name: "Bulgarian Split Squat", category: "compound", equipment: "dumbbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Walking Lunge", category: "compound", equipment: "dumbbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Reverse Lunge", category: "compound", equipment: "dumbbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Lateral Lunge", category: "compound", equipment: "dumbbell", primaryMuscles: ["quadriceps", "gluteal", "adductor"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Curtsy Lunge", category: "compound", equipment: "dumbbell", primaryMuscles: ["gluteal", "quadriceps"], secondaryMuscles: ["adductor"], isStrengthStandard: false },
  { name: "Step-Up", category: "compound", equipment: "dumbbell", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Leg Press", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Hack Squat Machine", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps"], secondaryMuscles: ["gluteal"], isStrengthStandard: false },
  { name: "Smith Machine Squat", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Pendulum Squat", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps"], secondaryMuscles: ["gluteal"], isStrengthStandard: false },
  { name: "Belt Squat", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "V-Squat", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Leg Extension", category: "isolation", equipment: "machine", primaryMuscles: ["quadriceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Sissy Squat", category: "isolation", equipment: "bodyweight", primaryMuscles: ["quadriceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Reverse Nordic", category: "isolation", equipment: "bodyweight", primaryMuscles: ["quadriceps"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Pistol Squat", category: "compound", equipment: "bodyweight", primaryMuscles: ["quadriceps", "gluteal"], secondaryMuscles: ["hamstring", "abs"], isStrengthStandard: false },
  { name: "Wall Sit", category: "isolation", equipment: "bodyweight", primaryMuscles: ["quadriceps"], secondaryMuscles: ["gluteal"], isStrengthStandard: false },

  // ════════════════════════════════════════
  // HAMSTRINGS
  // ════════════════════════════════════════
  { name: "Romanian Deadlift", category: "compound", equipment: "barbell", primaryMuscles: ["hamstring", "gluteal"], secondaryMuscles: ["lower-back"], isStrengthStandard: false },
  { name: "Stiff-Leg Deadlift", category: "compound", equipment: "barbell", primaryMuscles: ["hamstring"], secondaryMuscles: ["lower-back", "gluteal"], isStrengthStandard: false },
  { name: "Dumbbell Romanian Deadlift", category: "compound", equipment: "dumbbell", primaryMuscles: ["hamstring", "gluteal"], secondaryMuscles: ["lower-back"], isStrengthStandard: false },
  { name: "Single-Leg Romanian Deadlift", category: "compound", equipment: "dumbbell", primaryMuscles: ["hamstring", "gluteal"], secondaryMuscles: ["lower-back"], isStrengthStandard: false },
  { name: "Leg Curl", category: "isolation", equipment: "machine", primaryMuscles: ["hamstring"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Seated Leg Curl", category: "isolation", equipment: "machine", primaryMuscles: ["hamstring"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Lying Leg Curl", category: "isolation", equipment: "machine", primaryMuscles: ["hamstring"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Nordic Hamstring Curl", category: "isolation", equipment: "bodyweight", primaryMuscles: ["hamstring"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Glute-Ham Raise", category: "compound", equipment: "machine", primaryMuscles: ["hamstring", "gluteal"], secondaryMuscles: ["lower-back"], isStrengthStandard: false },
  { name: "Cable Pull-Through", category: "compound", equipment: "cable", primaryMuscles: ["hamstring", "gluteal"], secondaryMuscles: ["lower-back"], isStrengthStandard: false },
  { name: "Kettlebell Swing", category: "compound", equipment: "other", primaryMuscles: ["hamstring", "gluteal"], secondaryMuscles: ["lower-back", "abs", "front-deltoids"], isStrengthStandard: false },

  // ════════════════════════════════════════
  // GLUTES
  // ════════════════════════════════════════
  { name: "Hip Thrust", category: "compound", equipment: "barbell", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Dumbbell Hip Thrust", category: "compound", equipment: "dumbbell", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Glute Bridge", category: "compound", equipment: "bodyweight", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Single-Leg Glute Bridge", category: "compound", equipment: "bodyweight", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Cable Glute Kickback", category: "isolation", equipment: "cable", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Donkey Kick", category: "isolation", equipment: "bodyweight", primaryMuscles: ["gluteal"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Fire Hydrant", category: "isolation", equipment: "bodyweight", primaryMuscles: ["gluteal", "abductors"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Frog Pump", category: "isolation", equipment: "bodyweight", primaryMuscles: ["gluteal"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Sumo Squat", category: "compound", equipment: "dumbbell", primaryMuscles: ["gluteal", "quadriceps", "adductor"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },

  // ════════════════════════════════════════
  // ABDUCTORS & ADDUCTORS
  // ════════════════════════════════════════
  { name: "Hip Abduction Machine", category: "isolation", equipment: "machine", primaryMuscles: ["abductors"], secondaryMuscles: ["gluteal"], isStrengthStandard: false },
  { name: "Cable Hip Abduction", category: "isolation", equipment: "cable", primaryMuscles: ["abductors"], secondaryMuscles: ["gluteal"], isStrengthStandard: false },
  { name: "Side-Lying Leg Raise", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abductors"], secondaryMuscles: ["gluteal"], isStrengthStandard: false },
  { name: "Clamshell", category: "isolation", equipment: "other", primaryMuscles: ["abductors", "gluteal"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Banded Lateral Walk", category: "isolation", equipment: "other", primaryMuscles: ["abductors", "gluteal"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Hip Adduction Machine", category: "isolation", equipment: "machine", primaryMuscles: ["adductor"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Copenhagen Plank", category: "isolation", equipment: "bodyweight", primaryMuscles: ["adductor"], secondaryMuscles: ["obliques", "abs"], isStrengthStandard: false },

  // ════════════════════════════════════════
  // CALVES
  // ════════════════════════════════════════
  { name: "Standing Calf Raise", category: "isolation", equipment: "machine", primaryMuscles: ["calves"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Seated Calf Raise", category: "isolation", equipment: "machine", primaryMuscles: ["calves"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Leg Press Calf Raise", category: "isolation", equipment: "machine", primaryMuscles: ["calves"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Smith Machine Calf Raise", category: "isolation", equipment: "machine", primaryMuscles: ["calves"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Donkey Calf Raise", category: "isolation", equipment: "machine", primaryMuscles: ["calves"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Single-Leg Calf Raise", category: "isolation", equipment: "bodyweight", primaryMuscles: ["calves"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Tibialis Raise", category: "isolation", equipment: "bodyweight", primaryMuscles: ["calves"], secondaryMuscles: [], isStrengthStandard: false },

  // ════════════════════════════════════════
  // CORE — ABS & OBLIQUES
  // ════════════════════════════════════════
  { name: "Plank", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques", "lower-back"], isStrengthStandard: false },
  { name: "Side Plank", category: "isolation", equipment: "bodyweight", primaryMuscles: ["obliques"], secondaryMuscles: ["abs"], isStrengthStandard: false },
  { name: "Hanging Leg Raise", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], isStrengthStandard: false },
  { name: "Hanging Knee Raise", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Toes-to-Bar", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], isStrengthStandard: false },
  { name: "Cable Crunch", category: "isolation", equipment: "cable", primaryMuscles: ["abs"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Ab Wheel Rollout", category: "compound", equipment: "other", primaryMuscles: ["abs"], secondaryMuscles: ["obliques", "lower-back"], isStrengthStandard: false },
  { name: "Crunch", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Reverse Crunch", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], isStrengthStandard: false },
  { name: "Decline Sit-Up", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], isStrengthStandard: false },
  { name: "V-Up", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], isStrengthStandard: false },
  { name: "Dragon Flag", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques", "lower-back"], isStrengthStandard: false },
  { name: "L-Sit Hold", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["quadriceps"], isStrengthStandard: false },
  { name: "Dead Bug", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], isStrengthStandard: false },
  { name: "Hollow Body Hold", category: "isolation", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques"], isStrengthStandard: false },
  { name: "Mountain Climber", category: "compound", equipment: "bodyweight", primaryMuscles: ["abs"], secondaryMuscles: ["obliques", "quadriceps"], isStrengthStandard: false },
  { name: "Cable Woodchop", category: "compound", equipment: "cable", primaryMuscles: ["obliques"], secondaryMuscles: ["abs"], isStrengthStandard: false },
  { name: "Pallof Press", category: "isolation", equipment: "cable", primaryMuscles: ["abs", "obliques"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Russian Twist", category: "isolation", equipment: "bodyweight", primaryMuscles: ["obliques"], secondaryMuscles: ["abs"], isStrengthStandard: false },
  { name: "Bicycle Crunch", category: "isolation", equipment: "bodyweight", primaryMuscles: ["obliques", "abs"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Windshield Wiper", category: "isolation", equipment: "bodyweight", primaryMuscles: ["obliques"], secondaryMuscles: ["abs"], isStrengthStandard: false },
  { name: "Side Bend", category: "isolation", equipment: "dumbbell", primaryMuscles: ["obliques"], secondaryMuscles: [], isStrengthStandard: false },
  { name: "Landmine Rotation", category: "compound", equipment: "barbell", primaryMuscles: ["obliques"], secondaryMuscles: ["abs", "front-deltoids"], isStrengthStandard: false },
  { name: "Suitcase Carry", category: "compound", equipment: "dumbbell", primaryMuscles: ["obliques"], secondaryMuscles: ["forearm", "trapezius", "abs"], isStrengthStandard: false },

  // ════════════════════════════════════════
  // OLYMPIC / POWER / FUNCTIONAL
  // ════════════════════════════════════════
  { name: "Power Clean", category: "compound", equipment: "barbell", primaryMuscles: ["hamstring", "gluteal", "trapezius"], secondaryMuscles: ["quadriceps", "upper-back", "forearm"], isStrengthStandard: false },
  { name: "Hang Clean", category: "compound", equipment: "barbell", primaryMuscles: ["hamstring", "gluteal", "trapezius"], secondaryMuscles: ["quadriceps", "upper-back"], isStrengthStandard: false },
  { name: "Clean and Jerk", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "gluteal", "front-deltoids"], secondaryMuscles: ["hamstring", "trapezius", "triceps", "abs"], isStrengthStandard: false },
  { name: "Snatch", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "gluteal", "front-deltoids"], secondaryMuscles: ["hamstring", "trapezius", "upper-back"], isStrengthStandard: false },
  { name: "Thruster", category: "compound", equipment: "barbell", primaryMuscles: ["quadriceps", "front-deltoids"], secondaryMuscles: ["gluteal", "triceps", "abs"], isStrengthStandard: false },
  { name: "Turkish Get-Up", category: "compound", equipment: "dumbbell", primaryMuscles: ["abs", "front-deltoids"], secondaryMuscles: ["gluteal", "quadriceps", "obliques"], isStrengthStandard: false },
  { name: "Burpee", category: "compound", equipment: "bodyweight", primaryMuscles: ["quadriceps", "chest"], secondaryMuscles: ["front-deltoids", "triceps", "abs", "calves"], isStrengthStandard: false },
  { name: "Battle Rope", category: "compound", equipment: "other", primaryMuscles: ["front-deltoids", "abs"], secondaryMuscles: ["forearm", "biceps", "triceps"], isStrengthStandard: false },
  { name: "Sled Push", category: "compound", equipment: "other", primaryMuscles: ["quadriceps", "gluteal", "calves"], secondaryMuscles: ["hamstring", "abs"], isStrengthStandard: false },
  { name: "Sled Pull", category: "compound", equipment: "other", primaryMuscles: ["hamstring", "gluteal", "upper-back"], secondaryMuscles: ["forearm", "calves"], isStrengthStandard: false },
  { name: "Tire Flip", category: "compound", equipment: "other", primaryMuscles: ["gluteal", "hamstring", "quadriceps"], secondaryMuscles: ["upper-back", "biceps", "lower-back"], isStrengthStandard: false },
  { name: "Rope Climb", category: "compound", equipment: "other", primaryMuscles: ["upper-back", "biceps", "forearm"], secondaryMuscles: ["abs"], isStrengthStandard: false },
  { name: "Box Jump", category: "compound", equipment: "other", primaryMuscles: ["quadriceps", "gluteal", "calves"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Jump Squat", category: "compound", equipment: "bodyweight", primaryMuscles: ["quadriceps", "gluteal", "calves"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Overhead Carry", category: "compound", equipment: "dumbbell", primaryMuscles: ["abs", "front-deltoids"], secondaryMuscles: ["obliques", "trapezius"], isStrengthStandard: false },
  { name: "Bear Crawl", category: "compound", equipment: "bodyweight", primaryMuscles: ["abs", "front-deltoids"], secondaryMuscles: ["quadriceps", "triceps"], isStrengthStandard: false },

  // ════════════════════════════════════════
  // CARDIO MACHINES
  // ════════════════════════════════════════
  { name: "Treadmill Run", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "hamstring", "calves"], secondaryMuscles: ["gluteal"], isStrengthStandard: false },
  { name: "Stationary Bike", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "hamstring"], secondaryMuscles: ["calves", "gluteal"], isStrengthStandard: false },
  { name: "Rowing Machine", category: "compound", equipment: "machine", primaryMuscles: ["upper-back", "quadriceps"], secondaryMuscles: ["biceps", "hamstring", "gluteal"], isStrengthStandard: false },
  { name: "Stairmaster", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "gluteal", "calves"], secondaryMuscles: ["hamstring"], isStrengthStandard: false },
  { name: "Elliptical", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "hamstring"], secondaryMuscles: ["gluteal", "calves"], isStrengthStandard: false },
  { name: "Assault Bike", category: "compound", equipment: "machine", primaryMuscles: ["quadriceps", "hamstring"], secondaryMuscles: ["front-deltoids", "biceps", "triceps"], isStrengthStandard: false },
  { name: "Ski Erg", category: "compound", equipment: "machine", primaryMuscles: ["upper-back", "triceps"], secondaryMuscles: ["abs", "front-deltoids"], isStrengthStandard: false },
  { name: "Jump Rope", category: "compound", equipment: "other", primaryMuscles: ["calves"], secondaryMuscles: ["quadriceps", "forearm", "abs"], isStrengthStandard: false },
];
