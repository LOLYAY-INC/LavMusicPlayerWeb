// src/lib/stores/loginPopupStore.js
import {writable} from 'svelte/store';

/**
 * @typedef {object} LoginPopupState
 * @property {boolean} isOpen - Whether the popup is currently visible.
 * @property {string} code - The authentication code to display.
 */

/**
 * Creates a custom store to manage the state of the login popup.
 * This pattern prevents components from directly writing to the store,
 * ensuring state is only changed via the exposed `show` and `close` methods.
 * @returns {import('svelte/store').Readable<LoginPopupState> & {show: (code: string) => void, close: () => void}}
 */
function createLoginPopupStore() {
    // 1. The core `writable` store is kept private inside this function's scope.
    const {subscribe, set} = writable({
        isOpen: false,
        code: ''
    });

    // 2. We expose an object that contains:
    return {
        // The `subscribe` method, which is required for Svelte's reactivity (`$loginPopup`).
        subscribe,

        // A custom method to safely open the popup with a code.
        show: (code) => {
            console.log('[LoginPopup] show called with code:', code);
            if (!code) {
                console.error("[LoginPopup] show called without a code.");
                return;
            }
            const newState = {isOpen: true, code: code};
            console.log('[LoginPopup] Setting state:', newState);
            set(newState);
            // Verify the state was set correctly
            subscribe(state => console.log('[LoginPopup] Current state after set:', state))();
        },

        // A custom method to safely close the popup and clear the code.
        close: () => {
            set({isOpen: false, code: ''});
        }
    };
}

// 3. Export a single instance of our custom store.
export const loginPopup = createLoginPopupStore();