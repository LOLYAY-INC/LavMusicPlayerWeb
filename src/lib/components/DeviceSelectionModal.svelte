<!-- src/lib/components/DeviceSelectionModal.svelte -->
<script lang="ts">
    import {player} from '$lib/playerStore.js';

    function handleSelectDevice(device: string) {
        player.selectAudioDevice(device);
    }

    function stripPrefix(deviceName: string): string {
        const prefix = 'OpenAL Soft on ';
        if (deviceName.startsWith(prefix)) {
            return deviceName.substring(prefix.length);
        }
        return deviceName;
    }
</script>

{#if $player.isDeviceModalOpen}
    <div class="scrim" on:click={player.closeDeviceModal}>
        <div class="modal-content" on:click|stopPropagation>
            <h2>Select Audio Device</h2>
            <ul>
                {#if $player.audioDevices.length > 0}
                    {#each $player.audioDevices as device (device)}
                        <li on:click={() => handleSelectDevice(stripPrefix(device))}>
                            {stripPrefix(device)}
                        </li>
                    {/each}
                {:else}
                    <li>No audio devices found.</li>
                {/if}
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
        max-width: 420px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    h2 {
        margin-top: 0;
        text-align: center;
        font-weight: 600;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 1rem 0 0;
        max-height: 50vh;
        overflow-y: auto;
    }

    li {
        padding: 12px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    li:hover {
        background-color: var(--bg-element-active);
    }
</style>