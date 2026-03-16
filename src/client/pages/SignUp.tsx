import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

export default function SignUp() {
  const { signup, user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit({ email, password, displayName }: { email: string; password: string; displayName?: string }) {
    await signup(email, password, displayName || '');
    navigate('/dashboard');
  }

  return (
    <main className="auth-page page-container">
      <AuthForm mode="signup" onSubmit={handleSubmit} />
    </main>
  );
}
