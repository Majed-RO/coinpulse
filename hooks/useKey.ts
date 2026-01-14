import { useEffect } from 'react';

/**
 * @param key The keyboard key to listen for (e.g., 'k', 'Escape')
 * @param callback The function to run when the key is pressed
 * @param options Object to specify if Ctrl or Meta (Cmd) keys are required
 */
export const useKey = (
  key: string, 
  callback: () => void, 
  options: { ctrlOrMeta?: boolean } = {}
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isKeyMatch = event.key.toLowerCase() === key.toLowerCase();
      const isModifierMatch = options.ctrlOrMeta 
        ? (event.ctrlKey || event.metaKey) 
        : true;

      if (isKeyMatch && isModifierMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options.ctrlOrMeta]);
};