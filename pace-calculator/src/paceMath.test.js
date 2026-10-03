import test from "node:test";
import assert from "node:assert/strict";
import { calculatePace, formatSeconds, generateSplits, parseTimeInput } from "./paceMath.js";

test("parses common pace and finish-time formats", () => {
  assert.equal(parseTimeInput("8"), 480);
  assert.equal(parseTimeInput("8.30"), 510);
  assert.equal(parseTimeInput("1:35:00"), 5700);
  assert.equal(parseTimeInput(":45"), 45);
  assert.equal(parseTimeInput("8:75"), null);
});

test("formats rounded times without producing a 60-second field", () => {
  assert.equal(formatSeconds(479.6), "8:00");
  assert.equal(formatSeconds(5700), "1:35:00");
});

test("solves for time, pace, and distance", () => {
  assert.deepEqual(calculatePace({ solveFor: "time", distance: 10, paceSeconds: 480, timeSeconds: null }), {
    distance: 10,
    paceSeconds: 480,
    timeSeconds: 4800,
  });
  assert.equal(calculatePace({ solveFor: "pace", distance: 10, timeSeconds: 4800, paceSeconds: null }).paceSeconds, 480);
  assert.equal(calculatePace({ solveFor: "distance", distance: null, timeSeconds: 4800, paceSeconds: 480 }).distance, 10);
});

test("includes the final partial-distance split", () => {
  assert.deepEqual(generateSplits(3.1, 480), [
    { marker: 1, segmentDistance: 1, splitSeconds: 480, elapsedSeconds: 480 },
    { marker: 2, segmentDistance: 1, splitSeconds: 480, elapsedSeconds: 960 },
    { marker: 3, segmentDistance: 1, splitSeconds: 480, elapsedSeconds: 1440 },
    { marker: 3.1, segmentDistance: 0.10000000000000009, splitSeconds: 48.00000000000004, elapsedSeconds: 1488 },
  ]);
});

test("explicit minutes and seconds distinguish 8:05, 8:09, and 8:50", () => {
  assert.equal(parseTimeInput("8:5"), 485);
  assert.equal(parseTimeInput("8:9"), 489);
  assert.equal(parseTimeInput("8:50"), 530);
  assert.equal(parseTimeInput("0:8:50"), 530);
  assert.equal(parseTimeInput("1:00:00"), 3600);
  assert.equal(parseTimeInput("8:60"), null);
  assert.equal(parseTimeInput("0:60:00"), null);
  assert.equal(calculatePace({ solveFor: "time", distance: 10, paceSeconds: parseTimeInput("8:50") }).timeSeconds, 5300);
});
