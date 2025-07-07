// src/lib/modalStore.js
import { writable, get } from 'svelte/store';

function createModalStore() {
    const { subscribe, set, update } = writable({
        isOpen: false,
        trackToAdd: null
    });

    return {
        subscribe,
        open: (track) => set({ isOpen: true, trackToAdd: track }),
        close: () => set({ isOpen: false, trackToAdd: null }),
    };
}

export const modalStore = createModalStore();