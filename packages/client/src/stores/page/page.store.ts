import { autorun, makeAutoObservable } from 'mobx';

import { PageCache } from './page.types';
import React from 'react';

const CACHE_KEY = `PAGE_STORE_CACHE--1`;

export interface PageStoreInterface {
    /**
     * Top navigation information
     **/
    topNav:
        | {
              /**
               * Content to display on the left side of the top nav
               */
              left: React.ReactNode | null;

              /**
               *  Show the search
               */
              search: boolean;

              /**
               * Content to display on the right side of the top nav
               */
              right: React.ReactNode | null;
          }
        | false;

    /**
     * side navigation information
     **/
    sideNav: {
        /**
         * Track if it is open or closed
         */
        open: boolean;

        /**
         * Track if it is pinned
         */
        pinned: boolean;
    };
    /**
     * side navigation information
     **/
    content: {
        /**
         * Track if it is open or closed
         */
        fullWidth: boolean;
    };

    /**
     * Overlay information
     **/
    overlay: {
        /**
         * Track if the overlay is open or closed
         */
        open: boolean;

        /**
         * Options associated with the overlay
         */
        options: {
            /**
             * Set the maxWidth of the overlay
             */
            maxWidth: 'sm' | 'md' | 'lg' | 'xl' | null;
        };

        /**
         * Content to display in the overlay
         */
        content: () => React.ReactNode;
    };
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class PageStore {
    private _store: PageStoreInterface = {
        topNav: {
            left: null,
            search: true,
            right: null,
        },
        sideNav: {
            open: false,
            pinned: false,
        },
        content: {
            fullWidth: false,
        },
        overlay: {
            open: false,
            options: {
                maxWidth: 'sm',
            },
            content: () => null,
        },
    };

    constructor() {
        // set from the catch
        try {
            const cached = JSON.parse(
                localStorage.getItem(CACHE_KEY),
            ) as PageCache;

            if (cached) {
                this._store.sideNav.pinned = cached.sideNav.pinned;
            }
        } catch (e) {
            // noop
        }

        // make it observable
        makeAutoObservable(this);

        // auto run and save to cache
        autorun(() => {
            try {
                const item: PageCache = {
                    sideNav: {
                        pinned: this._store.sideNav.pinned,
                    },
                };

                // save cache
                localStorage.setItem(CACHE_KEY, JSON.stringify(item));
            } catch (e) {
                // noop
            }
        });
    }

    /**
     * Getters
     */
    /**
     * Get top navigation information
     */
    get topNav() {
        return this._store.topNav;
    }

    /**
     * Get side navigation information
     */
    get sideNav() {
        return this._store.sideNav;
    }

    /**
     * Get content information
     */
    get content() {
        return this._store.content;
    }

    /**
     * Get overlay information
     */
    get overlay() {
        return this._store.overlay;
    }

    /**
     * Actions
     */

    /**
     * Set the top navigation
     */
    setTopNav = (
        options: PageStoreInterface['topNav'] = {
            left: null,
            search: true,
            right: null,
        },
    ) => {
        this._store.topNav = options;
    };

    /**
     * Set the top navigation
     */
    setContent = (content: { fullWidth: boolean }) => {
        this._store.content = content;
    };

    /**
     * Open the side navigation
     */
    openSideNav = () => {
        this._store.sideNav.open = true;
    };

    /**
     * Close the side navigation
     */
    closeSideNav = () => {
        this._store.sideNav.open = false;
    };

    /**
     * Pin the side navigation
     */
    pinSideNav = () => {
        this._store.sideNav.pinned = true;
    };

    /**
     * Unpin the side navigation
     */
    unpinSideNav = () => {
        this._store.sideNav.pinned = false;
    };

    /**
     * Open the overlay
     */
    openOverlay = (
        content: PageStoreInterface['overlay']['content'],
        options: PageStoreInterface['overlay']['options'] = {
            maxWidth: 'sm',
        },
    ) => {
        // open the overlay
        this._store.overlay.open = true;

        // set the content
        this._store.overlay.content = content;
        this._store.overlay.options = options;
    };

    /**
     * Close the overlay
     */
    closeOverlay = () => {
        // close the overlay
        this._store.overlay.open = false;

        // clear the content
        this._store.overlay.content = null;
    };
}
