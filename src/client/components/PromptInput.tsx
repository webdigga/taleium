import { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function PromptInput({ onSubmit, isLoading, placeholder }: PromptInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="prompt-input">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || 'What happens next in your story?'}
        disabled={isLoading}
        rows={3}
        className="prompt-textarea"
      />
      <button type="submit" className="prompt-submit" disabled={isLoading || !value.trim()}>
        {isLoading ? 'Writing...' : 'Write this chapter'}
      </button>
    </form>
  );
}
