import { KM_PER_MILE } from "./paceMath.js";

export const RACE_PRESETS = [
  { label: "5K", kilometers: 5 },
  { label: "10K", kilometers: 10 },
  { label: "Half", kilometers: 21.0975 },
  { label: "Marathon", kilometers: 42.195 },
];

// Highlight exact custom matches without snapping or changing their calculation value.
// A clicked preset retains its separate full-precision state across unit changes.
export function matchingPresetKilometers(distance, unit) {
  if (typeof distance !== "string" || !distance.trim()) return null;
  const value = Number(distance);
  if (!Number.isFinite(value) || value <= 0) return null;
  const kilometers = unit === "mi" ? value * KM_PER_MILE : value;
  return RACE_PRESETS.find((preset) => Math.abs(preset.kilometers - kilometers) < 1e-9)?.kilometers ?? null;
}
