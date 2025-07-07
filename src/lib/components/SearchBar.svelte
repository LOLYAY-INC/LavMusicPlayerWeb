<!-- src/lib/components/SearchBar.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { player } from '$lib/playerStore.js';
    import { playlistStore } from '$lib/playlistStore.js';
    import { modalStore } from '$lib/modalStore.js';
    import Icon from '@iconify/svelte';
    import CachedImage from './CachedImage.svelte';

    let searchQuery = '';
    let isFocused = false;
    let debounceTimeout: number;
    let container: HTMLElement;

    // Debounce function to prevent spamming the server
    const handleInput = () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = window.setTimeout(() => {
            player.search(searchQuery);
        }, 300);
    };

    const playTrack = (track: any) => {
        playlistStore.clearActivePlaylist();
        player.playSong(track);
        searchQuery = '';
        isFocused = false;
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (container && !container.contains(event.target as Node)) {
            isFocused = false;
            player.clearSearchResults();
        }
    };

    onMount(() => {
        window.addEventListener('click', handleClickOutside);
    });

    onDestroy(() => {
        window.removeEventListener('click', handleClickOutside);
    });
</script>

<div class="search-container" bind:this={container}>
    <div class="input-wrapper">
        <svg
                class="search-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
        ><path
                fill="currentColor"
                d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"
        /></svg
        >
        <input
                type="text"
                placeholder="Search..."
                bind:value={searchQuery}
                on:input={handleInput}
                on:focus={() => (isFocused = true)}
                disabled={$player.headless}
        />
    </div>

    {#if isFocused && $player.searchResults.length > 0}
        <div class="results-dropdown">
            <ul>
                {#each $player.searchResults.slice(0, 6) as track (track.encoded)}
                    <li>
                        <div class="track-info" on:click={() => playTrack(track)}>
                            <CachedImage
                                    class="result-art"
                                    src={track.trackInfo.artWorkUrl}
                                    alt={track.trackInfo.title}
                            />
                            <div class="result-text">
                                <p class="title">{track.trackInfo.title}</p>
                                <p class="author">{track.trackInfo.author}</p>
                            </div>
                        </div>
                        <button
                                class="add-btn"
                                title="Add to playlist"
                                on:click={() => modalStore.open(track)}
                        >
                            <Icon icon="material-symbols:add" />
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>

<style>
    .search-container {
        position: relative;
        width: 100%;
        max-width: 360px;
    }

    .input-wrapper {
        position: relative;
        width: 100%;
    }

    .add-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .add-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
    }

    .search-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        font-size: 20px;
        pointer-events: none;
        z-index: 2;
    }

    input {
        width: 100%;
        height: 40px;
        padding: 0 16px 0 48px;
        border-radius: 500px;
        background-color: #242424;
        color: #fff;
        font-size: 0.875rem;
        border: 1px solid #404040;
        outline: none;
        transition: all 0.2s ease-in-out;
        font-family: inherit;
    }

    input:hover {
        border-color: #535353;
        box-shadow: 0 0 0 1px #535353;
    }

    input:focus {
        border-color: var(--text-primary);
        box-shadow: 0 0 0 1px var(--text-primary);
    }

    .results-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        width: 100%;
        background-color: var(--bg-element-hover);
        border-radius: 6px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        z-index: 100;
        max-height: 400px;
        overflow-y: auto;
    }
    ul {
        list-style: none;
        padding: 8px;
        margin: 0;
    }
    li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    li:hover {
        background-color: var(--bg-element-active);
    }

    .track-info {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        min-width: 0;
        flex: 1;
        overflow: hidden;
    }

    li :global(.result-art) {
        width: 40px;
        height: 40px;
        border-radius: 2px;
        flex-shrink: 0;
    }

    .result-text {
        overflow: hidden;
    }

    .result-text .title {
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .result-text .author {
        font-size: 0.8rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>