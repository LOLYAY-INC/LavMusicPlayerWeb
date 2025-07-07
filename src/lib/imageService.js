// src/lib/imageService.js
import { openDB } from 'idb';
import { writable, get } from 'svelte/store';
import { player } from './playerStore.js';

const DB_NAME = 'image-cache-db';
const STORE_NAME = 'images';
const DB_VERSION = 1;

// Maps: originalUrl -> base64 string
const imageCache = writable(new Map());

// --- Initialize the Database ---
const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
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

    let currentCache;
    imageCache.subscribe(c => currentCache = c)();
    if (currentCache.has(url)) {
        return;
    }

    const db = await dbPromise;
    const dbData = await db.get(STORE_NAME, url);

    if (dbData) {
        imageCache.update(cache => cache.set(url, dbData));
        return;
    }

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

    const db = await dbPromise;
    await db.put(STORE_NAME, base64, url);

    imageCache.update(cache => cache.set(url, base64));
}

export const images = {
    subscribe: imageCache.subscribe
};