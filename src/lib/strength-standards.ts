// ExRx-based strength standards (1RM in kg) by exercise, sex, and body weight
// Sources: ExRx.net strength standards, Symmetric Strength
export interface StandardRow {
  exerciseName: string;
  sex: "male" | "female";
  bodyWeightKg: number;
  beginner: number;
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
}

export const STRENGTH_STANDARDS: StandardRow[] = [
  // Bench Press - Male
  { exerciseName: "Bench Press", sex: "male", bodyWeightKg: 60, beginner: 35, novice: 50, intermediate: 70, advanced: 95, elite: 115 },
  { exerciseName: "Bench Press", sex: "male", bodyWeightKg: 70, beginner: 42, novice: 58, intermediate: 82, advanced: 108, elite: 130 },
  { exerciseName: "Bench Press", sex: "male", bodyWeightKg: 80, beginner: 48, novice: 66, intermediate: 92, advanced: 120, elite: 145 },
  { exerciseName: "Bench Press", sex: "male", bodyWeightKg: 90, beginner: 53, novice: 73, intermediate: 100, advanced: 130, elite: 157 },
  { exerciseName: "Bench Press", sex: "male", bodyWeightKg: 100, beginner: 57, novice: 79, intermediate: 108, advanced: 140, elite: 168 },
  { exerciseName: "Bench Press", sex: "male", bodyWeightKg: 110, beginner: 61, novice: 84, intermediate: 115, advanced: 148, elite: 177 },
  { exerciseName: "Bench Press", sex: "male", bodyWeightKg: 120, beginner: 64, novice: 88, intermediate: 120, advanced: 155, elite: 185 },
  // Bench Press - Female
  { exerciseName: "Bench Press", sex: "female", bodyWeightKg: 50, beginner: 15, novice: 24, intermediate: 37, advanced: 52, elite: 65 },
  { exerciseName: "Bench Press", sex: "female", bodyWeightKg: 60, beginner: 18, novice: 29, intermediate: 44, advanced: 61, elite: 76 },
  { exerciseName: "Bench Press", sex: "female", bodyWeightKg: 70, beginner: 21, novice: 33, intermediate: 50, advanced: 68, elite: 85 },
  { exerciseName: "Bench Press", sex: "female", bodyWeightKg: 80, beginner: 24, novice: 37, intermediate: 55, advanced: 74, elite: 92 },
  { exerciseName: "Bench Press", sex: "female", bodyWeightKg: 90, beginner: 26, novice: 40, intermediate: 59, advanced: 79, elite: 98 },

  // Squat - Male
  { exerciseName: "Squat", sex: "male", bodyWeightKg: 60, beginner: 45, novice: 65, intermediate: 92, advanced: 125, elite: 150 },
  { exerciseName: "Squat", sex: "male", bodyWeightKg: 70, beginner: 53, novice: 76, intermediate: 107, advanced: 143, elite: 172 },
  { exerciseName: "Squat", sex: "male", bodyWeightKg: 80, beginner: 60, novice: 86, intermediate: 120, advanced: 158, elite: 190 },
  { exerciseName: "Squat", sex: "male", bodyWeightKg: 90, beginner: 67, novice: 94, intermediate: 131, advanced: 172, elite: 207 },
  { exerciseName: "Squat", sex: "male", bodyWeightKg: 100, beginner: 72, novice: 101, intermediate: 141, advanced: 184, elite: 220 },
  { exerciseName: "Squat", sex: "male", bodyWeightKg: 110, beginner: 77, novice: 107, intermediate: 149, advanced: 194, elite: 232 },
  { exerciseName: "Squat", sex: "male", bodyWeightKg: 120, beginner: 81, novice: 113, intermediate: 156, advanced: 203, elite: 242 },
  // Squat - Female
  { exerciseName: "Squat", sex: "female", bodyWeightKg: 50, beginner: 22, novice: 37, intermediate: 57, advanced: 80, elite: 100 },
  { exerciseName: "Squat", sex: "female", bodyWeightKg: 60, beginner: 27, novice: 44, intermediate: 66, advanced: 92, elite: 114 },
  { exerciseName: "Squat", sex: "female", bodyWeightKg: 70, beginner: 31, novice: 50, intermediate: 74, advanced: 102, elite: 126 },
  { exerciseName: "Squat", sex: "female", bodyWeightKg: 80, beginner: 34, novice: 55, intermediate: 80, advanced: 110, elite: 136 },
  { exerciseName: "Squat", sex: "female", bodyWeightKg: 90, beginner: 37, novice: 59, intermediate: 86, advanced: 117, elite: 144 },

  // Deadlift - Male
  { exerciseName: "Deadlift", sex: "male", bodyWeightKg: 60, beginner: 55, novice: 82, intermediate: 115, advanced: 155, elite: 188 },
  { exerciseName: "Deadlift", sex: "male", bodyWeightKg: 70, beginner: 65, novice: 95, intermediate: 132, advanced: 177, elite: 213 },
  { exerciseName: "Deadlift", sex: "male", bodyWeightKg: 80, beginner: 74, novice: 106, intermediate: 148, advanced: 195, elite: 235 },
  { exerciseName: "Deadlift", sex: "male", bodyWeightKg: 90, beginner: 81, novice: 116, intermediate: 161, advanced: 212, elite: 255 },
  { exerciseName: "Deadlift", sex: "male", bodyWeightKg: 100, beginner: 88, novice: 125, intermediate: 173, advanced: 226, elite: 272 },
  { exerciseName: "Deadlift", sex: "male", bodyWeightKg: 110, beginner: 93, novice: 132, intermediate: 182, advanced: 238, elite: 286 },
  { exerciseName: "Deadlift", sex: "male", bodyWeightKg: 120, beginner: 98, novice: 139, intermediate: 191, advanced: 249, elite: 298 },
  // Deadlift - Female
  { exerciseName: "Deadlift", sex: "female", bodyWeightKg: 50, beginner: 27, novice: 45, intermediate: 68, advanced: 95, elite: 118 },
  { exerciseName: "Deadlift", sex: "female", bodyWeightKg: 60, beginner: 33, novice: 54, intermediate: 80, advanced: 110, elite: 137 },
  { exerciseName: "Deadlift", sex: "female", bodyWeightKg: 70, beginner: 38, novice: 61, intermediate: 90, advanced: 123, elite: 152 },
  { exerciseName: "Deadlift", sex: "female", bodyWeightKg: 80, beginner: 42, novice: 67, intermediate: 98, advanced: 133, elite: 164 },
  { exerciseName: "Deadlift", sex: "female", bodyWeightKg: 90, beginner: 46, novice: 72, intermediate: 105, advanced: 142, elite: 174 },

  // Overhead Press - Male
  { exerciseName: "Overhead Press", sex: "male", bodyWeightKg: 60, beginner: 22, novice: 33, intermediate: 47, advanced: 65, elite: 79 },
  { exerciseName: "Overhead Press", sex: "male", bodyWeightKg: 70, beginner: 26, novice: 39, intermediate: 55, advanced: 75, elite: 91 },
  { exerciseName: "Overhead Press", sex: "male", bodyWeightKg: 80, beginner: 30, novice: 44, intermediate: 62, advanced: 84, elite: 101 },
  { exerciseName: "Overhead Press", sex: "male", bodyWeightKg: 90, beginner: 33, novice: 48, intermediate: 68, advanced: 92, elite: 110 },
  { exerciseName: "Overhead Press", sex: "male", bodyWeightKg: 100, beginner: 36, novice: 52, intermediate: 73, advanced: 98, elite: 118 },
  { exerciseName: "Overhead Press", sex: "male", bodyWeightKg: 110, beginner: 39, novice: 55, intermediate: 77, advanced: 104, elite: 124 },
  { exerciseName: "Overhead Press", sex: "male", bodyWeightKg: 120, beginner: 41, novice: 58, intermediate: 81, advanced: 109, elite: 130 },
  // Overhead Press - Female
  { exerciseName: "Overhead Press", sex: "female", bodyWeightKg: 50, beginner: 10, novice: 16, intermediate: 25, advanced: 36, elite: 45 },
  { exerciseName: "Overhead Press", sex: "female", bodyWeightKg: 60, beginner: 12, novice: 20, intermediate: 30, advanced: 42, elite: 53 },
  { exerciseName: "Overhead Press", sex: "female", bodyWeightKg: 70, beginner: 14, novice: 23, intermediate: 34, advanced: 47, elite: 59 },
  { exerciseName: "Overhead Press", sex: "female", bodyWeightKg: 80, beginner: 16, novice: 25, intermediate: 37, advanced: 51, elite: 63 },

  // Barbell Row - Male
  { exerciseName: "Barbell Row", sex: "male", bodyWeightKg: 60, beginner: 30, novice: 45, intermediate: 65, advanced: 88, elite: 107 },
  { exerciseName: "Barbell Row", sex: "male", bodyWeightKg: 70, beginner: 36, novice: 53, intermediate: 76, advanced: 101, elite: 123 },
  { exerciseName: "Barbell Row", sex: "male", bodyWeightKg: 80, beginner: 41, novice: 60, intermediate: 85, advanced: 113, elite: 136 },
  { exerciseName: "Barbell Row", sex: "male", bodyWeightKg: 90, beginner: 45, novice: 66, intermediate: 93, advanced: 123, elite: 148 },
  { exerciseName: "Barbell Row", sex: "male", bodyWeightKg: 100, beginner: 49, novice: 71, intermediate: 99, advanced: 131, elite: 158 },
  { exerciseName: "Barbell Row", sex: "male", bodyWeightKg: 110, beginner: 52, novice: 76, intermediate: 105, advanced: 138, elite: 166 },
  { exerciseName: "Barbell Row", sex: "male", bodyWeightKg: 120, beginner: 55, novice: 79, intermediate: 110, advanced: 144, elite: 173 },
  // Barbell Row - Female
  { exerciseName: "Barbell Row", sex: "female", bodyWeightKg: 50, beginner: 14, novice: 23, intermediate: 35, advanced: 50, elite: 62 },
  { exerciseName: "Barbell Row", sex: "female", bodyWeightKg: 60, beginner: 17, novice: 28, intermediate: 42, advanced: 58, elite: 73 },
  { exerciseName: "Barbell Row", sex: "female", bodyWeightKg: 70, beginner: 20, novice: 32, intermediate: 48, advanced: 66, elite: 82 },
  { exerciseName: "Barbell Row", sex: "female", bodyWeightKg: 80, beginner: 22, novice: 35, intermediate: 53, advanced: 72, elite: 89 },

  // Barbell Curl - Male
  { exerciseName: "Barbell Curl", sex: "male", bodyWeightKg: 60, beginner: 16, novice: 25, intermediate: 37, advanced: 52, elite: 64 },
  { exerciseName: "Barbell Curl", sex: "male", bodyWeightKg: 70, beginner: 19, novice: 30, intermediate: 44, advanced: 60, elite: 74 },
  { exerciseName: "Barbell Curl", sex: "male", bodyWeightKg: 80, beginner: 22, novice: 34, intermediate: 49, advanced: 68, elite: 83 },
  { exerciseName: "Barbell Curl", sex: "male", bodyWeightKg: 90, beginner: 24, novice: 37, intermediate: 54, advanced: 74, elite: 90 },
  { exerciseName: "Barbell Curl", sex: "male", bodyWeightKg: 100, beginner: 26, novice: 40, intermediate: 58, advanced: 79, elite: 97 },
  // Barbell Curl - Female
  { exerciseName: "Barbell Curl", sex: "female", bodyWeightKg: 50, beginner: 7, novice: 12, intermediate: 20, advanced: 29, elite: 37 },
  { exerciseName: "Barbell Curl", sex: "female", bodyWeightKg: 60, beginner: 9, novice: 15, intermediate: 24, advanced: 34, elite: 43 },
  { exerciseName: "Barbell Curl", sex: "female", bodyWeightKg: 70, beginner: 11, novice: 17, intermediate: 27, advanced: 39, elite: 48 },
  { exerciseName: "Barbell Curl", sex: "female", bodyWeightKg: 80, beginner: 12, novice: 19, intermediate: 30, advanced: 42, elite: 52 },

  // Pull-Up - Male (standards in terms of weighted pull-up 1RM = bodyweight + added weight)
  { exerciseName: "Pull-Up", sex: "male", bodyWeightKg: 60, beginner: 0, novice: 8, intermediate: 25, advanced: 45, elite: 60 },
  { exerciseName: "Pull-Up", sex: "male", bodyWeightKg: 70, beginner: 0, novice: 5, intermediate: 22, advanced: 42, elite: 58 },
  { exerciseName: "Pull-Up", sex: "male", bodyWeightKg: 80, beginner: 0, novice: 3, intermediate: 20, advanced: 40, elite: 55 },
  { exerciseName: "Pull-Up", sex: "male", bodyWeightKg: 90, beginner: 0, novice: 0, intermediate: 18, advanced: 37, elite: 52 },
  { exerciseName: "Pull-Up", sex: "male", bodyWeightKg: 100, beginner: 0, novice: 0, intermediate: 15, advanced: 35, elite: 50 },
  // Pull-Up - Female
  { exerciseName: "Pull-Up", sex: "female", bodyWeightKg: 50, beginner: 0, novice: 0, intermediate: 5, advanced: 18, elite: 30 },
  { exerciseName: "Pull-Up", sex: "female", bodyWeightKg: 60, beginner: 0, novice: 0, intermediate: 3, advanced: 15, elite: 27 },
  { exerciseName: "Pull-Up", sex: "female", bodyWeightKg: 70, beginner: 0, novice: 0, intermediate: 0, advanced: 12, elite: 24 },
  { exerciseName: "Pull-Up", sex: "female", bodyWeightKg: 80, beginner: 0, novice: 0, intermediate: 0, advanced: 10, elite: 20 },
];
