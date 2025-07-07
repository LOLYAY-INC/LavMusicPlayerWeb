// src/lib/playlistStore.js
import { v4 as uuidv4 } from 'uuid'; // For unique playlist IDs
import { player } from '$lib/playerStore.js'; // We need to interact with the player
import { get } from 'svelte/store'; // Import 'get' to read store values non-reactively
import { getTrackId } from '$lib/utils/track.js';
import { persistentStore } from '$lib/persistentStore.js';




const LOCAL_STORAGE_KEY = 'svelte-music-playlists';

// Helper function to load playlists from localStorage
function loadPlaylists() {
    if (typeof window === 'undefined') return [];
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}


const createPlaylistStore = () => {

    const initialState = {
        playlists: [], // Will be loaded from localStorage if available
        activePlaylistId: null,
        activeTrackIndex: -1,
        shuffledQueue: [],
    };

    const { subscribe, update, set } = persistentStore('playlist-data', initialState);

    const methods = {
        // --- Private method to save state to localStorage ---
        _save(allPlaylists) {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allPlaylists));
            }
        },

        // --- Playlist Management ---
        createPlaylist: (name) => {
            if (!name || name.trim() === '') return;
            const newPlaylist = {
                id: uuidv4(),
                name: name.trim(),
                tracks: [],
                createdBy: 'User' // You can make this dynamic later
            };
            update(store => {
                const updatedPlaylists = [...store.playlists, newPlaylist];
                methods._save(updatedPlaylists);
                return { ...store, playlists: updatedPlaylists };
            });
        },

        addTrackToPlaylist: (playlistId, track) => {
            update(store => {
                const playlists = store.playlists.map(p => {
                    if (p.id === playlistId) {
                        // Avoid adding duplicate tracks
                        const trackExists = p.tracks.some(t => t.encoded === track.encoded);
                        if (!trackExists) {
                            return { ...p, tracks: [...p.tracks, track] };
                        }
                    }
                    return p;
                });
                methods._save(playlists);
                return { ...store, playlists };
            });
        },

        setShuffle: (isShuffled) => {
            update(store => {
                if (!store.activePlaylistId) {
                    return { ...store, shuffledQueue: [] }; // No active playlist, do nothing
                }

                const activePlaylist = store.playlists.find(p => p.id === store.activePlaylistId);
                if (!activePlaylist) return store;

                if (isShuffled) {
                    const currentTrack = activePlaylist.tracks[store.activeTrackIndex];
                    // Create a shuffled version of the playlist that doesn't include the current song
                    const others = activePlaylist.tracks.filter((_, i) => i !== store.activeTrackIndex);
                    // Fisher-Yates shuffle algorithm
                    for (let i = others.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [others[i], others[j]] = [others[j], others[i]];
                    }
                    // The new queue is the current song, followed by the shuffled rest
                    const newShuffledQueue = [currentTrack, ...others];
                    return { ...store, shuffledQueue: newShuffledQueue, activeTrackIndex: 0 };
                } else {
                    // Revert to the original order
                    const currentTrack = store.shuffledQueue[store.activeTrackIndex];
                    const originalIndex = activePlaylist.tracks.findIndex(t => getTrackId(t) === getTrackId(currentTrack));
                    return { ...store, shuffledQueue: [], activeTrackIndex: originalIndex };
                }
            });
        },

        // --- HEAVILY MODIFIED PLAYBACK LOGIC ---
        playPlaylist: (playlistId, startingIndex = 0) => {
            // We get a non-reactive snapshot of the player state to check shuffle mode.
            const playerState = get(player);

            // We find the playlist we want to play from the full list.
            const playlistToPlay = get(playlistStore).playlists.find(p => p.id === playlistId);
            if (!playlistToPlay || playlistToPlay.tracks.length === 0) {
                console.error("Playlist not found or is empty.");
                return;
            }

            let initialQueue = [];
            let initialIndex = startingIndex;
            let trackToPlay;

            // --- Determine the initial queue and track based on shuffle mode ---
            if (playerState.shuffle) {
                const firstTrack = playlistToPlay.tracks[startingIndex];
                const others = playlistToPlay.tracks.filter((_, i) => i !== startingIndex);

                // Fisher-Yates shuffle
                for (let i = others.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [others[i], others[j]] = [others[j], others[i]];
                }

                initialQueue = [firstTrack, ...others];
                initialIndex = 0; // In a shuffled queue, we always start at the beginning.
                trackToPlay = initialQueue[0];
            } else {
                // Not shuffling, use the original track order.
                initialQueue = []; // An empty array signifies "not shuffled".
                trackToPlay = playlistToPlay.tracks[startingIndex];
            }

            // --- Update the store's state in one single operation ---
            // This is the most important part. We set the active ID HERE.
            update(store => ({
                ...store,
                activePlaylistId: playlistId,
                activeTrackIndex: initialIndex,
                shuffledQueue: initialQueue,
            }));

            // --- Finally, tell the player to start the song ---
            if (trackToPlay) {
                player.playSong(trackToPlay);
            }
        },

        playNext: () => {
            const playerState = get(player);
            const storeState = get(playlistStore);

            const activePlaylist = storeState.playlists.find(p => p.id === storeState.activePlaylistId);
            if (!activePlaylist) return;

            const queue = playerState.shuffle ? storeState.shuffledQueue : activePlaylist.tracks;
            if (!queue || queue.length === 0) return;

            let nextIndex = storeState.activeTrackIndex + 1;

            // If we are at the end, the user's intent by clicking "next" could
            // be to loop if repeat is on. This part is for the MANUAL button click.
            if (nextIndex >= queue.length) {
                if (playerState.repeatMode === 'all') {
                    console.log("Next button pressed at end of playlist, looping to start.");
                    nextIndex = 0; // Loop back to the beginning
                } else {
                    console.log("Next button pressed at end of playlist, repeat is off. Doing nothing.");
                    return; // Do nothing if at the end and not repeating
                }
            }

            const nextTrack = queue[nextIndex];
            update(s => ({ ...s, activeTrackIndex: nextIndex }));
            player.playSong(nextTrack);
        },
        playTrack: (track, indexInQueue) => {
            const playerState = get(player);
            const storeState = get(playlistStore);

            // We need to determine the absolute index in the original playlist if we are shuffled
            const activePlaylist = storeState.playlists.find(p => p.id === storeState.activePlaylistId);
            if (!activePlaylist) return;

            let absoluteIndex = indexInQueue;
            // If shuffling, find the track's original index to be technically correct, though not strictly necessary
            if (playerState.shuffle) {
                const originalIndex = activePlaylist.tracks.findIndex(t => getTrackId(t) === getTrackId(track));
                if(originalIndex !== -1) absoluteIndex = originalIndex;
            }

            // The most important part is updating the active index in our current queue (shuffled or not)
            update(s => ({ ...s, activeTrackIndex: indexInQueue }));

            // Tell the player to play the song
            player.playSong(track);
        },

        playPrevious: () => {
            const playerState = get(player);
            const storeState = get(playlistStore);

            const activePlaylist = storeState.playlists.find(p => p.id === storeState.activePlaylistId);
            if (!activePlaylist) return;

            const queue = playerState.shuffle ? storeState.shuffledQueue : activePlaylist.tracks;
            if (!queue || queue.length === 0) return;

            let prevIndex = storeState.activeTrackIndex - 1;

            if (prevIndex < 0) {
                // If we are at the beginning and repeat is on, loop to the end.
                // Otherwise, just replay the first track.
                prevIndex = playerState.repeatMode === 'all' ? queue.length - 1 : 0;
            }

            const prevTrack = queue[prevIndex];
            update(s => ({ ...s, activeTrackIndex: prevIndex }));
            player.playSong(prevTrack);
        },


        // --- Utility ---
        clearActivePlaylist: () => {
            update(store => ({ ...store, activePlaylistId: null, activeTrackIndex: -1 }));
        },

        headlessUpdatePacket: (data) => {
            update(store => ({ ...store, activePlaylistId: data.playlistId, activeTrackIndex: data.currentIndex }));
        }

    };

    return { subscribe, ...methods };
};

export const playlistStore = createPlaylistStore();

// You need a UUID generator. Install it with: npm install uuid
// And if you're using TypeScript: npm install --save-dev @types/uuid