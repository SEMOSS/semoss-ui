import { makeAutoObservable } from 'mobx';

import { StateStore } from '../state';

export interface DesignerStoreInterface {
    /** Blocks state information */
    state: StateStore;
    /** Current rendered block */
    rendered: string;
    /** Current selected block */
    selected: string;
    /** Current hovered block */
    hovered: string;
    /** drag information */
    drag: {
        /** Is the drag active? */
        active: boolean;
        /** Method that is triggered when the item is dropped */
        canDrop: (parent: string, slot: string) => boolean;
        /** Name of the dragged widget */
        ghostWidget: string;
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
        rendered: '',
        selected: '',
        hovered: '',
        drag: {
            active: false,
            canDrop: () => false,
            ghostWidget: '',
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
     * Get the selected block
     * @returns the selected block
     */
    get selected() {
        return this._store.selected;
    }

    /**
     * Get the rendered block
     * @returns the rendered block
     */
    get rendered() {
        return this._store.rendered;
    }

    /**
     * Get the hovered block
     * @returns the hovered block
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
     * Set the selected block
     * @param id - id of the block that is selected
     */
    setSelected(id: string) {
        // if was previously hovered, cancel it
        if (this._store.hovered === id) {
            this._store.hovered = '';
        }

        this._store.selected = id;
    }

    /**
     * Set the rendered block
     * @param id - id of the block that is rendered
     */
    setRendered(id: string) {
        // set the rendered block
        this._store.rendered = id;
    }

    /**
     * Set the hovered block
     * @param id - id of the block that is hovered
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
     * @param canDrop - check if the block can be dropped onto the parent and slot
     */
    activateDrag(
        widget: DesignerStoreInterface['drag']['ghostWidget'],
        canDrop: DesignerStoreInterface['drag']['canDrop'],
    ) {
        // activate the drag
        this._store.drag.active = true;

        // set the block
        this._store.drag.canDrop = canDrop;

        // initialize the ghost
        this._store.drag.ghostWidget = widget;
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
        this._store.drag.ghostWidget = '';
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
