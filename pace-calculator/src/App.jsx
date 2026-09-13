import { useMemo, useState } from "react";
import "./App.css";
import { calculatePace, formatSeconds, generateSplits, KM_PER_MILE, parseTimeInput } from "./paceMath";

const RECOVERY_DEFAULTS = { distanceDone: "0.25", totalDistance: "1", currentPace: "10:15", goalPace: "9:00" };
const RACE_PRESETS = [
  { label: "5K", kilometers: 5 },
  { label: "10K", kilometers: 10 },
  { label: "Half", kilometers: 21.0975 },
  { label: "Marathon", kilometers: 42.195 },
];
const SOLVE_OPTIONS = [
  { value: "time", label: "Finish time" },
  { value: "pace", label: "Pace" },
  { value: "distance", label: "Distance" },
];

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}{hint && <span className="field-hint">{hint}</span>}</span>
      {children}
    </label>
  );
}

function TimeHint() {
  return <p className="format-hint">8 → 8:00 &nbsp;·&nbsp; 8.30 → 8:30 &nbsp;·&nbsp; 1:35:00 → 1 hr 35 min</p>;
}

function Summary({ label, value }) {
  return <div className="summary-item"><span>{label}</span><strong>{value}</strong></div>;
}

function EmptyResult({ text }) {
  return <div className="empty-result"><span aria-hidden="true">⏱</span><p>{text}</p></div>;
}

