<!-- src/lib/components/PlaylistList.svelte -->
<script lang="ts">
    import { playlistStore } from '$lib/playlistStore.js';
    import { player } from '$lib/playerStore.js';
    import Icon from '@iconify/svelte';
    import CachedImage from './CachedImage.svelte';

    function createNewPlaylist() {
        // Use a simple prompt to get the new playlist name
        const name = prompt('Enter a name for your new playlist:');
        if (name) {
            playlistStore.createPlaylist(name);
        }
    }
</script>

<div class="playlist-container">
    <header>
        <!-- 3. Translate the button text -->
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
                        <!-- Replace the old logic with the new component -->
                        <CachedImage src={playlist.tracks[i]?.trackInfo.artWorkUrl} />
                    {/each}
                </div>
                <div class="text-details">
                    <p class="name">{playlist.name}</p>
                    <p class="details">Playlist</p>
                </div>
                <!-- ... text-details ... -->
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
        background-color: transparent; /* Disable hover effect */
    }
    /* 2. Apply new styling for the component */
    .playlist-container {
        background-color: var(--bg-element, #282828);
        border-radius: 8px;
        padding: 8px;
        overflow-y: auto; /* Allow scrolling if list is long */
        flex-grow: 1; /* Make it take available space */
        display: flex;
        flex-direction: column;
    }

    header {
        padding: 0 8px 8px 8px; /* Add some padding around the button */
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
        gap: 4px; /* Small gap between playlist items */
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
        /* This is a 48x48 pixel square now */
        width: 48px;
        height: 48px;
        min-width: 48px; /* Prevent it from shrinking */
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        border-radius: 4px;
        overflow: hidden; /* This clips the corners of the inner images */
        background-color: #333;
    }

    .art-item {
        background-color: #3a3a3a; /* Darker placeholder background */
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
        /* This prevents text from overflowing and breaking layout */
        overflow: hidden;
    }

    .name {
        color: var(--text-primary);
        font-weight: 500;
        /* Ellipsis for long playlist names */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .details {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
</style>