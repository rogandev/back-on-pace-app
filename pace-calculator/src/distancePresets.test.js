import test from "node:test";
import assert from "node:assert/strict";
import { RACE_PRESETS, matchingPresetKilometers } from "./distancePresets.js";
import { KM_PER_MILE } from "./paceMath.js";

test("custom distances match all exact race lengths in either unit", () => {
  for (const { kilometers } of RACE_PRESETS) {
    assert.equal(matchingPresetKilometers(String(kilometers), "km"), kilometers);
    assert.equal(matchingPresetKilometers(String(kilometers / KM_PER_MILE), "mi"), kilometers);
  }
});

test("custom edits clear selection for empty, invalid, or nonmatching distances", () => {
  for (const value of ["", " ", "0", "-5", "NaN", "Infinity", "6", "5.001"]) {
    assert.equal(matchingPresetKilometers(value, "km"), null);
  }
  assert.equal(matchingPresetKilometers("5", "mi"), null);
  assert.equal(matchingPresetKilometers("10", "mi"), null);
});

test("rounded race labels do not snap a custom distance to a different exact distance", () => {
  assert.equal(matchingPresetKilometers("3.11", "mi"), null);
  assert.equal(matchingPresetKilometers("21.1", "km"), null);
  assert.equal(matchingPresetKilometers("5.00", "km"), 5);
});
