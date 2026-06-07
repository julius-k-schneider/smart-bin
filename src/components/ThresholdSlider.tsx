import type { CSSProperties } from "react";

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const ThresholdSlider = ({
  value,
  onChange,
  min = 0,
  max = 100,
}: ThresholdSliderProps) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <label htmlFor="threshold-slider" style={{ fontSize: "0.95rem", fontWeight: 500 }}>
        Include bins from fill level:
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <input
          id="threshold-slider"
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            cursor: "pointer",
            appearance: "none",
            height: "8px",
            borderRadius: "5px",
            background: "rgba(146, 176, 211, 0.1)",
            outline: "none",
            WebkitAppearance: "none",
          } as CSSProperties}
        />
        <div
          style={{
            minWidth: "70px",
            padding: "6px 12px",
            backgroundColor: "rgba(56, 135, 255, 0.1)",
            border: "1px solid rgba(56, 135, 255, 0.3)",
            borderRadius: "8px",
            textAlign: "center",
            fontWeight: "600",
            fontSize: "0.95rem",
          }}
        >
          {value}%
        </div>
      </div>
    </div>
  );
};
