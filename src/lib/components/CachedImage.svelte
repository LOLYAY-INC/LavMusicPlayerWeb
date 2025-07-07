<!-- src/lib/components/CachedImage.svelte -->
<script lang="ts">
    import { getImage, images } from '$lib/imageService.js';
    import Icon from '@iconify/svelte';

    /** The URL of the image to display. Can be low or high quality. */
    export let src: string | null | undefined = null;
    /** Alt text for the image. */
    export let alt = '';
    /** The icon to show as a placeholder. */
    export let placeholderIcon = 'material-symbols-light:music-note';

    let imageData: string | null = null;

    // This reactive block handles fetching and subscribing.
    $: {
        // 1. Trigger the fetch/cache-check when the src prop changes.
        if (src) {
            getImage(src);
        }

        // 2. Subscribe to the global image cache.
        // This makes our component update automatically when the image arrives.
        const unsubscribe = images.subscribe(cache => {
            if (src && cache.has(src)) {
                imageData = cache.get(src);
            } else {
                imageData = null;
            }
        });

        // This is not strictly required by Svelte 4 but is good practice for cleanup.
        // return unsubscribe;
    }
</script>

{#if imageData}
    <!-- Use a normal img tag with the Base64 data -->
    <img src={imageData} {alt} class={$$props.class} />
{:else}
    <!-- Show a placeholder if no data is available yet -->
    <div class="placeholder {$$props.class || ''}">
        <Icon icon={placeholderIcon} />
    </div>
{/if}

<style>
    .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #333;
        color: var(--text-secondary);
        width: 100%;
        height: 100%;
    }
    img {
        width: 100%;
        height: 100%;
        object-fit: cover; /* Ensures image fills the container without distortion */
    }
</style>