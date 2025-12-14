
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage a string state that persists to localStorage.
 * @param key The localStorage key to use.
 * @param initialValue The default value if no key exists in storage.
 * @returns [currentValue, setValue, resetToDefault]
 */
export function usePersistentString(key: string, initialValue: string) {
    // Initialize state from localStorage or fallback to initialValue
    const [value, setValue] = useState(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            // Only return item if it's not null/undefined and not an empty string if initial wasn't empty
            return item !== null ? item : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Update localStorage whenever the value changes
    useEffect(() => {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            console.warn(`Error writing to localStorage key "${key}":`, error);
        }
    }, [key, value]);

    // Function to reset state to the initial value and clear localStorage key
    const resetValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
        setValue(initialValue);
    }, [key, initialValue]);

    return [value, setValue, resetValue] as const;
}
