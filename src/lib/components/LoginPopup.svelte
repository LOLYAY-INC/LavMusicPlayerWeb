<!-- src/lib/components/LoginPopup.svelte -->
<script lang="ts">
  import {onMount} from 'svelte';
  import {fade, fly} from 'svelte/transition';
  import {loginPopup} from '../stores/loginPopupStore.js';

  let isOpen = false;
    let code = '';

    const unsubscribe = loginPopup.subscribe(state => {
        isOpen = state.isOpen;
        code = state.code;
    });

    onMount(() => {
        return () => unsubscribe();
    });

    // Prevents clicks inside the modal from closing it
    function handleInnerClick(event: MouseEvent) {
        event.stopPropagation();
    }
</script>

{#if isOpen}
    <!--
      The Modal Backdrop
      - Uses svelte:transition (fade) for a smooth entry/exit.
      - Uses Tailwind for layout (flex, center, etc.).
    -->
    <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            transition:fade={{ duration: 150 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-title"
    >
        <!--
          The Modal Card
          - Uses svelte:transition (fly) for a subtle slide-up effect.
          - `on:click` prevents clicks from propagating to the backdrop.
          - All styling is done with Tailwind utilities.
        -->
        <div
                class="flex w-full max-w-md flex-col gap-4 rounded-xl bg-gray-800 p-6 text-white shadow-2xl"
                transition:fly={{ duration: 200, y: 20 }}
                on:click={handleInnerClick}
        >
            <!-- Header -->
            <header class="flex flex-col items-center text-center">
                <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h2 id="popup-title" class="text-xl font-bold text-white">YouTube Login Required</h2>
                <p class="text-sm text-gray-400">A <span class="font-semibold text-white">SECOND</span> Google account
                    is needed.</p>
            </header>

            <!-- Login Steps -->
            <div class="flex flex-col gap-5 rounded-lg bg-gray-900/50 p-4">
                <!-- Step 1: Open Link -->
                <div class="flex items-start gap-3">
                    <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">
                        1
                    </div>
                    <div class="flex flex-col gap-2">
                        <p class="text-sm text-gray-200">Open the Google device login page.</p>
                        <button
                                on:click={() => window.open('https://www.google.com/device?user_code=' + code, '_blank')}
                                class="flex w-fit items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" viewBox="0 0 24 24"
                                 fill="currentColor">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                            </svg>
                            Open Google Page
                        </button>
                    </div>
                </div>

                <!-- Step 2: Enter Code -->
                <div class="flex items-start gap-3">
                    <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">
                        2
                    </div>
                    <div class="w-full">
                        <p class="mb-2 text-sm text-gray-200">Enter this code when prompted:</p>
                        {#if code}
                            <div class="code-display w-full select-all rounded-md bg-gray-900 py-3 text-center text-2xl font-bold tracking-widest text-white">
                                {code}
                            </div>
                        {:else}
                            <div class="w-full animate-pulse rounded-md bg-gray-700 py-3 text-center text-2xl font-bold text-gray-500">
                                ...
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Warning Box -->
            <div class="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0 text-yellow-400"
                     viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"/>
                </svg>
                <p class="text-xs text-yellow-300">
                    Do not use your main account. There's a small chance it could be terminated by Google.
                </p>
            </div>

            <!-- Footer -->
            <p class="text-center text-xs text-gray-500">
                This popup will close automatically after login.
            </p>
        </div>
    </div>
{/if}

<style>
    /*
      This is a great place for custom styles that are awkward
      to do with Tailwind, like applying a style to a child.
      `select-all` is a utility class, but defining it here
      is a robust way to ensure it works.
    */
    .code-display {
        user-select: all;
    }
</style>