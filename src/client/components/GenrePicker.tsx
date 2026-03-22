interface GenrePickerProps {
  selected: string;
  onChange: (value: string) => void;
}

const genres = [
  { value: 'adventure', label: 'Adventure', emoji: '\u2694\uFE0F' },
  { value: 'fantasy', label: 'Fantasy', emoji: '\u2728' },
  { value: 'mystery', label: 'Mystery', emoji: '\uD83D\uDD0D' },
  { value: 'sci-fi', label: 'Sci-Fi', emoji: '\uD83D\uDE80' },
  { value: 'fairy-tale', label: 'Fairy Tale', emoji: '\uD83E\uDDDA' },
  { value: 'animal', label: 'Animal', emoji: '\uD83D\uDC3E' },
  { value: 'funny', label: 'Funny', emoji: '\uD83E\uDD23' },
  { value: 'spooky', label: 'Spooky', emoji: '\uD83C\uDF19' },
];

export default function GenrePicker({ selected, onChange }: GenrePickerProps) {
  return (
    <fieldset className="genre-picker">
      <legend className="genre-picker-legend">Story genre <span className="premium-badge">Premium</span></legend>
      <div className="genre-picker-options">
        {genres.map((g) => (
          <label
            key={g.value}
            className={`genre-option ${selected === g.value ? 'active' : ''}`}
          >
            <input
              type="radio"
              name="genre"
              value={g.value}
              checked={selected === g.value}
              onChange={() => onChange(selected === g.value ? '' : g.value)}
              className="sr-only"
            />
            <span className="genre-emoji">{g.emoji}</span>
            <span className="genre-label">{g.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export const GENRE_LABELS: Record<string, string> = Object.fromEntries(
  genres.map((g) => [g.value, `${g.emoji} ${g.label}`]),
);
