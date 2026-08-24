export interface PlazaMeterProps {
  label: string;
  max?: number;
  tone: "mood" | "energy" | "growth";
  value: number;
  valueLabel?: string;
}

export function PlazaMeter({ label, max = 100, tone, value, valueLabel }: PlazaMeterProps) {
  const safeValue = Math.max(0, Math.min(max, value));
  return (
    <div className={`plaza-meter plaza-meter-${tone}`}>
      <div className="plaza-meter-heading">
        <span>{label}</span>
        <strong>{valueLabel ?? `${Math.round(safeValue)}%`}</strong>
      </div>
      <progress aria-label={label} max={max} value={safeValue} />
    </div>
  );
}
