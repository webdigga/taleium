interface PullQuoteProps {
  quote: string;
}

export default function PullQuote({ quote }: PullQuoteProps) {
  return (
    <aside className="pull-quote" role="note">
      <p>{quote}</p>
    </aside>
  );
}
