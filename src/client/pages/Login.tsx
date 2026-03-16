import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit({ email, password }: { email: string; password: string }) {
    await login(email, password);
    navigate('/dashboard');
  }

  return (
    <main className="auth-page page-container">
      <AuthForm mode="login" onSubmit={handleSubmit} />
    </main>
  );
}
