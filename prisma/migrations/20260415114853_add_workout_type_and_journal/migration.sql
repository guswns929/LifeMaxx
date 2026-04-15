-- CreateTable
CREATE TABLE "RankEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "benchPressKg" REAL,
    "squatKg" REAL,
    "deadliftKg" REAL,
    "totalKg" REAL,
    "wilksScore" REAL,
    "rank" TEXT,
    "rankScore" REAL,
    "bodyWeightKg" REAL,
    "notes" TEXT,
    CONSTRAINT "RankEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "nutritionScore" INTEGER,
    "trainingScore" INTEGER,
    "recoveryScore" INTEGER,
    "trendScore" INTEGER,
    "analysisJson" TEXT NOT NULL,
    "recommendations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "equipment" TEXT,
    "primaryMuscles" TEXT NOT NULL,
    "secondaryMuscles" TEXT,
    "isStrengthStandard" BOOLEAN NOT NULL DEFAULT false,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "linkedExerciseId" TEXT,
    CONSTRAINT "Exercise_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exercise_linkedExerciseId_fkey" FOREIGN KEY ("linkedExerciseId") REFERENCES "Exercise" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("category", "equipment", "id", "isStrengthStandard", "name", "primaryMuscles", "secondaryMuscles") SELECT "category", "equipment", "id", "isStrengthStandard", "name", "primaryMuscles", "secondaryMuscles" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");
CREATE TABLE "new_Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "notes" TEXT,
    "durationMin" INTEGER,
    "workoutType" TEXT NOT NULL DEFAULT 'strength',
    "whoopActivityId" TEXT,
    "strainScore" REAL,
    "avgHeartRate" REAL,
    "maxHeartRate" REAL,
    "calories" REAL,
    "activityType" TEXT,
    "isDetailed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Workout" ("activityType", "avgHeartRate", "calories", "createdAt", "date", "durationMin", "id", "isDetailed", "maxHeartRate", "name", "notes", "strainScore", "userId", "whoopActivityId") SELECT "activityType", "avgHeartRate", "calories", "createdAt", "date", "durationMin", "id", "isDetailed", "maxHeartRate", "name", "notes", "strainScore", "userId", "whoopActivityId" FROM "Workout";
DROP TABLE "Workout";
ALTER TABLE "new_Workout" RENAME TO "Workout";
CREATE UNIQUE INDEX "Workout_whoopActivityId_key" ON "Workout"("whoopActivityId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_userId_date_key" ON "JournalEntry"("userId", "date");
