/**
 * Footer — minimal app footer for the authenticated shell.
 */
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="h-10 flex items-center justify-center text-xs px-6"
      style={{
        color: 'var(--text-secondary)',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
      }}
    >
      © {year} HireGenius AI — AI-Powered Recruitment Platform
    </footer>
  );
};

export default Footer;
