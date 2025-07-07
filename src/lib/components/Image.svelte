<!-- src/lib/components/Image.svelte -->
<script lang="ts">
    import { getImage, images } from '$lib/imageService.js';
    import Icon from '@iconify/svelte';
    export let src: string | null;
    export let alt = '';
    export let icon = 'material-symbols-light:music-note';

    let data = null;

    $: if (src) {
        getImage(src);
    }

    $: if (src && $images.has(src)) {
        data = $images.get(src);
    } else {
        data = null;
    }
</script>

{#if data}
    <img {src} {alt} {...$$props} />
{:else}
    <div class="placeholder" {...$$props}>
        <Icon {icon} />
    </div>
{/if}

<style>
    .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--bg-element);
        color: var(--text-secondary);
    }
    img {
        object-fit: cover;
    }
</style>