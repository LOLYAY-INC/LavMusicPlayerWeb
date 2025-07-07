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

    if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem(key);
        if (saved) {
            try {
                initialData = JSON.parse(saved);
            } catch (e) {
                console.error(`Failed to parse localStorage key "${key}":`, e);
                initialData = initialValue;
            }
        }
    }

    const store = writable(initialData);

    if (typeof window !== 'undefined') {
        store.subscribe(value => {
            if (value !== undefined && value !== null) {
                window.localStorage.setItem(key, JSON.stringify(value));
            } else {
                window.localStorage.removeItem(key);
            }
        });
    }

    return store;
}