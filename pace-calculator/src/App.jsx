import { useState, useRef } from "react";

// Parse flexible time input into total seconds.
// Separators: colon (:) or dot (.)
// Rules:
//   "10"        → 10 min → 600s
//   "10.15"     → 10 min 15 sec → 615s
//   "10.15.03"  → 10 hr 15 min 3 sec → 36903s  (three parts = h.m.s)
//   ".10"       → 0 min 10 sec → 10s
//   "10:15"     → 10 min 15 sec → 615s
//   "1:10:15"   → 1 hr 10 min 15 sec → 4215s
//   "100"       → 100 min → 6000s
function parseTimeInput(str) {
  if (!str || !str.trim()) return null;
  const s = str.trim();

  // Normalize dots to colons
  const normalized = s.replace(/\./g, ":");
  const parts = normalized.split(":");

  if (parts.length === 1) {
    // Plain number → minutes
    const mins = parseFloat(parts[0]);
    if (isNaN(mins) || mins < 0) return null;
    return Math.round(mins * 60);
  } else if (parts.length === 2) {
    // mm:ss or :ss
    const mins = parts[0] === "" ? 0 : parseInt(parts[0], 10);
    const secs = parts[1] === "" ? 0 : parseInt(parts[1], 10);
    if (isNaN(mins) || isNaN(secs) || secs >= 60) return null;
    return mins * 60 + secs;
  } else if (parts.length === 3) {
    // hh:mm:ss
    const hrs = parts[0] === "" ? 0 : parseInt(parts[0], 10);
    const mins = parts[1] === "" ? 0 : parseInt(parts[1], 10);
    const secs = parts[2] === "" ? 0 : parseInt(parts[2], 10);
    if (isNaN(hrs) || isNaN(mins) || isNaN(secs) || mins >= 60 || secs >= 60) return null;
    return hrs * 3600 + mins * 60 + secs;
  }
  return null;
}

