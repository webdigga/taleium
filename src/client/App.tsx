import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AppLayout from './components/AppLayout';
import AuthGuard from './components/AuthGuard';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateBook from './pages/CreateBook';
import BookView from './pages/BookView';
import AddChapter from './pages/AddChapter';
import ReadStory from './pages/ReadStory';
import SharedBook from './pages/SharedBook';
import Browse from './pages/Browse';
import Account from './pages/Account';
import NotFound from './pages/NotFound';

function PublicLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

function BrowseRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <AppLayout><Browse /></AppLayout>;
  }
  return (
    <>
      <Header />
      <Browse />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Browse: app layout when logged in, public layout when not */}
          <Route path="/browse" element={<BrowseRoute />} />

          {/* Public pages: header + footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shared/:token" element={<SharedBook />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* App pages: mobile bottom nav, no footer */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/create" element={<AuthGuard><CreateBook /></AuthGuard>} />
            <Route path="/books/:id" element={<AuthGuard><BookView /></AuthGuard>} />
            <Route path="/books/:id/new-chapter" element={<AuthGuard><AddChapter /></AuthGuard>} />
            <Route path="/books/:id/read" element={<AuthGuard><ReadStory /></AuthGuard>} />
            <Route path="/account" element={<AuthGuard><Account /></AuthGuard>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
