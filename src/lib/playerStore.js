// src/lib/playerStore.js
import { get } from 'svelte/store';
import { playlistStore } from './playlistStore.js';
import { saveImage } from './imageService.js';
import { durationStore } from './durationStore.js';
import { getTrackId } from './utils/track.js';
import { persistentStore } from '$lib/persistentStore.js';

const defaultSong = {
    title: 'No song playing',
    author: '---',
    artWorkUrl: null,
    encoded: null,
};

window.getPlayer = () => {
    const playerState = get(player);
    console.log('playerState', playerState);
    return playerState;
}

window.getPlaylist = () => {
    const playerState = get(playlistStore);
    console.log('playerState', playerState);
    return playerState;
}

const createPlayerStore = () => {

    const handleBeforeUnload = (event) => {
        const playerState = get(player);
        const playlistState = get(playlistStore);
        if (playlistState.activePlaylistId && !playerState.headless) {
            console.log("Tab closing with active playlist. Sending beacon to start headless mode.");
            const activePlaylist = playlistState.playlists.find(p => p.id === playlistState.activePlaylistId);
            if (!activePlaylist || activePlaylist.tracks.length === 0) return;
            const repeatingType = playerState.shuffle ? 'SHUFFLE' : (playerState.repeatMode === 'one' ? 'REPEAT_ONE' : 'REPEAT_ALL');
            const packet = {
                opcode: 901,
                data: {
                    tracks: activePlaylist.tracks,
                    repeatingType: repeatingType,
                    playlistId: activePlaylist.id,
                    currentIndex: playlistState.activeTrackIndex
                }
            };
            const url = 'http://localhost/start-headless-on-close';
            const blob = new Blob([JSON.stringify(packet)], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
        }
    };

    const initialState = {
        volume: 75,
        lastVolume: 75,
        shuffle: false,
        repeatMode: 'none',
        ws: null,
        isConnected: false,
        currentSong: defaultSong,
        isPlaying: false,
        progress: 0,
        currentTime: 0,
        duration: 0,
        searchResults: [],
        isSeeking: false,
        headless: false,
        lyrics: {
            content: null,
            source: null,
            loading: false,
            error: null,
        },
    };

    const { subscribe, update } = persistentStore('player-state', initialState);

    update(store => ({
        ...store,
        ws: null,
        isConnected: false,
        isPlaying: false,
        isSeeking: false,
        progress: 0,
        currentTime: 0,
        duration: 0,
        headless: false,
        lyrics: { content: null, source: null, loading: false, error: null },
    }));

    const handleMessage = (event) => {
        let data;
        try {
            data = JSON.parse(event.data);
        } catch (e) {
            console.error("Failed to parse WebSocket message:", event.data, e);
            return;
        }

        switch (data.opcode) {
            case -1:
                console.error(`Command failed! Original command opcode: ${data.packetOpcode}`);
                break;
            case -2:
                if (data.packetOpcode === 118) {
                    console.log('Seek command acknowledged by server. Resuming sync.');
                    setTimeout(methods.stopSeeking, 2000);
                }
                break;

            case 200:
                update(store => {
                    // Create a mutable copy of the current state.
                    const updatedState = { ...store };


                    if (data.playing !== undefined && data.paused !== undefined) {
                        updatedState.isPlaying = data.playing && !data.paused;
                    }
                    if (data.volume !== undefined) {
                        updatedState.volume = data.volume;
                    }
                    if (data.headless !== undefined) {
                        updatedState.headless = data.headless;
                    }

                    // If the server provides a new, valid track, we update our state.
                    if (data.current && data.current.trackInfo) {
                        const newSong = { ...data.current.trackInfo, encoded: data.current.encoded };
                        const newSongId = (newSong.author || '') + (newSong.title || '');
                        const oldSongId = (store.currentSong.author || '') + (store.currentSong.title || '');

                        if (newSongId !== oldSongId) {
                            console.log(`New song detected: ${newSong.title}`);
                            updatedState.currentSong = newSong;
                            // Reset progress and lyrics only when the song actually changes.
                            updatedState.progress = 0;
                            updatedState.currentTime = 0;
                            updatedState.duration = 0;
                            updatedState.lyrics = { content: null, source: null, loading: false, error: null };
                        }
                    }


                    return updatedState;
                });
                break;

            case 801:
                update(store => {
                    const { content, source } = data.lyrics;
                    return { ...store, lyrics: content && source
                            ? { content, source, loading: false, error: null }
                            : { content: null, source: null, loading: false, error: 'No lyrics found for this track.' }
                    };
                });
                break;

            case 202:
                if (get(player).isSeeking) return;
                // console.log("SYNC:  " + data.position + " / " + data.duration);
                update(store => {
                    if (data.duration <= 0) {
                        return { ...store, currentTime: data.position / 1000, duration: 0, progress: 0 };
                    }
                    return {
                        ...store,
                        currentTime: data.position / 1000,
                        duration: data.duration / 1000,
                        progress: (data.position / data.duration) * 100,
                    };
                });
                break;

            case 111:
                const newResults = data.results.map(item => item.track);
                update(store => ({ ...store, searchResults: newResults }));
                break;

            case 903:
                playlistStore.headlessUpdatePacket(data.data);
                break;

            case 201: // Track just ended, decide what to do next.
                const currentPlayerState = get(player);
                if (currentPlayerState.headless) return; // Headless mode handles its own logic

                // If repeat-one is active, it takes priority. Replay the current song.
                if (currentPlayerState.repeatMode === 'one') {
                    console.log('Track ended, repeating current song due to repeat-one mode.');

                    // Reconstruct the track object from the flattened currentSong state object
                    const { encoded, ...trackInfo } = currentPlayerState.currentSong;
                    const trackToReplay = { trackInfo, encoded };

                    methods.playSong(trackToReplay);
                } else {
                    // Otherwise, delegate to the playlist store to handle 'repeat-all' or 'none' modes.
                    console.log('Track ended, asking playlistStore for next track.');
                    playlistStore.playNext();
                }
                break;

            case 401:
                if (data.url && data.base64) {
                    saveImage(data.url, data.base64);
                }
                break;

            case 291:
                if (data.track && data.duration) {
                    const trackId = getTrackId(data.track);
                    durationStore.setDuration(trackId, data.duration);
                }
                break;

            default:
                console.warn('Received unknown opcode from server:', data.opcode);
                break;
        }
    };

    const methods = {

        init: (url = 'ws://localhost:3272/') => {
            if (typeof window !== 'undefined') {
                window.addEventListener('beforeunload', handleBeforeUnload);
            }
            const ws = new WebSocket(url);
            ws.onopen = () => {
                console.log('Connected to player!');
                update(s => ({ ...s, ws, isConnected: true }));
                methods._sendCommand(101);
                methods.changevolume(getPlayer().volume);
            };
            ws.onmessage = handleMessage;
            ws.onclose = () => {
                if (typeof window !== 'undefined') {
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                }
                playlistStore.clearActivePlaylist()
                console.log('Disconnected from player.');
                update(s => ({ ...s, ws: null, isConnected: false, isPlaying: false, currentSong: defaultSong }));
            };
            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                update(s => ({ ...s, ws: null, isConnected: false, isPlaying: false, currentSong: defaultSong }));
            };
        },


        // --- REFACTORED THIS METHOD FOR CLEANLINESS ---
        requestLyrics: () => {
            update(store => {
                if (!store.currentSong.encoded || store.lyrics.loading) {
                    return store;
                }
                const newLyricsState = { ...store.lyrics, loading: true, content: null, source: null, error: null };

                // Use a cleaner way to reconstruct the track object that the server expects
                const { encoded, ...trackInfo } = store.currentSong;
                const trackToSend = { trackInfo, encoded };

                methods._sendCommand(801, { track: trackToSend });
                return { ...store, lyrics: newLyricsState };
            });
        },

        startSeeking: () => { update(store => ({ ...store, isSeeking: true })); },
        stopSeeking: () => { update(store => ({ ...store, isSeeking: false })); },

        _sendCommand: (opc, payload = {}) => {
            update(store => {
                if (store.ws && store.isConnected) {
                    store.ws.send(JSON.stringify({ opcode: opc, ...payload }));
                } else {
                    console.warn('Cannot send command, WebSocket is not connected.');
                }
                return store;
            });
        },

        playpausebuttonpressed: () => {
            update(store => {
                if (!store.currentSong.encoded) return store;
                const newIsPlayingState = !store.isPlaying;
                const commandToSend = newIsPlayingState ? 1132 : 1131;
                methods._sendCommand(commandToSend);
                return { ...store, isPlaying: newIsPlayingState };
            });
        },

        toggleShuffle: () => {
            update(store => {
                const newShuffleState = !store.shuffle;
                playlistStore.setShuffle(newShuffleState);
                return { ...store, shuffle: newShuffleState };
            });
        },

        cycleRepeatMode: () => {
            update(store => {
                let newMode;
                if (store.repeatMode === 'none') newMode = 'all';
                else if (store.repeatMode === 'all') newMode = 'one';
                else newMode = 'none';
                return { ...store, repeatMode: newMode };
            });
        },

        next: () => { playlistStore.playNext(); },
        back: () => { playlistStore.playPrevious(); },

        playSong: (track) => {
            methods._sendCommand(112, { track: track });
            methods.clearSearchResults();
        },

        stopHeadless: () => {
            methods._sendCommand(902);
        },

        playTrack: (track, indexInPlaylist) => {
            methods.playSong(track);
        },

        seek: (progressPercent) => {
            update(store => {
                if (!store.currentSong.encoded || store.duration <= 0) return store;
                const seekPositionMs = (store.duration * 1000) * (progressPercent / 100);
                methods._sendCommand(118, { seek: Math.round(seekPositionMs) });
                const newCurrentTime = store.duration * (progressPercent / 100);
                return { ...store, progress: progressPercent, currentTime: newCurrentTime };
            });
        },

        search: (query) => {
            if (query && query.trim() !== '') {
                methods._sendCommand(111, { query: query.trim() });
            } else {
                update(store => ({ ...store, searchResults: [] }));
            }
        },

        clearSearchResults: () => { update(store => ({ ...store, searchResults: [] })); },

        changevolume: (newVolume) => {
            update(s => ({ ...s, volume: newVolume, lastVolume: newVolume > 0 ? newVolume : s.lastVolume }));
            methods._sendCommand(117, { volume: newVolume });
        },

        toggleMute: () => {
            update(store => {
                const newVolume = store.volume > 0 ? 0 : store.lastVolume;
                methods._sendCommand(117, { volume: newVolume });
                return { ...store, volume: newVolume };
            });
        },
    };

    return { subscribe, ...methods };
};

export const player = createPlayerStore();