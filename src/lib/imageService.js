// src/lib/imageService.js
import { openDB } from 'idb';
import { writable, get } from 'svelte/store';
import { player } from './playerStore.js';

const DB_NAME = 'image-cache-db';
const STORE_NAME = 'images';
const DB_VERSION = 1;

// A Svelte store to hold our reactive image data.
// Maps: originalUrl -> base64 string
const imageCache = writable(new Map());

// --- Initialize the Database ---
const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        // This runs only if the DB doesn't exist or version is higher
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME); // Key will be the URL string
        }
    },
});

/**
 * The main function components will call.
 * It tries to get the image from cache/DB, and if not found, requests it from the server.
 * @param {string | null} url The high-quality image URL to get.
 */
export async function getImage(url) {
    if (!url) return;

    // 1. Check the reactive Svelte store first (memory cache)
    let currentCache;
    imageCache.subscribe(c => currentCache = c)(); // Get current value
    if (currentCache.has(url)) {
        return; // The store already has it, UI is up to date
    }

    // 2. Check IndexedDB (persistent cache)
    const db = await dbPromise;
    const dbData = await db.get(STORE_NAME, url);

    if (dbData) {
        // Found in DB! Update the reactive store so UI can see it.
        imageCache.update(cache => cache.set(url, dbData));
        return;
    }

    // 3. Not found anywhere. Request from the server via WebSocket.
    player._sendCommand(401, { url: url });
}

/**
 * Called by playerStore when a response arrives from the server.
 * It saves the data to the DB and updates the reactive store.
 * @param {string} url The original requested URL.
 * @param {string} base64 The Base64 data URI.
 */
export async function saveImage(url, base64) {
    if (!url || !base64) return;

    // Save to IndexedDB first
    const db = await dbPromise;
    await db.put(STORE_NAME, base64, url);

    // Then update the reactive in-memory store
    imageCache.update(cache => cache.set(url, base64));
}

// Export the readable part of the store for components to subscribe to
export const images = {
    subscribe: imageCache.subscribe
};