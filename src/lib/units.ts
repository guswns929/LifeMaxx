export type UnitSystem = "metric" | "imperial";

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.20462) * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function formatWeight(kg: number, units: UnitSystem): string {
  if (units === "imperial") {
    return `${kgToLb(kg)} lb`;
  }
  return `${Math.round(kg * 10) / 10} kg`;
}

export function formatHeight(cm: number, units: UnitSystem): string {
  if (units === "imperial") {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export function parseWeightInput(value: number, units: UnitSystem): number {
  return units === "imperial" ? lbToKg(value) : value;
}

export function displayWeight(kg: number, units: UnitSystem): number {
  return units === "imperial" ? kgToLb(kg) : Math.round(kg * 10) / 10;
}

export function weightLabel(units: UnitSystem): string {
  return units === "imperial" ? "lb" : "kg";
}
