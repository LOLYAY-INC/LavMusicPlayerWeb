<!-- src/lib/components/PlaylistList.svelte -->
<script lang="ts">
    import { playlistStore } from '$lib/playlistStore.js';
    import { player } from '$lib/playerStore.js';
    import Icon from '@iconify/svelte';
    import CachedImage from './CachedImage.svelte';

    function createNewPlaylist() {
        const name = prompt('Enter a name for your new playlist:');
        if (name) {
            playlistStore.createPlaylist(name);
        }
    }
</script>

<div class="playlist-container">
    <header>
        <button class="create-btn" on:click={createNewPlaylist}>
            <Icon icon="material-symbols:add" width="20" height="20" />
            <span>New Playlist</span>
        </button>
    </header>

    <div class="list">
        {#each $playlistStore.playlists as playlist (playlist.id)}
            <div class="playlist-item" on:click={() => !$player.headless && playlistStore.playPlaylist(playlist.id)}
                 class:disabled={$player.headless}
            >
                <div class="art-grid">
                    {#each Array(4) as _, i}
                        <CachedImage src={playlist.tracks[i]?.trackInfo.artWorkUrl} />
                    {/each}
                </div>
                <div class="text-details">
                    <p class="name">{playlist.name}</p>
                    <p class="details">Playlist</p>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>

    .playlist-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .playlist-item.disabled:hover {
        background-color: transparent;
    }
    .playlist-container {
        background-color: var(--bg-element, #282828);
        border-radius: 8px;
        padding: 8px;
        overflow-y: auto;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }

    header {
        padding: 0 8px 8px 8px;
    }

    .art-grid :global(img),
    .art-grid :global(.placeholder) {
        width: 100%;
        height: 100%;
    }

    .create-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 6px;
        transition: color 0.2s;
    }

    .create-btn:hover {
        color: var(--text-primary);
    }

    .list {
        display: flex;
        flex-direction: column;
    }

    .playlist-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s ease-in-out;
    }

    .playlist-item:hover {
        background-color: var(--bg-element-active, #3a3a3a);
    }

    .art-grid {
        width: 48px;
        height: 48px;
        min-width: 48px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        border-radius: 4px;
        overflow: hidden;
        background-color: #333;
    }

    .art-item {
        background-color: #3a3a3a;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
    }

    .art-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .text-details {
        overflow: hidden;
    }

    .name {
        color: var(--text-primary);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .details {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
</style>