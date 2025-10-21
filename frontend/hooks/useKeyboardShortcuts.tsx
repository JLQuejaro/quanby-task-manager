import { useEffect, useRef, useCallback } from 'react';

interface KeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
}

// Helper: Check if the event matches the shortcut
const matchesShortcut = (
  e: KeyboardEvent,
  { key, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false }: KeyboardShortcutOptions
) => {
  const matchesKey = e.key.toLowerCase() === key.toLowerCase();
  const matchesCtrl = ctrlKey ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
  const matchesShift = shiftKey ? e.shiftKey : !e.shiftKey;
  const matchesAlt = altKey ? e.altKey : !e.altKey;
  return matchesKey && matchesCtrl && matchesShift && matchesAlt;
};

// Helper: Check if the event target is an input field
const isInputField = (target: HTMLElement) =>
  target.tagName === 'INPUT' ||
  target.tagName === 'TEXTAREA' ||
  target.isContentEditable ||
  target.closest('[contenteditable="true"]');

/**
 * Custom hook for a single keyboard shortcut
 */
export function useKeyboardShortcut(
  callback: (e: KeyboardEvent) => void,
  options: KeyboardShortcutOptions
) {
  const { key, preventDefault = true, enabled = true } = options;
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const allowedInInputs = ['Escape'];
      const isCtrlEnter = key === 'Enter' && (options.ctrlKey || e.ctrlKey || e.metaKey);

      if (isInputField(target) && !allowedInInputs.includes(key) && !isCtrlEnter) {
        return;
      }

      if (matchesShortcut(e, options)) {
        if (preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        callbackRef.current(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [key, options.ctrlKey, options.shiftKey, options.altKey, options.metaKey, preventDefault, enabled]);
}

/**
 * Custom hook for multiple keyboard shortcuts
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
      const target = e.target as HTMLElement;
      shortcuts.forEach((shortcut) => {
        const { key, callback, enabled = true, preventDefault = true } = shortcut;
        if (!enabled) return;

        const allowedInInputs = ['Escape'];
        const isCtrlEnter = key === 'Enter' && (shortcut.ctrlKey || e.ctrlKey || e.metaKey);

        if (isInputField(target) && !allowedInInputs.includes(key) && !isCtrlEnter) {
          return;
        }

        if (matchesShortcut(e, shortcut)) {
          if (preventDefault) {
            e.preventDefault();
            e.stopPropagation();
          }
          callback(e);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
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
  SUBMIT: { key: 'Enter', ctrlKey: true, preventDefault: true },
  CANCEL: { key: 'Escape', preventDefault: true },

  // Navigation
  DASHBOARD: { key: 'd', shiftKey: true, preventDefault: true },
  TASKS_PAGE: { key: 't', shiftKey: true, preventDefault: true },

  // Calendar Navigation
  PREVIOUS_MONTH: { key: 'ArrowLeft', preventDefault: true },
  NEXT_MONTH: { key: 'ArrowRight', preventDefault: true },
  GO_TO_TODAY: { key: 't', preventDefault: true },

  // Filters
  FILTER_ALL: { key: '1', preventDefault: true },
  FILTER_TODAY: { key: '2', preventDefault: true },
  FILTER_TOMORROW: { key: '3', preventDefault: true },
  FILTER_UPCOMING: { key: '4', preventDefault: true },
  FILTER_COMPLETED: { key: '5', preventDefault: true },

  // Priority Filters
  SET_HIGH_PRIORITY: { key: 'h', shiftKey: true, preventDefault: true },
  SET_MEDIUM_PRIORITY: { key: 'm', shiftKey: true, preventDefault: true },
  SET_LOW_PRIORITY: { key: 'l', shiftKey: true, preventDefault: true },

  // View/Display
  TOGGLE_THEME: { key: 'k', preventDefault: true },
  REFRESH: { key: 'r', shiftKey: true, preventDefault: true },
  HELP: { key: '?', shiftKey: true, preventDefault: true },
} as const;

// Export the type for the shortcuts
export type KeyboardShortcut = typeof KeyboardShortcuts[keyof typeof KeyboardShortcuts];
