// src/lib/persistentStore.js
import { writable } from 'svelte/store';

/**
 * Creates a Svelte store that automatically saves its value to localStorage.
 * @param {string} key The key to use in localStorage.
 * @param {any} initialValue The initial value if nothing is in localStorage.
 * @returns A Svelte writable store.
 */
export function persistentStore(key, initialValue) {
    let initialData = initialValue;

    // Check if we are in the browser and if a value exists in localStorage.
    if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem(key);
        if (saved) {
            try {
                // Try to parse the saved JSON.
                initialData = JSON.parse(saved);
            } catch (e) {
                // If parsing fails, fall back to the initial value.
                console.error(`Failed to parse localStorage key "${key}":`, e);
                initialData = initialValue;
            }
        }
    }

    // Create a new writable store with the loaded or initial data.
    const store = writable(initialData);

    // Subscribe to the store and save any changes to localStorage.
    if (typeof window !== 'undefined') {
        store.subscribe(value => {
            // Don't save if the value is undefined or null to prevent errors.
            if (value !== undefined && value !== null) {
                window.localStorage.setItem(key, JSON.stringify(value));
            } else {
                window.localStorage.removeItem(key); // Or remove it if it's null
            }
        });
    }

    return store;
}