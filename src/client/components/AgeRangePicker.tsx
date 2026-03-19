interface AgeRangePickerProps {
  selected: string;
  onChange: (value: string) => void;
}

const options = [
  { value: '3-5', label: 'Ages 3-5', desc: 'Simple & playful' },
  { value: '6-8', label: 'Ages 6-8', desc: 'Adventure & wonder' },
  { value: '9-12', label: 'Ages 9-12', desc: 'Rich & detailed' },
];

export default function AgeRangePicker({ selected, onChange }: AgeRangePickerProps) {
  return (
    <fieldset className="age-picker">
      <legend className="age-picker-legend">Who is this story for?</legend>
      <div className="age-picker-options">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`age-option ${selected === opt.value ? 'active' : ''}`}
          >
            <input
              type="radio"
              name="ageRange"
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span className="age-label">{opt.label}</span>
            <span className="age-desc">{opt.desc}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