function formatSeconds(totalSecs) {
  if (totalSecs === null || totalSecs < 0) return "--:--";
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = Math.round(totalSecs % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function canonicalizeTime(str) {
  const secs = parseTimeInput(str);
  if (secs === null) return str;
  return formatSeconds(secs);
}

// Default values (real, not placeholders)
const DEFAULTS = {
  distanceDone: "0.25",
  totalDistance: "1",
  currentPace: "10:15",
  goalPace: "9:00",
};

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "14px 16px",
  color: "#e8f0fe",
  fontSize: 22,
  fontFamily: "'Space Mono', monospace",
  fontWeight: 700,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.2s",
};

function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a9bb0" }}>
        {label}
        {hint && <span style={{ color: "#3a5a7a", marginLeft: 6, fontSize: 9, letterSpacing: "0.05em" }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function App() {
  const [distanceDone, setDistanceDone] = useState(DEFAULTS.distanceDone);
  const [totalDistance, setTotalDistance] = useState(DEFAULTS.totalDistance);
  const [currentPace, setCurrentPace] = useState(DEFAULTS.currentPace);
  const [goalPace, setGoalPace] = useState(DEFAULTS.goalPace);
  const [calculated, setCalculated] = useState(false);

  const refs = {
    dist: useRef(null),
    total: useRef(null),
    current: useRef(null),
    goal: useRef(null),
  };

  // Effective values: fall back to defaults if field is empty
  const effectiveDone = parseFloat(distanceDone || DEFAULTS.distanceDone);
  const effectiveTotal = parseFloat(totalDistance || DEFAULTS.totalDistance);
  const effectiveCurrent = parseTimeInput(currentPace || DEFAULTS.currentPace);
  const effectiveGoal = parseTimeInput(goalPace || DEFAULTS.goalPace);

  let result = null;
  let error = null;

  if (calculated) {
    const remaining = effectiveTotal - effectiveDone;
    if (isNaN(effectiveDone) || isNaN(effectiveTotal)) {
      error = "Check your distance values.";
    } else if (remaining <= 0) {
      error = "Miles run must be less than total distance.";
    } else if (effectiveCurrent === null || effectiveGoal === null) {
      error = "Check your pace format.";
    } else {
      const timeSpentSecs = effectiveDone * effectiveCurrent;
      const totalAllowedSecs = effectiveTotal * effectiveGoal;
      const timeRemainingNeeded = totalAllowedSecs - timeSpentSecs;
      if (timeRemainingNeeded <= 0) {
        error = "Not possible — you've already exceeded your goal time.";
      } else {
        const neededPaceSecs = timeRemainingNeeded / remaining;
        result = {
          neededPace: neededPaceSecs,
          remaining: remaining.toFixed(2),
          timeSpent: formatSeconds(timeSpentSecs),
          totalAllowed: formatSeconds(totalAllowedSecs),
          fasterThanGoal: neededPaceSecs < effectiveGoal,
        };
      }
    }
  }

  function resetCalc() { setCalculated(false); }

  function handleTimeBlur(value, setter, defaultVal) {
    const val = value.trim() === "" ? defaultVal : value;
    const canonical = canonicalizeTime(val);
    setter(canonical);
  }

  function handleDistBlur(value, setter, defaultVal) {
    if (value.trim() === "") setter(defaultVal);
  }

  function handleKeyDown(e, nextRef) {
    if (e.key === "Tab" && !e.shiftKey && nextRef) {
      e.preventDefault();
      nextRef.current && nextRef.current.focus();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      setCalculated(true);
    }
  }

  const resultBorderColor = result
    ? (result.fasterThanGoal ? "rgba(105,240,174,0.3)" : "rgba(79,195,247,0.3)")
    : error ? "rgba(255,100,100,0.3)"
    : "rgba(255,255,255,0.07)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@300;500;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0f1e; min-height: 100vh; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .calc-btn:active { transform: scale(0.97); }
      `}</style>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2e 50%, #091628 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#4fc3f7", fontFamily: "'Space Mono', monospace", marginBottom: 10, textTransform: "uppercase" }}>
            ◈ Race Pace Recovery
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: "#e8f0fe", lineHeight: 1 }}>
            GET BACK<br /><span style={{ color: "#4fc3f7" }}>ON PACE</span>
          </h1>
          <p style={{ marginTop: 10, fontSize: 15, color: "#5a7a9a", fontFamily: "'Space Mono', monospace", letterSpacing: "0.02em" }}>
            slowed down? find your catch-up pace.
          </p>
        </div>

        {/* Card */}
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "24px 20px",
          backdropFilter: "blur(10px)",
        }}>

          {/* Distance row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Miles run so far">
              <input
                ref={refs.dist}
                type="number"
                step="0.01"
                min="0"
                value={distanceDone}
                onChange={e => { setDistanceDone(e.target.value); resetCalc(); }}
                onKeyDown={e => handleKeyDown(e, refs.total)}
                onFocus={e => { e.target.style.borderColor = "#4fc3f7"; e.target.select(); }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; handleDistBlur(distanceDone, setDistanceDone, DEFAULTS.distanceDone); }}
                style={inputStyle}
              />
            </Field>
            <Field label="Total race miles">
              <input
                ref={refs.total}
                type="number"
                step="0.01"
                min="0"
                value={totalDistance}
                onChange={e => { setTotalDistance(e.target.value); resetCalc(); }}
                onKeyDown={e => handleKeyDown(e, refs.current)}
                onFocus={e => { e.target.style.borderColor = "#4fc3f7"; e.target.select(); }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; handleDistBlur(totalDistance, setTotalDistance, DEFAULTS.totalDistance); }}
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Pace row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
            <Field label="Current avg pace">
              <input
                ref={refs.current}
                type="text"
                inputMode="decimal"
                value={currentPace}
                onChange={e => { setCurrentPace(e.target.value); resetCalc(); }}
                onKeyDown={e => handleKeyDown(e, refs.goal)}
                onFocus={e => { e.target.style.borderColor = "#4fc3f7"; e.target.select(); }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; handleTimeBlur(currentPace, setCurrentPace, DEFAULTS.currentPace); }}
                style={inputStyle}
              />
            </Field>
            <Field label="Goal pace">
              <input
                ref={refs.goal}
                type="text"
                inputMode="decimal"
                value={goalPace}
                onChange={e => { setGoalPace(e.target.value); resetCalc(); }}
                onKeyDown={e => handleKeyDown(e, null)}
                onFocus={e => { e.target.style.borderColor = "#4fc3f7"; e.target.select(); }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; handleTimeBlur(goalPace, setGoalPace, DEFAULTS.goalPace); }}
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Format hint */}
          <div style={{ fontSize: 10, color: "#3a5a7a", fontFamily: "'Space Mono', monospace", marginBottom: 18, paddingLeft: 2, lineHeight: 1.7 }}>
            10 → 10:00 &nbsp;·&nbsp; 10.15 → 10:15 &nbsp;·&nbsp; 10.15.03 → 10:15:03 &nbsp;·&nbsp; .10 → 0:10
          </div>

          {/* Calculate button */}
          <button
            className="calc-btn"
            onClick={() => setCalculated(true)}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%)",
              color: "#fff",
              fontSize: 17,
              fontWeight: 700,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
              marginBottom: 18,
              boxShadow: "0 4px 20px rgba(79,195,247,0.25)",
            }}
          >
            Calculate
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 18 }} />

          {/* Result box */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${resultBorderColor}`,
            borderRadius: 14,
            padding: "20px 16px",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.4s",
          }}>
            {!calculated && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 30, marginBottom: 8, opacity: 0.2 }}>⏱</div>
                <div style={{ color: "#3a5a7a", fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  your needed pace will appear here
                </div>
              </div>
            )}

            {calculated && error && (
              <div style={{ color: "#ff8a80", fontFamily: "'Space Mono', monospace", fontSize: 13, textAlign: "center", animation: "fadeUp 0.3s ease", lineHeight: 1.6 }}>
                {error}
              </div>
            )}

            {calculated && result && (
              <div style={{ width: "100%", animation: "fadeUp 0.35s ease" }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#8a9bb0", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", marginBottom: 8 }}>
                    Run your next {result.remaining} mi at
                  </div>
                  <div style={{
                    fontSize: 68,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: result.fasterThanGoal ? "#69f0ae" : "#4fc3f7",
                    lineHeight: 1,
                  }}>
                    {formatSeconds(result.neededPace)}
                  </div>
                  <div style={{ fontSize: 13, color: "#5a7a9a", fontFamily: "'Space Mono', monospace", marginTop: 5 }}>
                    per mile
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Time banked", val: result.timeSpent },
                    { label: "Total allowed", val: result.totalAllowed },
                  ].map(({ label, val }) => (
                    <div key={label} style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 10, color: "#5a7a9a", fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#b0c4de", fontFamily: "'Space Mono', monospace" }}>{val}</div>
                    </div>
                  ))}
                </div>

                {result.fasterThanGoal && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "#69f0ae", fontFamily: "'Space Mono', monospace", textAlign: "center", opacity: 0.85 }}>
                    ↑ faster than goal — ease into it gradually
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: "#2a4060", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em" }}>
          no math. just run.
        </div>
      </div>
    </>
  );
}
