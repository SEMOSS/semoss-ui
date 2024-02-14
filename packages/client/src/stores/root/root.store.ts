import { configure } from 'mobx';

import { MonolithStore, ConfigStore } from '@/stores';

configure({
    enforceActions: 'always',
});

/**
 * RootStore that allows us to access the global stores
 */
export class RootStore {
    monolithStore: MonolithStore;
    configStore: ConfigStore;

    constructor() {
        // create the stores
        this.monolithStore = new MonolithStore(this);
        this.configStore = new ConfigStore(this);
    }
}
