// src/lib/utils/track.js
import { get } from 'svelte/store'; // We need get to read the store value
import { player } from '$lib/playerStore.js';
import { durationStore } from '$lib/durationStore.js';

let storeCache;
durationStore.subscribe(value => {
    storeCache = value;
});

export function getTrackId(track) {
    if (!track || !track.trackInfo) return '';
    return track.trackInfo.author + track.trackInfo.title;
}

export function requestDuration(track) {
    if (!track) return;

    // --- THIS IS THE FIX ---
    // Get the current player state and check if we are connected.
    const playerState = get(player);
    if (!playerState.isConnected) {
        // If not connected, do nothing. The request can be tried again later
        // once the connection is established and the component re-renders.
        return;
    }

    const trackId = getTrackId(track);

    if (!storeCache.has(trackId)) {
        player._sendCommand(291, { track });
    }
}