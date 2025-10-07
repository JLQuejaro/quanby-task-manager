import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
}

/**
 * Custom hook for keyboard shortcuts
 * @param callback - Function to execute when shortcut is triggered
 * @param options - Shortcut configuration
 */
export function useKeyboardShortcut(
  callback: (e: KeyboardEvent) => void,
  options: KeyboardShortcutOptions
) {
  const {
    key,
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
    preventDefault = true,
    enabled = true,
  } = options;

  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const matchesKey = e.key.toLowerCase() === key.toLowerCase();
      
      // For Ctrl key, check both ctrlKey and metaKey (Mac Command key)
      const matchesCtrl = ctrlKey ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
      const matchesShift = shiftKey ? e.shiftKey : !e.shiftKey;
      const matchesAlt = altKey ? e.altKey : !e.altKey;

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
        if (preventDefault) {
          e.preventDefault();
        }
        callbackRef.current(e);
      }
    },
    [key, ctrlKey, shiftKey, altKey, preventDefault, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

/**
 * Hook for multiple keyboard shortcuts
 * @param shortcuts - Array of shortcut configurations
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{
    key: string;
    callback: (e: KeyboardEvent) => void;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    preventDefault?: boolean;
    enabled?: boolean;
  }>
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const {
          key,
          callback,
          ctrlKey = false,
          shiftKey = false,
          altKey = false,
          preventDefault = true,
          enabled = true,
        } = shortcut;

        if (!enabled) return;

        const matchesKey = e.key.toLowerCase() === key.toLowerCase();
        
        // For Ctrl key, check both ctrlKey and metaKey (Mac Command key)
        const matchesCtrl = ctrlKey ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
        const matchesShift = shiftKey ? e.shiftKey : !e.shiftKey;
        const matchesAlt = altKey ? e.altKey : !e.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          if (preventDefault) {
            e.preventDefault();
          }
          callback(e);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Common keyboard shortcut presets
 */
export const KeyboardShortcuts = {
  // Task Management
  NEW_TASK: { key: 'n', preventDefault: true },
  SEARCH: { key: '/', preventDefault: true },
  
  // Form Actions
  SAVE: { key: 's', ctrlKey: true, preventDefault: true },
  SUBMIT: { key: 'Enter', ctrlKey: true, preventDefault: true },
  CANCEL: { key: 'Escape', preventDefault: true },
  
  // Navigation
  DASHBOARD: { key: 'd', ctrlKey: true, preventDefault: true },
  TASKS: { key: 't', ctrlKey: true, preventDefault: true },
  PROFILE: { key: 'p', ctrlKey: true, preventDefault: true },
  SETTINGS: { key: ',', ctrlKey: true, preventDefault: true },
  
  // Task Actions
  EDIT_TASK: { key: 'e', preventDefault: true },
  DELETE_TASK: { key: 'Delete', preventDefault: true },
  TOGGLE_COMPLETE: { key: ' ', preventDefault: true }, // Spacebar
  
  // View/Display
  TOGGLE_THEME: { key: 'k', ctrlKey: true, preventDefault: true },
  REFRESH: { key: 'r', ctrlKey: true, preventDefault: true },
  
  // Filters
  FILTER_ALL: { key: '1', ctrlKey: true, preventDefault: true },
  FILTER_TODAY: { key: '2', ctrlKey: true, preventDefault: true },
  FILTER_TOMORROW: { key: '3', ctrlKey: true, preventDefault: true },
  FILTER_UPCOMING: { key: '4', ctrlKey: true, preventDefault: true },
  FILTER_COMPLETED: { key: '5', ctrlKey: true, preventDefault: true },
  
  // Priority
  SET_HIGH_PRIORITY: { key: 'h', shiftKey: true, preventDefault: true },
  SET_MEDIUM_PRIORITY: { key: 'm', shiftKey: true, preventDefault: true },
  SET_LOW_PRIORITY: { key: 'l', shiftKey: true, preventDefault: true },
  
  // General
  COPY: { key: 'c', ctrlKey: true, preventDefault: false },
  PASTE: { key: 'v', ctrlKey: true, preventDefault: false },
  UNDO: { key: 'z', ctrlKey: true, preventDefault: true },
  REDO: { key: 'z', ctrlKey: true, shiftKey: true, preventDefault: true },
  HELP: { key: '?', shiftKey: true, preventDefault: true },
} as const;