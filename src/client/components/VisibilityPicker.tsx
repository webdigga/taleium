interface VisibilityPickerProps {
  value: string;
  shareToken: string | null;
  onChange: (value: string) => void;
}

const options = [
  { value: 'private', label: 'Private', desc: 'Only you can see this' },
  { value: 'link', label: 'Shareable link', desc: 'Anyone with the link' },
  { value: 'public', label: 'Public', desc: 'Listed in Browse' },
];

export default function VisibilityPicker({ value, shareToken, onChange }: VisibilityPickerProps) {
  const shareUrl = shareToken ? `${window.location.origin}/shared/${shareToken}` : null;

  return (
    <div className="visibility-picker">
      <div className="visibility-options">
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`visibility-option ${value === opt.value ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <span className="visibility-label">{opt.label}</span>
            <span className="visibility-desc">{opt.desc}</span>
          </button>
        ))}
      </div>
      {shareUrl && (value === 'link' || value === 'public') && (
        <div className="share-url">
          <input
            type="text"
            value={shareUrl}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy</button>
        </div>
      )}
    </div>
  );
}
