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


    $: {

        if (src) {
            getImage(src);
        }



        const unsubscribe = images.subscribe(cache => {
            if (src && cache.has(src)) {
                imageData = cache.get(src);
            } else {
                imageData = null;
            }
        });



    }
</script>

{#if imageData}

    <img src={imageData} {alt} class={$$props.class} />
{:else}

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
        object-fit: cover;
    }
</style>