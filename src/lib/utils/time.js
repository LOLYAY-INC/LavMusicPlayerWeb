// src/lib/utils/time.js

/**
 * Formats a duration from milliseconds into a MM:SS string.
 * @param {number | null | undefined} milliseconds The duration in milliseconds.
 * @returns {string} The formatted time string, e.g., "3:21".
 */
export function formatTime(milliseconds) {
    if (typeof milliseconds !== 'number' || isNaN(milliseconds) || milliseconds < 0) {
        return '0:00';
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // padStart ensures the seconds are always two digits (e.g., "05" instead of "5")
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}