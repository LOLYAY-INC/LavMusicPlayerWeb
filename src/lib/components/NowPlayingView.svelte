<!-- src/lib/components/NowPlayingView.svelte -->
<script lang="ts">
    import { player } from '$lib/playerStore.js';
    import { playlistStore } from '$lib/playlistStore.js';
    import CachedImage from './CachedImage.svelte';
    import { formatTime } from '$lib/utils/time.js';
    import { durationStore } from '$lib/durationStore.js';
    import { getTrackId } from '$lib/utils/track.js';

    let activeTab = 'up-next'; // 'up-next' or 'lyrics'

    $: highQualityUrl = $player.currentSong.artWorkUrl
        ? $player.currentSong.artWorkUrl.replace('w60-h60-l90-rj', 'w544-h544-l90-rj')
        : null;

    $: activePlaylist = $playlistStore.playlists.find((p) => p.id === $playlistStore.activePlaylistId);
    $: queue = $player.shuffle ? $playlistStore.shuffledQueue : activePlaylist?.tracks;

    $: displayQueue = (() => {
        if (!queue || queue.length === 0) return [];

        const currentIndex = $playlistStore.activeTrackIndex;
        const queueLength = queue.length;
        const windowSize = 5;
        let items = [];
        const addedIndices = new Set();

        for (let i = -windowSize; i <= windowSize; i++) {
            let trackIndex = currentIndex + i;

            if ($player.repeatMode === 'all') {
                trackIndex = (trackIndex % queueLength + queueLength) % queueLength;
            }

            if (trackIndex >= 0 && trackIndex < queueLength && !addedIndices.has(trackIndex)) {
                const track = queue[trackIndex];
                const isCurrentTrack = trackIndex === currentIndex;

                items.push({
                    ...track,
                    isCurrent: isCurrentTrack,
                    queueIndex: trackIndex
                });
                addedIndices.add(trackIndex);
            }
        }
        return items;
    })();

    function selectTab(tabName: 'up-next' | 'lyrics') {
        activeTab = tabName;
        if (tabName === 'lyrics' && !$player.lyrics.content && !$player.lyrics.loading) {
            player.requestLyrics();
        }
    }
</script>

