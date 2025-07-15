<!-- src/lib/components/PlayerBar.svelte -->
<script lang="ts">
    import {player} from '$lib/playerStore.js';
    import Icon from "@iconify/svelte";
    import {modalStore} from '$lib/modalStore.js';
    import {formatTime} from '$lib/utils/time.js';
    import CachedImage from "$lib/components/CachedImage.svelte";

    let isSeeking = false;

let localProgress = 0;

let localVolume = $player.volume;
let isChangingVolume = false;
let volumeChangeTimeout: number;

const VOLUME_UPDATE_DELAY = 75;

$: if (!isChangingVolume) {
    localVolume = $player.volume;
}

$: if (!isSeeking) {
    localProgress = $player.progress;
}

function handleVolumeInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    isChangingVolume = true;
    localVolume = Number(e.currentTarget.value);

    clearTimeout(volumeChangeTimeout);


    volumeChangeTimeout = window.setTimeout(() => {
        player.changevolume(localVolume);
    }, VOLUME_UPDATE_DELAY);
}

function handleVolumeChange() {
    clearTimeout(volumeChangeTimeout);
    player.changevolume(localVolume);
    isChangingVolume = false;
}

function handleSeek(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const newProgress = Number(e.currentTarget.value);
    player.seek(newProgress);
    isSeeking = false;
}
function startDrag() {
    isSeeking = true;
    player.startSeeking();
}
function handleAdd(track): any {
    return {
        trackInfo: {
            artWorkUrl: track.artWorkUrl,
            title: track.title,
            author: track.author,
            duration: track.duration
        },
        encoded: track.encoded
    }

}

</script>

