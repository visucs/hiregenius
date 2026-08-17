/**
 * formatError — extract a user-friendly message from an Axios error.
 * Spring Boot returns { status, message, details } — we surface `message`.
 */
export const formatError = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'An unexpected error occurred.'
  );
};

/**
 * formatDate — format ISO date strings for display.
 */
export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
};

/**
 * truncate — truncate long strings with ellipsis.
 */
export const truncate = (str, max = 60) => {
  if (!str) return '';
  return str.length <= max ? str : `${str.slice(0, max)}…`;
};
