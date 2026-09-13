export const KM_PER_MILE = 1.609344;

export function parseTimeInput(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const parts = value.trim().replace(/\./g, ":").split(":");
  if (parts.length > 3 || parts.some((part) => part !== "" && !/^\d+$/.test(part))) return null;

  if (parts.length === 1) {
    const minutes = Number(parts[0]);
    return Number.isFinite(minutes) && minutes >= 0 ? minutes * 60 : null;
  }

  if (parts.length === 2) {
    const minutes = parts[0] === "" ? 0 : Number(parts[0]);
    const seconds = parts[1] === "" ? 0 : Number(parts[1]);
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  }

  const hours = parts[0] === "" ? 0 : Number(parts[0]);
  const minutes = parts[1] === "" ? 0 : Number(parts[1]);
  const seconds = parts[2] === "" ? 0 : Number(parts[2]);
  if (minutes >= 60 || seconds >= 60) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatSeconds(value) {
  if (!Number.isFinite(value) || value < 0) return "--:--";
  const totalSeconds = Math.round(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function calculatePace({ solveFor, distance, timeSeconds, paceSeconds }) {
  if (solveFor !== "distance" && (!Number.isFinite(distance) || distance <= 0)) {
    return { error: "Enter a distance greater than zero." };
  }

  if (solveFor === "time") {
    if (!Number.isFinite(paceSeconds) || paceSeconds <= 0) return { error: "Enter a valid pace." };
    return { distance, paceSeconds, timeSeconds: distance * paceSeconds };
  }

  if (solveFor === "pace") {
    if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) return { error: "Enter a valid finish time." };
    return { distance, timeSeconds, paceSeconds: timeSeconds / distance };
  }

  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) return { error: "Enter a valid finish time." };
  if (!Number.isFinite(paceSeconds) || paceSeconds <= 0) return { error: "Enter a valid pace." };
  return { distance: timeSeconds / paceSeconds, timeSeconds, paceSeconds };
}

export function generateSplits(distance, paceSeconds) {
  if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(paceSeconds) || paceSeconds <= 0) return [];

  const rows = [];
  const fullSplits = Math.floor(distance + 1e-9);
  for (let marker = 1; marker <= fullSplits; marker += 1) {
    rows.push({ marker, segmentDistance: 1, splitSeconds: paceSeconds, elapsedSeconds: marker * paceSeconds });
  }

  const partialDistance = distance - fullSplits;
  if (partialDistance > 1e-9) {
    rows.push({
      marker: distance,
      segmentDistance: partialDistance,
      splitSeconds: partialDistance * paceSeconds,
      elapsedSeconds: distance * paceSeconds,
    });
  }
  return rows;
}
