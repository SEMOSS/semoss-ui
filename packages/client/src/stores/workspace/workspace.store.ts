import { makeAutoObservable } from 'mobx';

export interface WorkspaceStoreInterface {
    /** overlay information */
    overlay: {
        /** track if the overlay is open or closed */
        open: boolean;

        /** content to display in the overlay */
        content: React.FunctionComponent;
    };
}

/**
 * Internal state management of the builder object
 */
export class WorkspaceStore {
    private _store: WorkspaceStoreInterface = {
        overlay: {
            open: false,
            content: null,
        },
    };

    constructor() {
        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */

    /**
     * Get the overlay information
     * @returns the overlay information
     */
    get overlay() {
        return this._store.overlay;
    }

    /**
     * Open the overlay
     */
    openOverlay(content: WorkspaceStoreInterface['overlay']['content']) {
        // open the overlay
        this.overlay.open = true;

        // set the content
        this.overlay.content = content;
    }

    /**
     * Close the overlay
     */
    closeOverlay() {
        // close the overlay
        this.overlay.open = false;

        // clear the content
        this.overlay.content = null;
    }
}
