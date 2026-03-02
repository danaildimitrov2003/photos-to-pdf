import { useCallback, useState, useRef, useEffect } from 'react';

interface StepperInputProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string;
  unit?: string;
  onChange: (value: number) => void;
}

export function StepperInput({ value, min, max, step = 1, label, unit, onChange }: StepperInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = useCallback(
    (v: number) => Math.max(min, Math.min(max, v)),
    [min, max]
  );

  // Sync draft when value changes externally
  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const decrement = () => onChange(clamp(value - step));
  const increment = () => onChange(clamp(value + step));

  const commitDraft = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) {
      onChange(clamp(Math.round(parsed)));
    } else {
      setDraft(String(value));
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitDraft();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setDraft(String(value));
      setEditing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="stepper-input">
      {label && <span className="stepper-label">{label}</span>}
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-btn stepper-btn-minus"
          onClick={decrement}
          disabled={value <= min}
          aria-label="Decrease"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="2" y1="6" x2="10" y2="6" />
          </svg>
        </button>
        <div className="stepper-value">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className="stepper-number-input"
            value={editing ? draft : String(value)}
            onFocus={() => {
              setEditing(true);
              setDraft(String(value));
              // Select all on focus
              setTimeout(() => inputRef.current?.select(), 0);
            }}
            onBlur={commitDraft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {unit && <span className="stepper-unit">{unit}</span>}
        </div>
        <button
          type="button"
          className="stepper-btn stepper-btn-plus"
          onClick={increment}
          disabled={value >= max}
          aria-label="Increase"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="2" y1="6" x2="10" y2="6" />
            <line x1="6" y1="2" x2="6" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
