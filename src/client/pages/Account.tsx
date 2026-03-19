import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface BillingStatus {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function Account() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetch('/api/billing/status', { credentials: 'include' })
      .then((res) => res.json() as Promise<BillingStatus>)
      .then((data) => setBilling(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } catch {} finally {
      setPortalLoading(false);
    }
  }

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } catch {} finally {
      setCheckoutLoading(false);
    }
  }

  const isPaid = billing?.status === 'active' || billing?.status === 'past_due';

  return (
    <main className="account-page page-container">
      <h1 className="account-title">Account</h1>

      <section className="account-section">
        <h2 className="account-section-title">Profile</h2>
        <div className="account-field">
          <span className="account-label">Name</span>
          <span className="account-value">{user?.displayName}</span>
        </div>
        <div className="account-field">
          <span className="account-label">Email</span>
          <span className="account-value">{user?.email}</span>
        </div>
      </section>

      <section className="account-section">
        <h2 className="account-section-title">Plan</h2>

        {loading && <p className="account-loading">Loading...</p>}

        {!loading && !isPaid && (
          <div className="plan-card plan-card-free">
            <div className="plan-card-header">
              <h3>Free</h3>
              <span className="plan-badge plan-badge-current">Current plan</span>
            </div>
            <p className="plan-desc">1 book, 3 chapters per book</p>
            <button className="btn-primary" onClick={handleUpgrade} disabled={checkoutLoading}>
              {checkoutLoading ? 'Loading...' : 'Upgrade to Premium'}
            </button>
          </div>
        )}

        {!loading && isPaid && (
          <div className="plan-card plan-card-premium">
            <div className="plan-card-header">
              <h3>Premium</h3>
              <span className="plan-badge plan-badge-active">Active</span>
            </div>
            <p className="plan-desc">Unlimited books and chapters</p>
            {billing?.currentPeriodEnd && (
              <p className="plan-period">
                {billing.cancelAtPeriodEnd
                  ? `Cancels on ${new Date(billing.currentPeriodEnd).toLocaleDateString()}`
                  : `Renews on ${new Date(billing.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            )}
            {billing?.status === 'past_due' && (
              <p className="plan-warning">Payment failed - please update your payment method.</p>
            )}
            <button className="btn-secondary" onClick={handleManageBilling} disabled={portalLoading}>
              {portalLoading ? 'Loading...' : 'Manage billing'}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
