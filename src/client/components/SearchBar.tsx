import { useState, type FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (topic: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [topic, setTopic] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (trimmed && !isLoading) {
      onSearch(trimmed);
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <label htmlFor="topic-input" className="sr-only">
        Enter a topic
      </label>
      <input
        id="topic-input"
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="What do you want to learn about?"
        className="search-input"
        disabled={isLoading}
        autoComplete="off"
      />
      <button type="submit" className="search-button" disabled={isLoading || !topic.trim()}>
        {isLoading ? 'Generating...' : 'Generate Article'}
      </button>
    </form>
  );
}
