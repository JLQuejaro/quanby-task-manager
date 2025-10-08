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

      // Ignore shortcuts when typing in input fields, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      // Only allow certain shortcuts (like Escape) in input fields
      const allowedInInputs = ['Escape', 'Enter'];
      if (isInputField && !allowedInInputs.includes(key) && !ctrlKey && !metaKey) {
        return;
      }

      const matchesKey = e.key.toLowerCase() === key.toLowerCase();
      
      // For Ctrl key, check both ctrlKey and metaKey (Mac Command key)
      const matchesCtrl = ctrlKey ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
      const matchesShift = shiftKey ? e.shiftKey : !e.shiftKey;
      const matchesAlt = altKey ? e.altKey : !e.altKey;

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
        // Always prevent default for our custom shortcuts
        if (preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        callbackRef.current(e);
      }
    },
    [key, ctrlKey, shiftKey, altKey, metaKey, preventDefault, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      // Only allow certain shortcuts (like Escape) in input fields
      const allowedInInputs = ['Escape', 'Enter'];
      if (isInputField && !allowedInInputs.includes(key) && !ctrlKey && !metaKey) {
        return;
      }

      const matchesKey = e.key.toLowerCase() === key.toLowerCase();
      
      // For Ctrl key, check both ctrlKey and metaKey (Mac Command key)
      const matchesCtrl = ctrlKey ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
      const matchesShift = shiftKey ? e.shiftKey : !e.shiftKey;
      const matchesAlt = altKey ? e.altKey : !e.altKey;

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
        // Prevent default BEFORE calling callback
        if (preventDefault) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        callbackRef.current(e);
        return false;
      }
    };

    // Add event listener in capture phase with high priority
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
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
      // Ignore shortcuts when typing in input fields, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

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

        // Only allow certain shortcuts (like Escape, Enter with Ctrl) in input fields
        const allowedInInputs = ['Escape'];
        const isCtrlEnter = key === 'Enter' && (ctrlKey || e.ctrlKey || e.metaKey);
        
        if (isInputField && !allowedInInputs.includes(key) && !isCtrlEnter && !ctrlKey && !(e.ctrlKey || e.metaKey)) {
          return;
        }

        const matchesKey = e.key.toLowerCase() === key.toLowerCase();
        
        // For Ctrl key, check both ctrlKey and metaKey (Mac Command key)
        const matchesCtrl = ctrlKey ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
        const matchesShift = shiftKey ? e.shiftKey : !e.shiftKey;
        const matchesAlt = altKey ? e.altKey : !e.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          // Prevent default BEFORE calling callback
          if (preventDefault) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
          callback(e);
        }
      });
    };

    // Add event listener in capture phase with high priority
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
  EDIT_TASK: { key: 'e', preventDefault: true },
  DELETE_TASK: { key: 'Delete', preventDefault: true },
  TOGGLE_COMPLETE: { key: ' ', preventDefault: true }, // Spacebar
  SEARCH: { key: '/', preventDefault: true },
  
  // Form Actions
  SUBMIT: { key: 'Enter', ctrlKey: true, preventDefault: true }, // Keep Ctrl+Enter for forms
  CANCEL: { key: 'Escape', preventDefault: true },
  
  // Navigation (removed Ctrl shortcuts)
  DASHBOARD: { key: 'd', shiftKey: true, preventDefault: true }, // Shift+D
  TASKS_PAGE: { key: 't', shiftKey: true, preventDefault: true }, // Shift+T
  
  // Calendar Navigation
  PREVIOUS_MONTH: { key: 'ArrowLeft', preventDefault: true },
  NEXT_MONTH: { key: 'ArrowRight', preventDefault: true },
  GO_TO_TODAY: { key: 't', preventDefault: true },
  
  // Filters (single numbers without Ctrl)
  FILTER_ALL: { key: '1', preventDefault: true },
  FILTER_TODAY: { key: '2', preventDefault: true },
  FILTER_TOMORROW: { key: '3', preventDefault: true },
  FILTER_UPCOMING: { key: '4', preventDefault: true },
  FILTER_COMPLETED: { key: '5', preventDefault: true },
  
  // Priority
  SET_HIGH_PRIORITY: { key: 'h', shiftKey: true, preventDefault: true },
  SET_MEDIUM_PRIORITY: { key: 'm', shiftKey: true, preventDefault: true },
  SET_LOW_PRIORITY: { key: 'l', shiftKey: true, preventDefault: true },
  
  // View/Display
  TOGGLE_THEME: { key: 'k', preventDefault: true },
  REFRESH: { key: 'r', shiftKey: true, preventDefault: true }, // Shift+R
  HELP: { key: '?', shiftKey: true, preventDefault: true },
} as const;