import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
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
import NotFound from './pages/NotFound';

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
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
