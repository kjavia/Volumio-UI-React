import { useState, useEffect } from 'react';

/**
 * Returns true while the media query matches the current viewport.
 * Reactively updates when the match state changes.
 *
 * @param {string} query - A CSS media query string, e.g. "(min-width: 1980px)"
 * @returns {boolean}
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }

    // Legacy fallback
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [query]);

  return matches;
};

export default useMediaQuery;
