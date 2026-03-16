import { useState } from 'react';
import { Link } from 'react-router-dom';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: { email: string; password: string; displayName?: string }) => Promise<void>;
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({ email, password, displayName: mode === 'signup' ? displayName : undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h1 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="auth-subtitle">
        {mode === 'login'
          ? 'Sign in to continue your stories'
          : 'Start creating stories with your family'}
      </p>

      {error && <div className="auth-error">{error}</div>}

      {mode === 'signup' && (
        <label className="auth-field">
          <span>Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
          />
        </label>
      )}

      <label className="auth-field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>

      <label className="auth-field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
          minLength={mode === 'signup' ? 8 : undefined}
          required
        />
      </label>

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>

      <p className="auth-switch">
        {mode === 'login' ? (
          <>Don&apos;t have an account? <Link to="/signup">Sign up</Link></>
        ) : (
          <>Already have an account? <Link to="/login">Sign in</Link></>
        )}
      </p>
    </form>
  );
}
