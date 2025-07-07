<!-- src/lib/components/AddTrackToPlaylistModal.svelte -->
<script lang="ts">
    import { modalStore } from '$lib/modalStore.js';
    import { playlistStore } from '$lib/playlistStore.js';

    function handleAddToPlaylist(playlistId: string) {
        if ($modalStore.trackToAdd) {
            playlistStore.addTrackToPlaylist(playlistId, $modalStore.trackToAdd);
        }
        modalStore.close();
    }
</script>

{#if $modalStore.isOpen}
    <div class="scrim" on:click={modalStore.close}>
        <div class="modal-content" on:click|stopPropagation>
            <h2>Add to playlist</h2>
            <ul>
                {#each $playlistStore.playlists as playlist (playlist.id)}
                    <li on:click={() => handleAddToPlaylist(playlist.id)}>
                        {playlist.name}
                    </li>
                {/each}
            </ul>
        </div>
    </div>
{/if}

<style>
    .scrim {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    .modal-content {
        background-color: var(--bg-element);
        padding: 24px;
        border-radius: 8px;
        width: 100%;
        max-width: 320px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h2 {
        margin-top: 0;
        text-align: center;
    }
    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    li {
        padding: 12px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    li:hover {
        background-color: var(--bg-element-active);
    }
</style>