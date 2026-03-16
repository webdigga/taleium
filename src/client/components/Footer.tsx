export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <p className="footer-brand">Taleium</p>
        <p className="footer-tagline">Stories created together, one chapter at a time.</p>
        <p className="footer-copyright">&copy; {new Date().getFullYear()} Taleium. All rights reserved.</p>
      </div>
    </footer>
  );
}
