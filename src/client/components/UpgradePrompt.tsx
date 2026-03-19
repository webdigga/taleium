import { useState } from 'react';

interface UpgradePromptProps {
  message: string;
}

export default function UpgradePrompt({ message }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="upgrade-prompt">
      <div className="upgrade-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 4L18 12L26 10L20 16L28 20L20 22L22 30L16 24L10 30L12 22L4 20L12 16L6 10L14 12L16 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(212, 160, 60, 0.15)" />
        </svg>
      </div>
      <p className="upgrade-message">{message}</p>
      <button className="btn-primary" onClick={handleUpgrade} disabled={loading}>
        {loading ? 'Loading...' : 'Upgrade to Premium'}
      </button>
    </div>
  );
}
