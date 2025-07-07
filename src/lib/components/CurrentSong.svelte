<!-- src/lib/components/CurrentSong.svelte -->
<script lang="ts">
    import { player } from '$lib/playerStore.js';
    import { getImage, images } from '$lib/imageService.js';
    import Icon from '@iconify/svelte';
    import CachedImage from './CachedImage.svelte';
    $: highQualityUrl = $player.currentSong.artWorkUrl
        ? $player.currentSong.artWorkUrl.replace("w60-h60-l90-rj", "w226-h226-l90-rj")
        : null;

    $: hasSong = !!$player.currentSong.encoded;

</script>
{#if hasSong}
    <div class="current-song-card">
        <CachedImage
                src={highQualityUrl}
                alt="Album art for {$player.currentSong.title}"
        />
        <div class="details">
            <p class="title">{$player.currentSong.title}</p>
            <p class="artist">{$player.currentSong.author}</p>
        </div>
    </div>
{/if}


<style>
    .current-song-card :global(img),
    .current-song-card :global(.placeholder) {
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 6px;
    }

    .current-song-card {
        background-color: var(--bg-element);
        border-radius: 8px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .art-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--bg-element-active);
        color: var(--text-secondary);
    }
    .details {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .title {
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .artist {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
</style>