<div class="now-playing-grid">
    <div class="album-art-container">
        <CachedImage
                src={highQualityUrl}
                alt={$player.currentSong.title}
                class="main-album-art"
                placeholderIcon="material-symbols-light:music-note"
        />
    </div>

    <aside class="queue-sidebar">
        <div class="tabs">
            <button class:active={activeTab === 'up-next'} on:click={() => (activeTab = 'up-next')}>
                Up Next
            </button>
            <button class:active={activeTab === 'lyrics'} on:click={() => selectTab('lyrics')}>
                Lyrics
            </button>
        </div>

        <div class="queue-content">
            {#if activeTab === 'up-next'}
                {#if activePlaylist}
                    <div class="playlist-info">
                        <p>Playing from Playlist</p>
                        <h3>{activePlaylist.name}</h3>
                        {#if $player.headless}
                            <p>Playing in headless mode.</p>
                            <!-- 1. Apply the new class to the button -->
                            <button class="btn-primary" on:click={() => player.stopHeadless()}>
                                Stop Headless Mode
                            </button>
                        {/if}
                    </div>
                    <ul class="track-list">
                        {#each displayQueue as track, i (track.encoded + i)}
                            {@const trackId = getTrackId(track)}
                            <li class="track-item" class:current={track.isCurrent}>
                                <button
                                        type="button"
                                        class="track-button"
                                        on:click={() => playlistStore.playTrack(track, track.queueIndex)}
                                        disabled={$player.headless}
                                >
                                    <CachedImage
                                            class="track-art"
                                            src={track.trackInfo.artWorkUrl}
                                            alt={track.trackInfo.title}
                                    />
                                    <div class="track-details">
                                        <p class="title">{track.trackInfo.title}</p>
                                        <p class="artist">{track.trackInfo.author}</p>
                                    </div>
                                    <span class="duration">
										{#if $durationStore.has(trackId)}
											{formatTime($durationStore.get(trackId))}
										{/if}
									</span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="no-queue">No active playlist.</p>
                {/if}
            {:else if activeTab === 'lyrics'}
                <div class="lyrics-container">
                    {#if $player.lyrics.loading}
                        <p class="lyrics-message">Loading lyrics...</p>
                    {:else if $player.lyrics.content}
                        <pre class="lyrics-text">{$player.lyrics.content}</pre>
                        <p class="lyrics-source">Source: {$player.lyrics.source}</p>
                    {:else if $player.lyrics.error}
                        <p class="lyrics-message">{$player.lyrics.error}</p>
                    {:else if !$player.currentSong.encoded}
                        <p class="lyrics-message">Play a song to see its lyrics.</p>
                    {:else}
                        <p class="lyrics-message">Lyrics will appear here.</p>
                    {/if}
                </div>
            {/if}
        </div>
    </aside>
</div>

<style>
    .now-playing-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 350px;
        height: 100%;
        gap: 32px;
        padding: 32px;
        overflow: hidden;
    }

    .album-art-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 0;
    }

    .album-art-container :global(.main-album-art) {
        object-fit: contain;
        max-width: 100%;
        max-height: 100%;
        border-radius: 12px;
    }

    .queue-sidebar {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-width: 0;
    }

    .tabs {
        display: flex;
        gap: 16px;
        border-bottom: 1px solid var(--bg-element);
        margin-bottom: 16px;
        flex-shrink: 0;
    }

    .tabs button {
        background: none;
        border: none;
        color: var(--text-secondary);
        padding: 16px 0;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        position: relative;
    }

    .tabs button:not([disabled]):hover {
        color: var(--text-primary);
    }

    .tabs button.active {
        color: var(--text-primary);
    }

    .tabs button.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background-color: var(--text-interactive);
    }

    button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .btn-primary {
        all: unset;
        box-sizing: border-box;
        display: inline-block;
        margin-top: 16px;
        padding: 8px 20px;
        background-color: var(--bg-black, #121212);
        color: var(--text-interactive, #1db954);
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: 500px;
        cursor: pointer;
        transition: transform 0.1s ease-out, background-color 0.1s;
    }

    .btn-primary:hover:not(:disabled) {
        transform: scale(1.03);
        background-color: rgba(29, 185, 84, 0.1);
        color: var(--text-interactive, #1db954);
    }

    .btn-primary:active:not(:disabled) {
        transform: scale(0.98);
    }

    .btn-primary:focus-visible {
        outline: 2px solid var(--text-interactive);
        outline-offset: 2px;
    }


    .queue-content {
        flex-grow: 1;
        overflow-y: auto;
    }

    .playlist-info {
        margin-bottom: 24px;
    }

    .playlist-info p {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }

    .playlist-info h3 {
        color: var(--text-primary);
        font-weight: 600;
        margin-top: 4px;
    }

    .track-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .track-item {
        /* container for the button */
    }

    .track-item.current .title {
        color: var(--text-interactive);
    }

    .track-item.current .track-button {
        background-color: rgba(255, 255, 255, 0.05);
    }

    .track-button {
        all: unset;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        width: 100%;
        gap: 12px;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        text-align: left;
    }

    .track-button:hover:not(:disabled) {
        background-color: var(--bg-element-hover);
    }

    .track-button:focus-visible {
        outline: 2px solid var(--text-interactive);
        outline-offset: -2px;
    }

    .duration {
        margin-left: auto;
        padding-left: 16px;
        font-size: 0.875rem;
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .track-button :global(.track-art) {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        flex-shrink: 0;
    }

    .track-button .track-details {
        overflow: hidden;
    }

    .track-button .title {
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .track-button .artist {
        font-size: 0.8rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .no-queue {
        color: var(--text-secondary);
    }

    .lyrics-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .lyrics-text {
        flex-grow: 1;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
        line-height: 1.7;
        margin: 0;
        font-family: inherit;
        color: var(--text-secondary);
        font-size: 1rem;
    }

    .lyrics-source {
        flex-shrink: 0;
        font-size: 0.75rem;
        color: var(--text-secondary);
        opacity: 0.7;
        text-align: right;
        margin-top: auto;
        padding-top: 16px;
    }

    .lyrics-message {
        text-align: center;
        color: var(--text-secondary);
        margin-top: 40px;
    }
</style>