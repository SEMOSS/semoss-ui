import { makeAutoObservable } from 'mobx';

import { StateStore } from '../state';

export interface DesignerStoreInterface {
    /** Blocks state information */
    state: StateStore;
    /** Current selected widget */
    selected: string;
    /** Current hovered widget */
    hovered: string;
    /** drag information */
    drag: {
        /** Is the drag active? */
        active: boolean;
        /** Method that is triggered when the item is dropped */
        canDrop: (parent: string, slot: string) => boolean;
        /** Title of the dragged item */
        ghostTitle: string;
        /** Position of the dragged item */
        ghostPosition: {
            x: number;
            y: number;
        } | null;
        /** Type of action for the placeholder */
        placeholderAction:
            | {
                  type: 'before' | 'after';
                  id: string;
              }
            | {
                  type: 'replace';
                  id: string;
                  slot: string;
              }
            | null;
        /** Size of the placeholder */
        placeholderSize: {
            top: number;
            left: number;
            height: number;
            width: number;
        } | null;
    };
}

/**
 * Internal state management of the designer object
 */
export class DesignerStore {
    private _store: DesignerStoreInterface = {
        state: undefined,
        selected: '',
        hovered: '',
        drag: {
            active: false,
            canDrop: () => false,
            ghostTitle: '',
            ghostPosition: null,
            placeholderSize: null,
            placeholderAction: null,
        },
    };

    constructor(state: StateStore) {
        // register the blocks
        this._store.state = state;

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    /**
     * Get the blocks
     * @returns the blocks
     */
    get blocks() {
        return this._store.state;
    }

    /**
     * Get the selected widget
     * @returns the selected widget
     */
    get selected() {
        return this._store.selected;
    }

    /**
     * Get the hovered widget
     * @returns the hovered widget
     */
    get hovered() {
        return this._store.hovered;
    }

    /**
     * Get the drag information
     * @returns the drag information
     */
    get drag() {
        return this._store.drag;
    }

    /**
     * Actions
     */
    /**
     * Set the selected widget
     * @param id - id of the widget that is selected
     */
    setSelected(id: string) {
        // if was previously hovered, cancel it
        if (this._store.hovered === id) {
            this._store.hovered = '';
        }

        this._store.selected = id;
    }

    /**
     * Set the hovered widget
     * @param id - id of the widget that is hovered
     */
    setHovered(id: string) {
        // if it is selected ignore it
        if (this._store.selected === id) {
            this._store.hovered = '';
            return;
        }

        this._store.hovered = id;
    }

    /**
     * Activate the drag
     * @param title - title of the dragged item
     * @param canDrop - check if the widget can be dropped onto the parent and slot
     */
    activateDrag(
        title: DesignerStoreInterface['drag']['ghostTitle'],
        canDrop: DesignerStoreInterface['drag']['canDrop'],
    ) {
        // activate the drag
        this._store.drag.active = true;

        // set the widget
        this._store.drag.canDrop = canDrop;

        // initialize the ghost
        this._store.drag.ghostTitle = title;
        this._store.drag.ghostPosition = null;

        // reset the placeholder
        this.resetPlaceholder();
    }

    /**
     * Deactivate the drag
     */
    deactivateDrag() {
        // reset the placeholder
        this.resetPlaceholder();

        // reset the ghost
        this._store.drag.ghostTitle = '';
        this._store.drag.ghostPosition = null;

        // reset the validation
        this._store.drag.canDrop = () => false;

        // deactivate the drag
        this._store.drag.active = false;
    }

    /**
     * Update the ghost
     * @param position - position of the ghost
     */
    updateGhostPosition(
        position: DesignerStoreInterface['drag']['ghostPosition'],
    ) {
        if (!this._store.drag.active) {
            return;
        }

        // update the size
        this._store.drag.ghostPosition = position;
    }

    /**
     * Reset the placeholder
     */
    resetPlaceholder() {
        if (!this._store.drag.active) {
            return;
        }
        // reset the size
        this._store.drag.placeholderSize = null;

        // reset the type
        this._store.drag.placeholderAction = null;
    }

    /**
     * Update the placeholder
     * @param action - action of the placeholder
     * @param size - size of the element the placeholder is masking
     */
    updatePlaceholder(
        action: NonNullable<
            DesignerStoreInterface['drag']['placeholderAction']
        >,
        size: NonNullable<DesignerStoreInterface['drag']['placeholderSize']>,
    ) {
        if (!this._store.drag.active) {
            return;
        }

        // update the action
        this._store.drag.placeholderAction = action;

        // update the size for the placeholder
        this._store.drag.placeholderSize = size;
    }
}
