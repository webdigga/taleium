import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MobileNav from './components/MobileNav';
import InstallPrompt from './components/InstallPrompt';
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
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/shared/:token" element={<SharedBook />} />
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/create" element={<AuthGuard><CreateBook /></AuthGuard>} />
          <Route path="/books/:id" element={<AuthGuard><BookView /></AuthGuard>} />
          <Route path="/books/:id/new-chapter" element={<AuthGuard><AddChapter /></AuthGuard>} />
          <Route path="/books/:id/read" element={<AuthGuard><ReadStory /></AuthGuard>} />
          <Route path="/account" element={<AuthGuard><Account /></AuthGuard>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <MobileNav />
        <InstallPrompt />
      </AuthProvider>
    </BrowserRouter>
  );
}
