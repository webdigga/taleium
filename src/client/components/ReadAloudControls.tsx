import { useState, useEffect, useCallback, useRef } from 'react';

interface ArticleContent {
  introduction: string;
  sections: { heading: string; content: string }[];
  conclusion: string;
}

interface ReadAloudControlsProps {
  content: ArticleContent;
  readingLevel: string;
  onSectionChange: (index: number) => void;
}

type PlayState = 'idle' | 'playing' | 'paused';

const RATE_OPTIONS = [0.75, 1, 1.25, 1.5];

const DEFAULT_RATES: Record<string, number> = {
  'young-explorer': 0.85,
  'curious-mind': 0.95,
  'deep-dive': 1.0,
};

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.replace(/\*\*/g, '').trim())
    .filter(Boolean);
}

export default function ReadAloudControls({
  content,
  readingLevel,
  onSectionChange,
}: ReadAloudControlsProps) {
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [rate, setRate] = useState(DEFAULT_RATES[readingLevel] || 1);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  const partsRef = useRef<{ sectionIndex: number; text: string }[]>([]);
  const currentPartRef = useRef(0);

  // Build a flat list of parts: intro paragraphs, then each section's paragraphs, then conclusion paragraphs
  useEffect(() => {
    const parts: { sectionIndex: number; text: string }[] = [];

    // Introduction = section index -1
    for (const p of splitIntoParagraphs(content.introduction)) {
      parts.push({ sectionIndex: -1, text: p });
    }

    // Sections
    content.sections.forEach((section, i) => {
      parts.push({ sectionIndex: i, text: section.heading });
      for (const p of splitIntoParagraphs(section.content)) {
        parts.push({ sectionIndex: i, text: p });
      }
    });

    // Conclusion = section index -2
    for (const p of splitIntoParagraphs(content.conclusion)) {
      parts.push({ sectionIndex: -2, text: p });
    }

    partsRef.current = parts;
  }, [content]);

  const totalParts = partsRef.current.length;

  const speakPart = useCallback(
    (index: number) => {
      if (index >= partsRef.current.length) {
        setPlayState('idle');
        setCurrentPartIndex(0);
        currentPartRef.current = 0;
        onSectionChange(-999);
        return;
      }

      const part = partsRef.current[index];
      const utterance = new SpeechSynthesisUtterance(part.text);
      utterance.rate = rate;
      utterance.lang = 'en-GB';

      utterance.onstart = () => {
        setCurrentPartIndex(index);
        currentPartRef.current = index;
        onSectionChange(part.sectionIndex);
      };

      utterance.onend = () => {
        const next = currentPartRef.current + 1;
        currentPartRef.current = next;
        speakPart(next);
      };

      speechSynthesis.speak(utterance);
    },
    [rate, onSectionChange]
  );

  function handlePlay() {
    if (playState === 'paused') {
      speechSynthesis.resume();
      setPlayState('playing');
    } else {
      speechSynthesis.cancel();
      setPlayState('playing');
      speakPart(currentPartRef.current);
    }
  }

  function handlePause() {
    speechSynthesis.pause();
    setPlayState('paused');
  }

  function handleStop() {
    speechSynthesis.cancel();
    setPlayState('idle');
    setCurrentPartIndex(0);
    currentPartRef.current = 0;
    onSectionChange(-999);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  // Re-apply rate changes: cancel current and restart from current part
  useEffect(() => {
    if (playState === 'playing') {
      speechSynthesis.cancel();
      speakPart(currentPartRef.current);
    }
  }, [rate, playState, speakPart]);

  // Compute which "section" label to show
  const currentSection = partsRef.current[currentPartIndex]?.sectionIndex ?? -1;
  let sectionLabel = '';
  if (currentSection === -1) sectionLabel = 'Introduction';
  else if (currentSection === -2) sectionLabel = 'Conclusion';
  else sectionLabel = `Section ${currentSection + 1} of ${content.sections.length}`;

  if (playState === 'idle' && currentPartIndex === 0) {
    return (
      <div className="read-aloud-trigger">
        <button className="read-aloud-btn" onClick={handlePlay} aria-label="Read article aloud">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          Read Aloud
        </button>
      </div>
    );
  }

  return (
    <div className="read-aloud-bar" role="region" aria-label="Read aloud controls">
      <div className="read-aloud-controls">
        {playState === 'playing' ? (
          <button className="ra-btn" onClick={handlePause} aria-label="Pause">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          </button>
        ) : (
          <button className="ra-btn" onClick={handlePlay} aria-label="Play">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}
        <button className="ra-btn" onClick={handleStop} aria-label="Stop">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z" /></svg>
        </button>

        <span className="ra-section-label">{sectionLabel}</span>

        <div className="ra-speed">
          {RATE_OPTIONS.map((r) => (
            <button
              key={r}
              className={`ra-speed-btn ${rate === r ? 'active' : ''}`}
              onClick={() => setRate(r)}
              aria-label={`Speed ${r}x`}
            >
              {r}x
            </button>
          ))}
        </div>

        <div className="ra-progress">
          {currentPartIndex + 1}/{totalParts}
        </div>
      </div>
    </div>
  );
}
