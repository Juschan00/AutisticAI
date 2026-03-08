import { useState, useEffect, useRef, useCallback } from 'react';
import './SensoryProfile.css';

const SLIDERS = [
  {
    key: 'noiseTolerance',
    label: 'Noise Levels',
    icon: 'noise',
    min: 'Highly Sensitive',
    max: 'High Tolerance',
    gradient: 'linear-gradient(to right, #6ad6c8, #a8e6cf)',
    overGradient: 'linear-gradient(to right, #fca5a5, #fcd6a3)',
    backendField: true,
    statusFn: (v) => v <= 2 ? 'Quiet preferred' : v <= 3 ? 'Moderate noise ok' : 'High tolerance',
    badgeFn: (v) => v <= 2 ? 'quiet' : v <= 3 ? 'moderate' : 'high',
  },
  {
    key: 'lightingTolerance',
    label: 'Light Intensity',
    icon: 'light',
    min: 'Prefers Dim',
    max: 'Prefers Bright',
    gradient: 'linear-gradient(to right, #93c5fd, #a8d8ea)',
    overGradient: 'linear-gradient(to right, #fca5a5, #fcd6a3)',
    backendField: true,
    statusFn: (v) => v <= 2 ? 'Dim & Shaded' : v <= 3 ? 'Moderate light' : 'Bright is fine',
    badgeFn: (v) => v <= 2 ? 'quiet' : v <= 3 ? 'moderate' : 'high',
  },
  {
    key: 'crowdTolerance',
    label: 'Crowd Density',
    icon: 'crowd',
    min: 'Empty Spaces',
    max: 'Bustling',
    gradient: 'linear-gradient(to right, #fcd6a3, #fca5a5)',
    overGradient: 'linear-gradient(to right, #fca5a5, #f87171)',
    backendField: true,
    statusFn: (v) => v <= 2 ? 'Low crowds only' : v <= 3 ? 'Moderate right now' : 'Crowds are ok',
    badgeFn: (v) => v <= 2 ? 'quiet' : v <= 3 ? 'moderate' : 'high',
  },
  {
    key: 'olfactoryTolerance',
    label: 'Olfactory / Smell',
    icon: 'smell',
    min: 'Sensitive',
    max: 'Unaffected',
    gradient: 'linear-gradient(to right, #a8e6cf, #d1fae5)',
    overGradient: 'linear-gradient(to right, #fca5a5, #fcd6a3)',
    backendField: false,
    statusFn: (v) => v <= 2 ? 'Fresh Air' : v <= 3 ? 'Mild scents ok' : 'Not affected',
    badgeFn: (v) => v <= 2 ? 'quiet' : v <= 3 ? 'moderate' : 'high',
  },
  {
    key: 'spatialOpenness',
    label: 'Spatial Openness',
    icon: 'spatial',
    min: 'Enclosed Space',
    max: 'Wide Open',
    gradient: 'linear-gradient(to right, #93c5fd, #6ad6c8)',
    overGradient: 'linear-gradient(to right, #fca5a5, #fcd6a3)',
    backendField: false,
    statusFn: (v) => v <= 2 ? 'Enclosed preferred' : v <= 3 ? 'Some openness' : 'Always Open',
    badgeFn: (v) => v <= 2 ? 'quiet' : v <= 3 ? 'moderate' : 'high',
  },
  {
    key: 'echoTolerance',
    label: 'Acoustic Echo',
    icon: 'echo',
    min: 'Zero Echo',
    max: 'Reverberant',
    gradient: 'linear-gradient(to right, #a8d8ea, #c7d2fe)',
    overGradient: 'linear-gradient(to right, #fca5a5, #fcd6a3)',
    backendField: false,
    statusFn: (v) => v <= 2 ? 'No Echo' : v <= 3 ? 'Some echo ok' : 'Echo tolerant',
    badgeFn: (v) => v <= 2 ? 'quiet' : v <= 3 ? 'moderate' : 'high',
  },
];

const DEFAULTS = { noiseTolerance: 2, lightingTolerance: 3, crowdTolerance: 2, olfactoryTolerance: 2, spatialOpenness: 4, echoTolerance: 2 };

