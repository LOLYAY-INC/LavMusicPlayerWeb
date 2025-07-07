// src/lib/durationStore.js
import { writable, get } from 'svelte/store';

/**
 * A store to cache track durations.
 * Maps a unique track ID (author+title) to its duration in milliseconds.
 */
function createDurationStore() {
    const { subscribe, update } = writable(new Map());

    return {
        subscribe,
        setDuration: (trackId, duration) => {
            update(cache => {
                cache.set(trackId, duration);
                return cache;
            });
        }
    };
}

export const durationStore = createDurationStore();