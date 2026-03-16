interface DirectionCardProps {
  summary: string;
  preview: string;
  onPick: () => void;
  disabled?: boolean;
}

export default function DirectionCard({ summary, preview, onPick, disabled }: DirectionCardProps) {
  return (
    <button className="direction-card" onClick={onPick} disabled={disabled}>
      <h3 className="direction-summary">{summary}</h3>
      <p className="direction-preview">{preview}</p>
    </button>
  );
}
