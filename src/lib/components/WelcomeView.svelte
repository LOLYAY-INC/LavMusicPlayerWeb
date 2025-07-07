<!-- src/lib/components/WelcomeView.svelte -->
<div class="welcome-container">
    <h1>Welcome to LavMusicApp</h1>
    <p>Use the search bar above to find a song, or select a playlist from the sidebar.</p>
</div>

<style>
    .welcome-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        color: var(--text-secondary);
        padding: 32px;
    }
    h1 {
        color: var(--text-primary);
        margin-bottom: 16px;
    }
</style>