const ICONS = {
  noise: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M6 7v6M14 5v10M2 9v2M18 9v2" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  light: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="4" stroke="#475569" strokeWidth="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  crowd: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="2.5" stroke="#475569" strokeWidth="1.5"/><circle cx="13" cy="7" r="2.5" stroke="#475569" strokeWidth="1.5"/><path d="M2 17c0-2.76 2.24-5 5-5s5 2.24 5 5M10 17c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  smell: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 14c-1.1 0-2-.9-2-2V8c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v4c0 1.1-.9 2-2 2" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 14v2c0 1.1.9 2 2 2s2-.9 2-2v-2" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  spatial: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  echo: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 10c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="1.5" fill="#475569"/></svg>,
};

function SensoryProfile({ userProfile, onSave }) {
  const [values, setValues] = useState({ ...DEFAULTS });
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (userProfile) {
      setValues((prev) => ({
        ...prev,
        noiseTolerance: userProfile.noiseTolerance ?? DEFAULTS.noiseTolerance,
        lightingTolerance: userProfile.lightingTolerance ?? DEFAULTS.lightingTolerance,
        crowdTolerance: userProfile.crowdTolerance ?? DEFAULTS.crowdTolerance,
      }));
    }
  }, [userProfile]);

  const debouncedSave = useCallback((newValues) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await onSave({
          noiseTolerance: newValues.noiseTolerance,
          lightingTolerance: newValues.lightingTolerance,
          crowdTolerance: newValues.crowdTolerance,
        });
      } finally {
        setSaving(false);
      }
    }, 600);
  }, [onSave]);

  const handleChange = (key, val, isBackend) => {
    const num = Number(val);
    const next = { ...values, [key]: num };
    setValues(next);
    if (isBackend) debouncedSave(next);
  };

  const handleReset = () => {
    setValues({ ...DEFAULTS });
    debouncedSave({ ...DEFAULTS });
  };

  const pct = (v) => ((v - 1) / 4) * 100;

  return (
    <div className="spro-page">
      <div className="spro-header">
        <div>
          <h1>Sensory Profile Customizations</h1>
          <p>Adjust your personal thresholds below. The environment's current values are shown inside the colored bars.</p>
        </div>
        <button type="button" className="spro-reset-btn" onClick={handleReset}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2v5h5" stroke="#0f1720" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.05 10A6 6 0 1 0 4 4L2 7" stroke="#0f1720" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Reset Profile
        </button>
      </div>

      {saving && <div className="spro-saving">Saving…</div>}

      <div className="spro-grid">
        {SLIDERS.map((slider) => {
          const val = values[slider.key];
          const percent = pct(val);
          const status = slider.statusFn(val);
          const badgeType = slider.badgeFn(val);

          return (
            <div key={slider.key} className="spro-slider-card">
              <div className="spro-slider-top">
                <div className="spro-slider-label">
                  <span className="spro-slider-icon">{ICONS[slider.icon]}</span>
                  <h3>{slider.label}</h3>
                </div>
                <span className={`spro-status-badge ${badgeType}`}>{status}</span>
              </div>

              <div className="spro-track-wrap">
                {/* Colored environment bar */}
                <div
                  className="spro-env-bar"
                  style={{
                    width: `${percent}%`,
                    background: badgeType === 'high' ? slider.overGradient : slider.gradient,
                  }}
                />

                {/* Threshold label */}
                <div className="spro-threshold-marker" style={{ left: `${percent}%` }}>
                  <span className="spro-threshold-label">Your Threshold</span>
                  <div className="spro-threshold-line" />
                </div>

                {/* Native range input */}
                <input
                  type="range"
                  className="spro-range"
                  min={1}
                  max={5}
                  step={1}
                  value={val}
                  onChange={(e) => handleChange(slider.key, e.target.value, slider.backendField)}
                />
              </div>

              <div className="spro-slider-labels">
                <span>{slider.min}</span>
                <span>{slider.max}</span>
              </div>

              {!slider.backendField && (
                <span className="spro-coming-soon">Visual only — backend coming soon</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SensoryProfile;
