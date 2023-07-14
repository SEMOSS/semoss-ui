import { makeAutoObservable } from 'mobx';

export interface InsightStoreInterface {
    /** Insight ID of the insight */
    insightID: string;
}

/**
 * Insight Store that allow a user to interact with an insight
 */
export class InsightStore {
    private _store: InsightStoreInterface = {
        insightID: '',
    };

    constructor() {
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
    get insightID() {
        return this._store.insightID;
    }
}
