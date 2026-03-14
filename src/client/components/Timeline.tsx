interface TimelineEntry {
  date: string;
  event: string;
}

interface TimelineProps {
  entries: TimelineEntry[];
}

export default function Timeline({ entries }: TimelineProps) {
  if (!entries || entries.length === 0) return null;

  return (
    <section className="article-timeline">
      <h2>Key Dates</h2>
      <ol className="timeline-list">
        {entries.map((entry, i) => (
          <li key={i} className="timeline-item">
            <time className="timeline-date">{entry.date}</time>
            <span className="timeline-event">{entry.event}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