function RecoveryCalculator() {
  const [values, setValues] = useState(RECOVERY_DEFAULTS);
  const [calculated, setCalculated] = useState(false);

  const update = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setCalculated(false);
  };

  const distanceDone = Number(values.distanceDone);
  const totalDistance = Number(values.totalDistance);
  const currentPace = parseTimeInput(values.currentPace);
  const goalPace = parseTimeInput(values.goalPace);
  let result = null;
  let error = null;

  if (calculated) {
    const remaining = totalDistance - distanceDone;
    if (!Number.isFinite(distanceDone) || !Number.isFinite(totalDistance)) {
      error = "Check your distance values.";
    } else if (distanceDone < 0 || remaining <= 0) {
      error = "Miles run must be less than total distance.";
    } else if (currentPace === null || goalPace === null || currentPace <= 0 || goalPace <= 0) {
      error = "Check your pace format.";
    } else {
      const timeSpentSeconds = distanceDone * currentPace;
      const totalAllowedSeconds = totalDistance * goalPace;
      const timeRemainingSeconds = totalAllowedSeconds - timeSpentSeconds;
      if (timeRemainingSeconds <= 0) {
        error = "Not possible — you’ve already exceeded your goal time.";
      } else {
        const neededPace = timeRemainingSeconds / remaining;
        result = { neededPace, remaining, timeSpentSeconds, totalAllowedSeconds, fasterThanGoal: neededPace < goalPace };
      }
    }
  }

  return (
    <section className="calculator-card" aria-labelledby="page-title">
      <div className="two-column-fields">
        <Field label="Miles run so far"><input className="number-input" type="number" inputMode="decimal" min="0" step="0.01" value={values.distanceDone} onChange={(event) => update("distanceDone", event.target.value)} /></Field>
        <Field label="Total race miles"><input className="number-input" type="number" inputMode="decimal" min="0" step="0.01" value={values.totalDistance} onChange={(event) => update("totalDistance", event.target.value)} /></Field>
        <Field label="Current avg pace"><input className="time-input" type="text" inputMode="decimal" value={values.currentPace} onChange={(event) => update("currentPace", event.target.value)} /></Field>
        <Field label="Goal pace"><input className="time-input" type="text" inputMode="decimal" value={values.goalPace} onChange={(event) => update("goalPace", event.target.value)} /></Field>
      </div>
      <TimeHint />
      <button className="primary-button" onClick={() => setCalculated(true)}>Find my catch-up pace</button>

      <div className={`result-panel ${error ? "result-panel-error" : ""}`} aria-live="polite">
        {!calculated && <EmptyResult text="Your needed pace will appear here" />}
        {calculated && error && <p className="error-message">{error}</p>}
        {result && (
          <div className="result-content">
            <p className="eyebrow">Run your next {result.remaining.toFixed(2)} mi at</p>
            <p className={`hero-result ${result.fasterThanGoal ? "hero-result-green" : ""}`}>{formatSeconds(result.neededPace)}</p>
            <p className="result-unit">per mile</p>
            <div className="summary-grid">
              <Summary label="Time banked" value={formatSeconds(result.timeSpentSeconds)} />
              <Summary label="Total allowed" value={formatSeconds(result.totalAllowedSeconds)} />
            </div>
            {result.fasterThanGoal && <p className="recovery-note">↑ Faster than goal — ease into it gradually</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function PaceCalculator() {
  const [solveFor, setSolveFor] = useState("time");
  const [unit, setUnit] = useState("mi");
  const [distance, setDistance] = useState("10");
  const [time, setTime] = useState("");
  const [pace, setPace] = useState("8:00");
  const [result, setResult] = useState(null);
  const [presetKilometers, setPresetKilometers] = useState(null);
  const unitName = unit === "mi" ? "mile" : "kilometer";
  const unitAbbreviation = unit === "mi" ? "mi" : "km";
  const resultLabel = SOLVE_OPTIONS.find((option) => option.value === solveFor)?.label;
  const splits = useMemo(() => result && !result.error ? generateSplits(result.distance, result.paceSeconds) : [], [result]);

  const update = (setter) => (event) => {
    setter(event.target.value);
    setResult(null);
  };

  const changeSolveFor = (next) => {
    setSolveFor(next);
    if (next === "distance") setPresetKilometers(null);
    setResult(null);
  };

  const changeUnit = (nextUnit) => {
    if (nextUnit === unit) return;
    const toKilometers = nextUnit === "km";
    const distanceValue = presetKilometers === null
      ? Number(distance)
      : (toKilometers ? presetKilometers : presetKilometers / KM_PER_MILE);
    const paceValue = parseTimeInput(pace);
    if (Number.isFinite(distanceValue) && distanceValue > 0) {
      const convertedDistance = presetKilometers === null
        ? (toKilometers ? distanceValue * KM_PER_MILE : distanceValue / KM_PER_MILE)
        : distanceValue;
      setDistance(convertedDistance.toFixed(2).replace(/\.00$/, ""));
    }
    if (paceValue !== null && paceValue > 0) {
      setPace(formatSeconds(toKilometers ? paceValue / KM_PER_MILE : paceValue * KM_PER_MILE));
    }
    setUnit(nextUnit);
    setResult(null);
  };

  const applyPreset = (kilometers) => {
    const converted = unit === "km" ? kilometers : kilometers / KM_PER_MILE;
    setDistance(converted.toFixed(converted < 10 ? 2 : 1).replace(/\.0+$/, ""));
    setPresetKilometers(kilometers);
    setResult(null);
  };

  const updateDistance = (event) => {
    setDistance(event.target.value);
    setPresetKilometers(null);
    setResult(null);
  };

  const calculate = () => {
    setResult(calculatePace({
      solveFor,
      distance: presetKilometers === null
        ? Number(distance)
        : (unit === "km" ? presetKilometers : presetKilometers / KM_PER_MILE),
      timeSeconds: parseTimeInput(time),
      paceSeconds: parseTimeInput(pace),
    }));
  };

  const reset = () => {
    setSolveFor("time");
    setUnit("mi");
    setDistance("10");
    setTime("");
    setPace("8:00");
    setPresetKilometers(null);
    setResult(null);
  };

  return (
    <section className="calculator-card pace-card" aria-labelledby="page-title">
      <div className="section-heading">
        <p className="eyebrow">Choose what you want to find</p>
        <div className="segmented-control" role="group" aria-label="Solve for">
          {SOLVE_OPTIONS.map((option) => <button key={option.value} className={solveFor === option.value ? "active" : ""} onClick={() => changeSolveFor(option.value)}>{option.label}</button>)}
        </div>
      </div>

      <div className="unit-row">
        <span className="field-label">Units</span>
        <div className="unit-toggle" role="group" aria-label="Distance unit">
          <button className={unit === "mi" ? "active" : ""} onClick={() => changeUnit("mi")}>Miles</button>
          <button className={unit === "km" ? "active" : ""} onClick={() => changeUnit("km")}>Kilometers</button>
        </div>
      </div>

      <div className="preset-row" aria-label="Race distance presets">
        {RACE_PRESETS.map((preset) => <button key={preset.label} disabled={solveFor === "distance"} onClick={() => applyPreset(preset.kilometers)}>{preset.label}</button>)}
      </div>

      <div className="calculator-fields">
        <Field label="Distance" hint={unitAbbreviation}><input className="number-input" type="number" inputMode="decimal" min="0" step="0.01" value={solveFor === "distance" ? "" : distance} disabled={solveFor === "distance"} placeholder={solveFor === "distance" ? "Calculated" : "10"} onChange={updateDistance} /></Field>
        <Field label="Finish time" hint="h:mm:ss"><input className="time-input" type="text" inputMode="decimal" value={solveFor === "time" ? "" : time} disabled={solveFor === "time"} placeholder={solveFor === "time" ? "Calculated" : "1:20:00"} onChange={update(setTime)} /></Field>
        <Field label="Pace" hint={`per ${unitName}`}><input className="time-input" type="text" inputMode="decimal" value={solveFor === "pace" ? "" : pace} disabled={solveFor === "pace"} placeholder={solveFor === "pace" ? "Calculated" : "8:00"} onChange={update(setPace)} /></Field>
      </div>
      <TimeHint />

      <div className="button-row">
        <button className="primary-button" onClick={calculate}>Calculate {resultLabel}</button>
        <button className="secondary-button" onClick={reset}>Reset</button>
      </div>

      <div className={`result-panel pace-result-panel ${result?.error ? "result-panel-error" : ""}`} aria-live="polite">
        {!result && <EmptyResult text="Your result and splits will appear here" />}
        {result?.error && <p className="error-message">{result.error}</p>}
        {result && !result.error && (
          <div className="result-content">
            <p className="eyebrow">{resultLabel}</p>
            <p className="hero-result">{solveFor === "distance" ? result.distance.toFixed(2).replace(/\.00$/, "") : formatSeconds(solveFor === "time" ? result.timeSeconds : result.paceSeconds)}</p>
            <p className="result-unit">{solveFor === "distance" ? unitAbbreviation : solveFor === "pace" ? `per ${unitName}` : `${result.distance.toFixed(2).replace(/\.00$/, "")} ${unitAbbreviation}`}</p>
            <div className="summary-grid three-columns">
              <Summary label="Distance" value={`${result.distance.toFixed(2).replace(/\.00$/, "")} ${unitAbbreviation}`} />
              <Summary label="Finish" value={formatSeconds(result.timeSeconds)} />
              <Summary label="Pace" value={`${formatSeconds(result.paceSeconds)}/${unitAbbreviation}`} />
            </div>
          </div>
        )}
      </div>

      {splits.length > 0 && (
        <div className="splits-section">
          <div className="splits-heading"><div><p className="eyebrow">Even splits</p><h2>Every {unitName}</h2></div><span>{splits.length} splits</span></div>
          <div className="splits-table-wrap">
            <table className="splits-table">
              <thead><tr><th>{unitAbbreviation}</th><th>Split</th><th>Elapsed</th></tr></thead>
              <tbody>{splits.map((split) => <tr key={split.marker}><td>{split.marker.toFixed(split.segmentDistance < 1 ? 2 : 0)}</td><td>{formatSeconds(split.splitSeconds)}</td><td>{formatSeconds(split.elapsedSeconds)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("recovery");
  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="brand-kicker">◈ Race pace tools</p>
        <h1 id="page-title">{activeTab === "recovery" ? <>GET BACK<br /><span>ON PACE</span></> : <>PACE<br /><span>CALCULATOR</span></>}</h1>
        <p>{activeTab === "recovery" ? "Slowed down? Find your catch-up pace." : "Plan your pace, finish time, and splits."}</p>
      </header>
      <nav className="tool-tabs" aria-label="Pace tools">
        <button className={activeTab === "recovery" ? "active" : ""} onClick={() => setActiveTab("recovery")}>Back on Pace</button>
        <button className={activeTab === "calculator" ? "active" : ""} onClick={() => setActiveTab("calculator")}>Pace Calculator</button>
      </nav>
      {activeTab === "recovery" ? <RecoveryCalculator /> : <PaceCalculator />}
      <footer>No math. Just run.</footer>
    </main>
  );
}
