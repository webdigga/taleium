type ReadingLevel = 'young-explorer' | 'curious-mind' | 'deep-dive';

interface ReadingLevelPickerProps {
  selected: ReadingLevel;
  onChange: (level: ReadingLevel) => void;
}

const levels: { value: ReadingLevel; label: string; description: string; icon: string }[] = [
  {
    value: 'young-explorer',
    label: 'Young Explorer',
    description: 'KS1 \u00B7 Ages 6\u20139',
    icon: '\u2728',
  },
  {
    value: 'curious-mind',
    label: 'Curious Mind',
    description: 'KS2\u2013KS3 \u00B7 Ages 10\u201313',
    icon: '\uD83D\uDD2D',
  },
  {
    value: 'deep-dive',
    label: 'Deep Dive',
    description: 'GCSE+ \u00B7 Adult',
    icon: '\uD83C\uDF0A',
  },
];

export default function ReadingLevelPicker({ selected, onChange }: ReadingLevelPickerProps) {
  return (
    <fieldset className="level-picker">
      <legend className="level-picker-legend">Select reading level</legend>
      <div className="level-picker-options">
        {levels.map((level) => (
          <label
            key={level.value}
            className={`level-option ${level.value} ${selected === level.value ? 'active' : ''}`}
          >
            <input
              type="radio"
              name="reading-level"
              value={level.value}
              checked={selected === level.value}
              onChange={() => onChange(level.value)}
              className="sr-only"
            />
            <span className="level-icon">{level.icon}</span>
            <span className="level-label">{level.label}</span>
            <span className="level-desc">{level.description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
