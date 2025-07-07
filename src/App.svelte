<!-- src/App.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { player } from '$lib/playerStore.js';

  // Component Imports
  import PlayerBar from '$lib/components/PlayerBar.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import CurrentSong from '$lib/components/CurrentSong.svelte';
  import PlaylistList from '$lib/components/PlaylistList.svelte';
  import AddTrackToPlaylistModal from '$lib/components/AddTrackToPlaylistModal.svelte';
  import WelcomeView from '$lib/components/WelcomeView.svelte';
  import NowPlayingView from '$lib/components/NowPlayingView.svelte';

  let hasActiveSong = false;


  $: {

    hasActiveSong = $player.currentSong.title !== 'No song playing' && !!$player.currentSong.encoded;
  }

  onMount(() => {
    player.init();
  });
</script>

<div class="app-container">
  <aside class="sidebar">
    <CurrentSong />
    <PlaylistList />
  </aside>

  <main class="main-content">
    <header class="main-header">
      <SearchBar />
    </header>

    <div class="view-container">
      {#if hasActiveSong}
        <NowPlayingView />
      {:else}
        <WelcomeView />
      {/if}
    </div>
  </main>
</div>

<PlayerBar />
<AddTrackToPlaylistModal />

<style>
  :root {
    --font-sans: 'Poppins', sans-serif;
    --bg-black: #000000;
    --bg-dark-gray: #121212;
    --bg-player: #181818;
    --bg-element: #282828;
    --bg-element-hover: #3a3a3a;
    --bg-element-active: #535353;
    --text-primary: #ffffff;
    --text-secondary: #b3b3b3;
    --text-interactive: #1db954;
    --player-height: 90px;
  }

  :global(body) {
    margin: 0;
    font-family: var(--font-sans);
    background-color: var(--bg-black);
    color: var(--text-primary);
  }

  :global(*, *::before, *::after) { box-sizing: border-box; }
  :global(p, h1, h2, h3) { margin: 0; }

  .app-container {
    display: grid;
    grid-template-areas: 'sidebar main';
    grid-template-columns: 250px 1fr;
    height: calc(100vh - var(--player-height));
    width: 100%;
    overflow: hidden;
  }

  .sidebar {
    grid-area: sidebar;
    background-color: var(--bg-black);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
  }

  .main-content {
    grid-area: main;
    overflow: auto;
    background-color: var(--bg-dark-gray);
    display: flex;
    flex-direction: column;
  }

  .main-header {
    position: sticky;
    top: 0;
    z-index: 20;
    padding: 16px 32px;
    display: flex;
    justify-content: center;
    background-color: rgba(18, 18, 18, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    flex-shrink: 0;
  }

  .view-container {
    flex-grow: 1;
    display: flex;
    min-height: 0;
  }

  .view-container :global(.now-playing-grid),
  .view-container :global(.welcome-container) {
    flex-grow: 1;
  }
</style>