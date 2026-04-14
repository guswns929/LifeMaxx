import { PrismaClient } from "@prisma/client";
import { EXERCISES } from "../src/lib/exercises";
import { STRENGTH_STANDARDS } from "../src/lib/strength-standards";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding exercises...");

  for (const ex of EXERCISES) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: {
        name: ex.name,
        category: ex.category,
        equipment: ex.equipment,
        primaryMuscles: ex.primaryMuscles.join(","),
        secondaryMuscles: ex.secondaryMuscles.join(","),
        isStrengthStandard: ex.isStrengthStandard,
      },
    });
  }

  console.log(`Seeded ${EXERCISES.length} exercises`);

  console.log("Seeding strength standards...");

  for (const std of STRENGTH_STANDARDS) {
    const exercise = await prisma.exercise.findUnique({
      where: { name: std.exerciseName },
    });
    if (!exercise) continue;

    await prisma.strengthStandard.upsert({
      where: {
        exerciseId_sex_bodyWeightKg: {
          exerciseId: exercise.id,
          sex: std.sex,
          bodyWeightKg: std.bodyWeightKg,
        },
      },
      update: {
        beginner: std.beginner,
        novice: std.novice,
        intermediate: std.intermediate,
        advanced: std.advanced,
        elite: std.elite,
      },
      create: {
        exerciseId: exercise.id,
        sex: std.sex,
        bodyWeightKg: std.bodyWeightKg,
        beginner: std.beginner,
        novice: std.novice,
        intermediate: std.intermediate,
        advanced: std.advanced,
        elite: std.elite,
      },
    });
  }

  console.log(`Seeded ${STRENGTH_STANDARDS.length} strength standards`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
