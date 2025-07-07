
import { v4 as uuidv4 } from 'uuid'; 
import { player } from '$lib/playerStore.js'; 
import { get } from 'svelte/store'; 
import { getTrackId } from '$lib/utils/track.js';
import { persistentStore } from '$lib/persistentStore.js';




const LOCAL_STORAGE_KEY = 'svelte-music-playlists';


function loadPlaylists() {
    if (typeof window === 'undefined') return [];
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}


const createPlaylistStore = () => {

    const initialState = {
        playlists: [], 
        activePlaylistId: null,
        activeTrackIndex: -1,
        shuffledQueue: [],
    };

    const { subscribe, update, set } = persistentStore('playlist-data', initialState);

    const methods = {
        
        _save(allPlaylists) {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allPlaylists));
            }
        },

        
        createPlaylist: (name) => {
            if (!name || name.trim() === '') return;
            const newPlaylist = {
                id: uuidv4(),
                name: name.trim(),
                tracks: [],
                createdBy: 'User' 
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
                    return { ...store, shuffledQueue: [] }; 
                }

                const activePlaylist = store.playlists.find(p => p.id === store.activePlaylistId);
                if (!activePlaylist) return store;

                if (isShuffled) {
                    const currentTrack = activePlaylist.tracks[store.activeTrackIndex];
                    
                    const others = activePlaylist.tracks.filter((_, i) => i !== store.activeTrackIndex);
                    
                    for (let i = others.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [others[i], others[j]] = [others[j], others[i]];
                    }
                    
                    const newShuffledQueue = [currentTrack, ...others];
                    return { ...store, shuffledQueue: newShuffledQueue, activeTrackIndex: 0 };
                } else {
                    
                    const currentTrack = store.shuffledQueue[store.activeTrackIndex];
                    const originalIndex = activePlaylist.tracks.findIndex(t => getTrackId(t) === getTrackId(currentTrack));
                    return { ...store, shuffledQueue: [], activeTrackIndex: originalIndex };
                }
            });
        },

        
        playPlaylist: (playlistId, startingIndex = 0) => {
            
            const playerState = get(player);

            
            const playlistToPlay = get(playlistStore).playlists.find(p => p.id === playlistId);
            if (!playlistToPlay || playlistToPlay.tracks.length === 0) {
                console.error("Playlist not found or is empty.");
                return;
            }

            let initialQueue = [];
            let initialIndex = startingIndex;
            let trackToPlay;

            
            if (playerState.shuffle) {
                const firstTrack = playlistToPlay.tracks[startingIndex];
                const others = playlistToPlay.tracks.filter((_, i) => i !== startingIndex);

                
                for (let i = others.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [others[i], others[j]] = [others[j], others[i]];
                }

                initialQueue = [firstTrack, ...others];
                initialIndex = 0; 
                trackToPlay = initialQueue[0];
            } else {
                
                initialQueue = []; 
                trackToPlay = playlistToPlay.tracks[startingIndex];
            }

            
            
            update(store => ({
                ...store,
                activePlaylistId: playlistId,
                activeTrackIndex: initialIndex,
                shuffledQueue: initialQueue,
            }));

            
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

            
            
            if (nextIndex >= queue.length) {
                if (playerState.repeatMode === 'all') {
                    console.log("Next button pressed at end of playlist, looping to start.");
                    nextIndex = 0; 
                } else {
                    console.log("Next button pressed at end of playlist, repeat is off. Doing nothing.");
                    return; 
                }
            }

            const nextTrack = queue[nextIndex];
            update(s => ({ ...s, activeTrackIndex: nextIndex }));
            player.playSong(nextTrack);
        },
        playTrack: (track, indexInQueue) => {
            const playerState = get(player);
            const storeState = get(playlistStore);

            
            const activePlaylist = storeState.playlists.find(p => p.id === storeState.activePlaylistId);
            if (!activePlaylist) return;

            let absoluteIndex = indexInQueue;
            
            if (playerState.shuffle) {
                const originalIndex = activePlaylist.tracks.findIndex(t => getTrackId(t) === getTrackId(track));
                if(originalIndex !== -1) absoluteIndex = originalIndex;
            }

            
            update(s => ({ ...s, activeTrackIndex: indexInQueue }));

            
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
                
                
                prevIndex = playerState.repeatMode === 'all' ? queue.length - 1 : 0;
            }

            const prevTrack = queue[prevIndex];
            update(s => ({ ...s, activeTrackIndex: prevIndex }));
            player.playSong(prevTrack);
        },


        
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