<footer class="player-bar">
    <div class="song-info">
        {#if $player.currentSong.artWorkUrl != null}
            <CachedImage
                    class="result-art"
                    src={$player.currentSong.artWorkUrl}
                    alt={$player.currentSong.title}
            />
        {:else}
            <Icon icon="material-symbols-light:music-note" width="48" height="48" />
        {/if}
        <div class="text-details">
            <p class="title">{$player.currentSong.title}</p>
            <p class="artist">{$player.currentSong.author}</p>
        </div>
    </div>

    <div class="player-controls">


        <div class="buttons">
            <button
                    class="control-btn extra-btn"
                    class:active={$player.shuffle}
                    on:click={player.toggleShuffle}
                    title="Shuffle"
                    disabled={$player.headless}
            >
                <Icon icon="mdi:shuffle-variant" />
            </button>
            <button class="control-btn" on:click={player.back} disabled={$player.headless}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" d="M16 18V6l-7 6zM6 6h2v12H6z"/></svg>
            </button>

            <button class="play-btn" on:click={player.playpausebuttonpressed}>
                {#if $player.isPlaying}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                {/if}
            </button>

            <button class="control-btn" on:click={player.next} disabled={$player.headless}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" d="m8 18l7-6l-7-6zM16 6h2v12h-2z"/></svg>
            </button>
            <button
                    class="control-btn extra-btn"
                    class:active={$player.repeatMode !== 'none'}
                    on:click={player.cycleRepeatMode}
                    title="Repeat"
                    disabled={$player.headless}
            >
                {#if $player.repeatMode === 'one'}
                    <Icon icon="mdi:repeat-once" />
                {:else}
                    <Icon icon="mdi:repeat" />
                {/if}
            </button>
        </div>
        <div class="progress-container">
            <span>{formatTime($player.currentTime * 1000)}</span>
            <input
                    disabled={$player.headless}
                    type="range"
                    class="progress-bar"
                    min="0"
                    max="100"
                    step="0.1"


                    bind:value={localProgress}
                    on:mousedown={startDrag}


                    on:change={handleSeek}

                    style="--progress: {localProgress}%;"
            >
            <span>{formatTime($player.duration * 1000)}</span>
        </div>
    </div>

    <div class="extra-controls">
        <button
                class="control-btn"
                title="Add to playlist"
                on:click={() => modalStore.open(handleAdd($player.currentSong))}
                disabled={!$player.currentSong.encoded}
        >
            <Icon icon="material-symbols:add-circle-outline" width="20" height="20" />
        </button>
        <button class="control-btn" on:click={player.requestDeviceList}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M3 9h4V5H3zm0-6v2h4V3zm0 8v2h4v-2zm0 4v2h4v-2zm6-12v2h12V3zm0 4v2h12V7zm0 4v2h12v-2zm0 4v2h12v-2z"/></svg>
        </button>
        <div class="volume-control">
            <button class="control-btn" on:click={player.toggleMute}>
                {#if $player.volume == 0}
                    <Icon icon="material-symbols:volume-off-rounded" width="20" height="20" />
                {:else if $player.volume < 50}
                    <Icon icon="material-symbols:volume-down-rounded" width="20" height="20" />
                {:else}
                    <Icon icon="material-symbols:volume-up-rounded" width="20" height="20" />
                {/if}
            </button>
            <input
                    type="range"
                    class="volume-slider"
                    min="0"
                    max="100"
                    bind:value={localVolume}
                    on:change={handleVolumeChange}
                    on:input={handleVolumeInput}
                    style="--volume: {localVolume}%;"
            >
        </div>
    </div>
</footer>

<style>
    button:disabled, input[type="range"]:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    button:disabled:hover {
        color: var(--text-secondary);
        transform: none;
    }
    .progress-container:hover .progress-bar {
        background-image: linear-gradient(var(--text-interactive, #1db954), var(--text-interactive, #1db954));
    }

    .progress-container:hover .progress-bar::-webkit-slider-thumb {
        opacity: 1;
    }
    .extra-btn {
        font-size: 20px;
    }
    .extra-btn.active {
        color: var(--text-interactive);
    }
    .control-btn:disabled {
        color: var(--bg-element-active);
        cursor: not-allowed;
    }
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 12px;
        width: 12px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        box-shadow: 0 0 2px 0 #555;
        transition: opacity 0.2s ease-in-out;
        opacity: 0;
    }

    .player-bar {
        grid-area: player;
        display: grid;
        grid-template-columns: 1fr 1.5fr 1fr;
        align-items: center;
        padding: 0 16px;
        background-color: var(--bg-player, #181818);
        border-top: 1px solid var(--bg-element, #282828);
        height: var(--player-height, 90px);
    }
    .song-info { display: flex; align-items: center; min-width: 250px; }


    .song-info :global(.result-art) {
        width: 56px;
        height: 56px;
        margin-right: 14px;
        border-radius: 4px;
        object-fit: cover;
        flex-shrink: 0;
    }

    .song-info .title { font-weight: 500; }
    .song-info .artist { font-size: 0.8rem; color: #b3b3b3; }

    .player-controls { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .buttons { display: flex; align-items: center; gap: 16px; }
    .control-btn { background: none; border: none; color: #b3b3b3; cursor: pointer; }

    .play-btn {
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;

        background-color: var(--text-primary, #fff);
        color: var(--bg-black, #000);

        transition: transform 0.1s ease-in-out;
    }

    .play-btn:hover {
        transform: scale(1.1);
    }
    .progress-container { display: flex; align-items: center; gap: 8px; width: 500px; font-size: 0.75rem; color: #a7a7a7; }

    .extra-controls { display: flex; align-items: center; min-width: 250px; justify-content: flex-end; color: #b3b3b3; gap: 16px; }
    .volume-control { display: flex; align-items: center; gap: 8px; }

    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        height: 4px;
        background: #4d4d4d;
        border-radius: 5px;
        background-image: linear-gradient(#fff, #fff);
        background-repeat: no-repeat;
    }
    .progress-bar { width: 100%; background-size: var(--progress, 0%) 100%; }
    .volume-slider { width: 90px; background-size: var(--volume, 75%) 100%; }



    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 12px;
        width: 12px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        box-shadow: 0 0 2px 0 #555;
        transition: background .3s ease-in-out;
        opacity: 1;
    }


    .buttons {
        display: flex;
        align-items: center;
        gap: 24px;
    }

    .control-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        line-height: 0;
        transition: color 0.2s ease-in-out;
    }
    .control-btn:hover {
        color: var(--text-primary);
    }

    .play-btn {
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        background-color: var(--text-primary, #fff);
        color: var(--bg-black, #000);
        transition: transform 0.1s ease-in-out;
    }
    .play-btn:hover {
        transform: scale(1.08);
    }
</style>