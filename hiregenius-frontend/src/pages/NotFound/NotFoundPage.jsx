import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

/**
 * NotFoundPage — 404 fallback route.
 */
const NotFoundPage = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p
          className="text-8xl font-bold mb-4"
          style={{ color: 'var(--primary)' }}
        >
          404
        </p>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Page not found
        </h1>
        <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
          The page you&apos;re looking for doesn&apos;t exist or hasn&apos;t been built yet.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--primary)' }}
          id="not-found-home-link"
        >
          <Home size={16} />
          Go to Dashboard
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
