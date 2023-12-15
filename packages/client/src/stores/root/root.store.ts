import { configure } from 'mobx';

import { MonolithStore, ConfigStore, CacheStore } from '@/stores';

configure({
    enforceActions: 'always',
});

/**
 * RootStore that allows us to access the global stores
 */
export class RootStore {
    monolithStore: MonolithStore;
    configStore: ConfigStore;
    cache: CacheStore;

    constructor() {
        // create the stores
        this.monolithStore = new MonolithStore(this);
        this.configStore = new ConfigStore(this);
        this.cache = new CacheStore(this);
    }
}
