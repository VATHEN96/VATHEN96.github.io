import { useState, useEffect } from 'react';

/**
 * Custom hook for checking if a media query matches
 * 
 * @param query The media query to check
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize to null to avoid hydration mismatch
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    // Set actual initial value after component mounts
    const media = window.matchMedia(query);
    setMatches(media.matches);

    // Define the event handler
    const updateMatches = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add event listener for media query changes
    media.addEventListener('change', updateMatches);

    // Cleanup
    return () => {
      media.removeEventListener('change', updateMatches);
    };
  }, [query]);

  // Return false during SSR to avoid hydration issues
  return matches ?? false;
}

export default useMediaQuery; 