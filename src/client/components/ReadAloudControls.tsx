import { useState, useEffect, useCallback, useRef } from 'react';

interface ReadAloudControlsProps {
  chapters: Array<{ chapter_number: number; title: string; content: string }>;
}

interface Part {
  text: string;
  chapterIndex: number;
}

function buildParts(chapters: ReadAloudControlsProps['chapters']): Part[] {
  const parts: Part[] = [];
  chapters.forEach((ch, i) => {
    parts.push({ text: `Chapter ${ch.chapter_number}. ${ch.title}`, chapterIndex: i });
    const paragraphs = ch.content.split('\n\n').filter((p) => p.trim());
    for (const para of paragraphs) {
      parts.push({ text: para, chapterIndex: i });
    }
  });
  return parts;
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

export default function ReadAloudControls({ chapters }: ReadAloudControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPart, setCurrentPart] = useState(0);
  const [rate, setRate] = useState(1);
  const [showBar, setShowBar] = useState(false);
  const partsRef = useRef<Part[]>([]);
  const currentPartRef = useRef(0);

  useEffect(() => {
    partsRef.current = buildParts(chapters);
  }, [chapters]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPart(0);
    currentPartRef.current = 0;
    setShowBar(false);
  }, []);

  const speakPart = useCallback((index: number) => {
    const parts = partsRef.current;
    if (index >= parts.length) {
      stop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(parts[index].text);
    utterance.lang = 'en-GB';
    utterance.rate = rate;

    utterance.onend = () => {
      const next = currentPartRef.current + 1;
      currentPartRef.current = next;
      setCurrentPart(next);
      speakPart(next);
    };

    window.speechSynthesis.speak(utterance);
  }, [rate, stop]);

  const play = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(true);
    setShowBar(true);
    currentPartRef.current = 0;
    setCurrentPart(0);
    speakPart(0);
  }, [isPaused, speakPart]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const changeRate = useCallback((newRate: number) => {
    setRate(newRate);
    if (isPlaying || isPaused) {
      window.speechSynthesis.cancel();
      setIsPaused(false);
      setIsPlaying(true);
      const idx = currentPartRef.current;

      const utterance = new SpeechSynthesisUtterance(partsRef.current[idx]?.text || '');
      utterance.lang = 'en-GB';
      utterance.rate = newRate;
      utterance.onend = () => {
        const next = currentPartRef.current + 1;
        currentPartRef.current = next;
        setCurrentPart(next);
        speakPart(next);
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [isPlaying, isPaused, speakPart]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!('speechSynthesis' in window)) return null;

  const parts = partsRef.current;
  const currentChapter = parts[currentPart]?.chapterIndex ?? 0;
  const chapterLabel = chapters[currentChapter]
    ? `Ch. ${chapters[currentChapter].chapter_number}`
    : '';

  return (
    <>
      <div className="read-aloud-trigger">
        {showBar ? (
          <button className="read-aloud-btn active" onClick={stop}>
            <span aria-hidden="true">&#9632;</span> Stop reading
          </button>
        ) : (
          <button className="read-aloud-btn" onClick={play}>
            <span aria-hidden="true">&#9654;</span> Read aloud
          </button>
        )}
      </div>

      {showBar && (
        <div className="read-aloud-bar">
          <div className="read-aloud-controls">
            {isPlaying ? (
              <button className="ra-btn" onClick={pause} aria-label="Pause">
                &#10074;&#10074;
              </button>
            ) : (
              <button className="ra-btn" onClick={play} aria-label="Play">
                &#9654;
              </button>
            )}

            <button className="ra-btn" onClick={stop} aria-label="Stop">
              &#9632;
            </button>

            <span className="ra-section-label">{chapterLabel}</span>

            <div className="ra-speed">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  className={`ra-speed-btn ${rate === s ? 'active' : ''}`}
                  onClick={() => changeRate(s)}
                >
                  {s}x
                </button>
              ))}
            </div>

            <span className="ra-progress">
              {Math.min(currentPart + 1, parts.length)} / {parts.length}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
