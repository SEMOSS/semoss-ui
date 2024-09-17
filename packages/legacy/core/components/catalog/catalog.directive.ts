'use strict';

import angular from 'angular';

export default angular
    .module('app.catalog.directive', [])
    .directive('catalog', catalogDirective);

import './catalog.scss';
import Utility from '../../utility/utility';
import { CUSTOMIZATION } from '@/custom/theme';

catalogDirective.$inject = [
    '$q',
    '$state',
    '$timeout',
    'semossCoreService',
    'monolithService',
    'CONFIG',
];

interface CatalogItem {
    database_id: string;
    database_name: string;
    app_type: string;
    description: string;
    lastModifiedDate: string;
    open: boolean;
}

function catalogDirective(
    $q,
    $state,
    $timeout,
    semossCoreService,
    monolithService,
    CONFIG
) {
    catalogCtrl.$inject = [];
    catalogLink.$inject = [];

    return {
        restrict: 'E',
        template: require('./catalog.directive.html'),
        controller: catalogCtrl,
        link: catalogLink,
        scope: {},
        bindToController: {},
        controllerAs: 'catalog',
    };

    function catalogCtrl() {}

    function catalogLink(scope, ele) {
        let searchTimeout;
        let insightScrollTimeout;
        let catalogScrollEle;

        scope.catalog.items = {
            search: {
                term: '',
                loading: true,
                raw: [],
                filtered: [],
            },
            edit: {
                open: false,
                item: '',
            },
            delete: {
                open: false,
                item: '',
            },
            sort: 'name',
            limit: 35,
            offset: 0,
            results: [],
            canCollect: false,
        };

        scope.catalog.view = 'ALL';
        scope.catalog.selectedDb = undefined;

        /** General Functions */
        scope.catalog.navigate = navigate;
        scope.catalog.changeView = changeView;
        scope.catalog.changeMode = changeMode;

        /** Catalog Functions */
        scope.catalog.getItems = getItems;
        scope.catalog.searchItems = searchItems;
        scope.catalog.openItem = openItem;
        scope.catalog.openItemEdit = openItemEdit;
        scope.catalog.openItemDelete = openItemDelete;
        scope.catalog.closeItemDelete = closeItemDelete;
        scope.catalog.confirmItemDelete = confirmItemDelete;

        /** Catalog Fields & Filters */
        scope.catalog.fieldOptions = {};
        scope.catalog.fields = [];
        scope.catalog.defaultFieldOptions = {
            selected: [],
            options: [
                'blue',
                'orange',
                'teal',
                'purple',
                'yellow',
                'pink',
                'violet',
                'olive',
            ],
            mapping: {},
        };
        scope.catalog.filterOptions = {};
        scope.catalog.defaultFilterOptions = {
            searchTerm: '',
            isOpen: true,
            raw: [],
            filtered: [],
            selected: [],
        };
        scope.catalog.changeFilterView = changeFilterView;
        scope.catalog.searchField = searchField;
        scope.catalog.updateFilteredItemsPermission =
            updateFilteredItemsPermission;
        scope.catalog.updateFilteredItemField = updateFilteredItemField;
        scope.catalog.refreshFilterFields = refreshFilterFields;

        /** Catalog Permissions */
        scope.catalog.adminUser = false;
        scope.catalog.PERMISSIONS = CONFIG['permissionMappingString'];
        scope.catalog.adminOnlyDbAdd = CONFIG['adminOnlyDbAdd'];
        scope.catalog.adminOnlyDbDelete = CONFIG['adminOnlyDbDelete'];
        scope.catalog.security = false;
        if (CONFIG.hasOwnProperty('security')) {
            scope.catalog.security = CONFIG.security;
        }

        /** Catalog Fields to Display/Edit */
        const keys = CONFIG.databaseMetaKeys
            ? CONFIG.databaseMetaKeys.sort(
                  (a, b) => a.display_order - b.display_order
              )
            : [];
        keys.forEach(function (item) {
            const metaKey = item.metakey;
            scope.catalog.fields.push(metaKey);
            if (
                item.display_options !== 'markdown' &&
                item.display_options !== 'textarea' &&
                item.display_options !== 'input'
            ) {
                scope.catalog.fieldOptions[metaKey] = {
                    ...item,
                    ...scope.catalog.defaultFieldOptions,
                };
                scope.catalog.filterOptions[metaKey] =
                    semossCoreService.utility.freeze(
                        scope.catalog.defaultFilterOptions
                    );
            }
        });

        /**
         * @name searchField
         * @desc filters the provided field by the searchterm
         * @param searchTerm the input
         * @param field metakey defined field
         */
        function searchField(searchTerm: string, field: string): void {
            if (field) {
                if (searchTerm) {
                    scope.catalog.filterOptions[field].filtered =
                        scope.catalog.filterOptions[field].raw.filter(function (
                            f
                        ) {
                            if (f.METAVALUE.indexOf(searchTerm) === -1) {
                                return false;
                            }
                            return true;
                        });
                } else {
                    scope.catalog.filterOptions[field].filtered =
                        scope.catalog.filterOptions[field].raw;
                }
            }
        }

        /**
         * @name getFilterOptions
         * @desc gets the list of available filter options for application defined meta keys
         * @param clearSelected - if true, will clear selected
         */
        function getFilterOptions(fields, clearSelected): ng.IPromise<void> {
            const deferred = $q.defer();

            if (!fields) {
                fields = [];
            }

            const message = semossCoreService.utility.random('query-pixel');
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                const filterValues = {};

                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                for (let i = 0; i < output.length; i++) {
                    output[
                        i
                    ].display = `${output[i].METAVALUE} (${output[i].count})`;
                    filterValues[output[i].METAKEY] =
                        filterValues[output[i].METAKEY] || [];
                    if (scope.catalog.fieldOptions[output[i].METAKEY]) {
                        setFieldOptionColor(
                            output[i].METAVALUE,
                            output[i].METAKEY
                        );
                        filterValues[output[i].METAKEY].push(output[i]);
                    }
                }

                for (const key in filterValues) {
                    // sort filter values
                    if (filterValues.hasOwnProperty(key)) {
                        Utility.sort(filterValues[key]);
                    }
                    // populate filter values
                    if (scope.catalog.filterOptions.hasOwnProperty(key)) {
                        scope.catalog.filterOptions[key].raw =
                            filterValues[key];
                    }
                    // clear values if desired
                    if (clearSelected) {
                        scope.catalog.filterOptions[key].selected = [];
                    }
                }

                // search
                for (const key in scope.catalog.filterOptions) {
                    if (scope.catalog.filterOptions.hasOwnProperty(key)) {
                        searchField(
                            scope.catalog.filterOptions[key].searchTerm,
                            key
                        );
                    }
                }

                // resolve the promise
                deferred.resolve();
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseMetaValues',
                        components: [fields],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });

            return deferred.promise;
        }

        /** General */

        /**
         * @name navigate
         * @desc change route
         * @param state - name of route
         * @param params - parameters
         */
        function navigate(state: string, params: any) {
            $state.go(state, params);
        }

        /**
         * @name changeView
         * @desc change the view (all databases vs one database)
         * @param view - the view (ALL, DB)
         */
        function changeView(view: 'ALL' | 'DB'): void {
            scope.catalog.view = view;
            if (view === 'ALL') {
                scope.catalog.selectedDb = {};
            }
            if (scope.catalog.mode) {
                changeMode(scope.catalog.mode);
            }
        }

        /**
         * @name changeMode
         * @desc change the layout mode
         * @param mode - the layout mode to change to (CARD, LIST)
         */
        function changeMode(mode: 'CARD' | 'LIST'): void {
            scope.catalog.mode = mode;

            // store it in localStorage
            window.localStorage.setItem('smss-catalog-mode', mode);
            $timeout(function () {
                // check if it is at the bottom and going downwards
                if (mode === 'LIST') {
                    catalogScrollEle = ele[0].querySelector(
                        '#catalog__databases-scroll-list'
                    );
                } else {
                    catalogScrollEle = ele[0].querySelector(
                        '#catalog__databases-scroll'
                    );
                }
                if (catalogScrollEle) {
                    catalogScrollEle.addEventListener(
                        'scroll',
                        getMoreDatabases
                    );
                }
            }, 200);
        }

        // Catalog card permission update
        function updateFilteredItemsPermission(itemUniqueKey, permission) {
            const index = scope.catalog.items.search.raw.findIndex(
                (item) => item.database_id === itemUniqueKey
            );
            if (index < 0) {
                return;
            }
            scope.catalog.items.search.raw[index].permission =
                scope.catalog.PERMISSIONS[permission];
        }

        // Catalog card field update
        function updateFilteredItemField(itemUniqueKey, field, value) {
            const index = scope.catalog.items.search.raw.findIndex(
                (item) => item.database_id === itemUniqueKey
            );
            if (index < 0) {
                return;
            }
            scope.catalog.items.search.raw[index][field] = value;
        }

        //
        function refreshFilterFields(field, value, add) {
            if (!field || field === 'markdown' || field === 'description') {
                return;
            }

            let rawIndex = scope.catalog.filterOptions[field].raw.findIndex(
                (item) => item.METAKEY === field && item.METAVALUE === value
            );
            const selectedIndex = scope.catalog.filterOptions[
                field
            ].selected.findIndex(
                (item) => item.METAKEY === field && item.METAVALUE === value
            );

            // ------- Update Filter Options -------
            // Create a new filter if it doesn't exist
            if (rawIndex < 0) {
                if (!add) {
                    return;
                }
                rawIndex = scope.catalog.filterOptions[field].raw.length;
                scope.catalog.filterOptions[field].raw[rawIndex] = {
                    METAKEY: field,
                    METAVALUE: value,
                    count: 0,
                    display: '',
                };
            }

            // Handle updating counts/deleting filters
            if (add) {
                ++scope.catalog.filterOptions[field].raw[rawIndex].count;
                scope.catalog.filterOptions[field].raw[
                    rawIndex
                ].display = `${value} (${scope.catalog.filterOptions[field].raw[rawIndex].count})`;
                if (selectedIndex > -1) {
                    ++scope.catalog.filterOptions[field].selected[selectedIndex]
                        .count;
                    scope.catalog.filterOptions[field].selected[selectedIndex] =
                        scope.catalog.filterOptions[field].raw[rawIndex];
                }
            } else {
                --scope.catalog.filterOptions[field].raw[rawIndex].count;
                scope.catalog.filterOptions[field].raw[
                    rawIndex
                ].display = `${value} (${scope.catalog.filterOptions[field].raw[rawIndex].count})`;
                if (
                    scope.catalog.filterOptions[field].raw[rawIndex].count === 0
                ) {
                    scope.catalog.filterOptions[field].raw.splice(rawIndex, 1);
                }
                if (selectedIndex > -1) {
                    --scope.catalog.filterOptions[field].selected[selectedIndex]
                        .count;
                    if (
                        scope.catalog.filterOptions[field].selected[
                            selectedIndex
                        ].count < 1
                    ) {
                        scope.catalog.filterOptions[field].selected.splice(
                            selectedIndex,
                            1
                        );
                    } else {
                        scope.catalog.filterOptions[field].selected[
                            selectedIndex
                        ].display = `${value} (${scope.catalog.filterOptions[field].selected[selectedIndex].count})`;
                        scope.catalog.filterOptions[field].selected[
                            selectedIndex
                        ] = scope.catalog.filterOptions[field].raw[rawIndex];
                    }
                }
            }

            //Refresh dbs since may not be included in current filters
            searchItems(true);
        }

        /**
         * @name changeFilterView
         * @desc changes catalog options displayed
         * @param {string} filter selected filter
         * @returns {void}
         */
        function changeFilterView(filter) {
            window.localStorage.setItem('smss-catalog-filter', filter);
            scope.catalog.filterView = filter;
            searchItems(true);
        }

        /** Items */
        /**
         * @name getItems
         * @desc get all of the items in the catalog
         */
        function getItems(clear = false): void {
            const message = semossCoreService.utility.random('query-pixel');

            if (clear) {
                scope.catalog.items.offset = 0;
                scope.catalog.items.results = [];
                scope.catalog.items.canCollect = true;
            }

            // register message to come back to
            semossCoreService.once(message, (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                // turn loading off
                scope.catalog.items.search.loading = false;

                // clear it
                if (clear) {
                    scope.catalog.items.search.raw = [];
                }

                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                let databaseId;
                if (scope.catalog.view === 'DB' && !scope.catalog.selectedDb) {
                    databaseId = $state.params.database;
                }

                for (
                    let outputIdx = 0, outputLen = output.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    const item = output[outputIdx],
                        newItem = {
                            database_id: item.database_id,
                            image: getImage(item.database_id),
                            database_name: String(item.database_name).replace(
                                /_/g,
                                ' '
                            ),
                            discoverable: false,
                            app_type: item.app_type,
                            description: item.description,
                            lastModifiedDate: item.lastModified
                                ? getDateFormat(new Date(item.lastModified))
                                : '',
                            open: false,
                            permission: item.permission,
                        };

                    Object.keys(scope.catalog.fieldOptions).forEach((k) => {
                        if (
                            scope.catalog.fieldOptions[k].display_options !==
                                'textarea' &&
                            scope.catalog.fieldOptions[k].display_options !==
                                'markdown' &&
                            scope.catalog.fieldOptions[k].display_options !==
                                'input'
                        ) {
                            newItem[k] = item[k]
                                ? Array.isArray(item[k])
                                    ? item[k]
                                    : [item[k]]
                                : [];
                            if (newItem[k] && newItem[k].length > 0) {
                                for (let i = 0; i < newItem[k].length; i++) {
                                    setFieldOptionColor(newItem[k][i], k);
                                }
                            }
                        } else {
                            newItem[k] = item[k];
                        }
                    });

                    // add it
                    scope.catalog.items.search.raw.push(newItem);
                    if (databaseId && item.database_id === databaseId) {
                        scope.catalog.selectedDb = newItem;
                    }
                }

                scope.catalog.items.search.filtered =
                    scope.catalog.items.search.raw.sort(function (a, b) {
                        return a.database_name - b.database_name;
                    });

                scope.catalog.items.canCollect =
                    output.length === scope.catalog.items.limit;
            });

            // build metaFilters
            const filters = {};
            Object.keys(scope.catalog.fieldOptions).forEach((k) => {
                if (
                    scope.catalog.filterOptions[k].selected &&
                    scope.catalog.filterOptions[k].selected.length
                ) {
                    filters[k] = scope.catalog.filterOptions[k].selected.map(
                        (m) => m.METAVALUE
                    );
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'myDatabases',
                        components: [
                            ,
                            ,
                            scope.catalog.fields,
                            [filters],
                            scope.catalog.items.limit,
                            scope.catalog.items.offset,
                            scope.catalog.items.search.term,
                        ],
                        terminal: true,
                    },
                ],
                listeners: [], // taken care of in the directive
                response: message,
            });
        }

        /**
         * @name getMoreInsights
         * @desc gets more insights on scroll
         */
        function getMoreDatabases(): void {
            if (!scope.catalog.items.canCollect) {
                return;
            }
            if (insightScrollTimeout) {
                $timeout.cancel(insightScrollTimeout);
            }

            // debounce
            insightScrollTimeout = $timeout(function () {
                // check if it is at the bottom and going downwards
                if (
                    catalogScrollEle.scrollTop +
                        catalogScrollEle.clientHeight >=
                        catalogScrollEle.scrollHeight * 0.75 &&
                    !scope.catalog.items.search.loading
                ) {
                    // increment the offset to get more
                    scope.catalog.items.offset += scope.catalog.items.limit;
                    if (scope.catalog.filterView == 'My Databases') {
                        getItems(false);
                    } else {
                        getRequestableDatasets(false);
                    }
                }
            }, 300);
        }

        /** Items */
        /**
         * @name getItems
         * @desc get all of the items in the catalog
         */
        function getRequestableDatasets(clear = false): void {
            const message = semossCoreService.utility.random('query-pixel');

            if (clear) {
                scope.catalog.items.offset = 0;
                scope.catalog.items.results = [];
                scope.catalog.items.canCollect = true;
            }

            // register message to come back to
            semossCoreService.once(message, (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                // turn loading off
                scope.catalog.items.search.loading = false;

                // clear it
                if (clear) {
                    scope.catalog.items.search.raw = [];
                }

                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                let databaseId;
                if (scope.catalog.view === 'DB' && !scope.catalog.selectedDb) {
                    databaseId = $state.params.database;
                }

                for (
                    let outputIdx = 0, outputLen = output.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    const item = output[outputIdx],
                        newItem = {
                            database_id: item.database_id,
                            image: getImage(item.database_id),
                            database_name: String(item.database_name).replace(
                                /_/g,
                                ' '
                            ),
                            discoverable: true,
                            app_type: item.app_type,
                            description: item.description,
                            lastModifiedDate: item.lastModified
                                ? getDateFormat(new Date(item.lastModified))
                                : '',
                            open: false,
                        };

                    // Field with multiple values need to be converted to an array
                    Object.keys(scope.catalog.fieldOptions).forEach((k) => {
                        if (
                            scope.catalog.fieldOptions[k].display_options !==
                                'textarea' &&
                            scope.catalog.fieldOptions[k].display_options !==
                                'markdown' &&
                            scope.catalog.fieldOptions[k].display_options !==
                                'input'
                        ) {
                            newItem[k] = item[k]
                                ? Array.isArray(item[k])
                                    ? item[k]
                                    : [item[k]]
                                : [];
                            if (newItem[k] && newItem[k].length > 0) {
                                for (let i = 0; i < newItem[k].length; i++) {
                                    setFieldOptionColor(newItem[k][i], k);
                                }
                            }
                        } else {
                            newItem[k] = item[k];
                        }
                    });

                    // add it
                    scope.catalog.items.search.raw.push(newItem);
                    if (databaseId && item.database_id === databaseId) {
                        scope.catalog.selectedDb = newItem;
                    }
                }

                scope.catalog.items.search.filtered =
                    scope.catalog.items.search.raw.sort(function (a, b) {
                        return a.database_name - b.database_name;
                    });
            });

            const filters = {};
            Object.keys(scope.catalog.fieldOptions).forEach((k) => {
                if (
                    scope.catalog.filterOptions[k].selected &&
                    scope.catalog.filterOptions[k].selected.length
                ) {
                    filters[k] = scope.catalog.filterOptions[k].selected.map(
                        (m) => m.METAVALUE
                    );
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: false,
                        type: 'myDiscoverableDatabases',
                        components: [
                            ,
                            ,
                            scope.catalog.fields,
                            [filters],
                            scope.catalog.items.limit,
                            scope.catalog.items.offset,
                            scope.catalog.items.search.term,
                        ],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name searchItems
         * @desc search the items in the catalog
         */
        function searchItems(clear = false): void {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            // debounce
            searchTimeout = $timeout(() => {
                if (scope.catalog.filterView === 'My Databases') {
                    getItems(clear);
                } else if (scope.catalog.filterView === 'Community Databases') {
                    getRequestableDatasets(clear);
                }
                $timeout.cancel(searchTimeout);
            }, 300);
        }

        /**
         * @name openItem
         * @desc open an item
         * @param item - item to open
         */
        function openItem(item: CatalogItem): void {
            $state.go('home.catalog.database', {
                database: item.database_id,
            });
            scope.catalog.selectedDb = item;
        }

        /**
         * @name openItemEdit
         * @desc Opens the overlay to edit an item
         * @param item - item to select
         */
        function openItemEdit(item: CatalogItem): void {
            // close the popover
            item.open = false;

            // open the edit overlay and set the item to edit
            scope.catalog.items.edit.open = true;
            scope.catalog.items.edit.item = item;
        }

        /**
         * @name openItemDelete
         * @desc Opens the delete overlay and sets the item to delete
         * @param item - item to delete
         */
        function openItemDelete(item: CatalogItem): void {
            // close the popover
            item.open = false;

            // open the delete overlay and set the item to delete
            scope.catalog.items.delete.open = true;
            scope.catalog.items.delete.item = item;
        }

        /**
         * @name closeItemDelete
         * @desc Closes the overlay to delete an item
         */
        function closeItemDelete(): void {
            // close the delete overlay and unset the item to edit
            scope.catalog.items.delete.open = false;
            scope.catalog.items.delete.item = null;
        }

        /**
         * @name confirmItemDelete
         * @desc Actually delte the item
         */
        function confirmItemDelete(): void {
            const id = scope.catalog.items.delete.item.database_id;

            if (!id) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Error deleting from the catalog.',
                });

                return;
            }

            semossCoreService.once('delete-app-end', (response) => {
                if (response.success) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully deleted from the catalog',
                    });

                    // get the items again
                    searchItems(true);
                }
            });

            semossCoreService.emit('delete-database', {
                appId: id,
                closeApp: true,
            });

            // close the popover
            closeItemDelete();
        }

        /** Utility */
        /**
         * @name getImage
         * @desc gets the image for the app
         * @param id - appId of the image
         * @returns url for image
         */
        function getImage(id: string): string {
            const imageUpdates = semossCoreService.getOptions('imageUpdates');

            if (imageUpdates[id]) {
                return imageUpdates[id];
            }

            return semossCoreService.app.generateDatabaseImageURL(id);
        }

        /**
         * @name getDateFormat
         * @desc format a date into the wanted format
         * @param date - date the date to format
         * @returns formatted date
         */
        function getDateFormat(date: Date): string {
            return (
                date.toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }) +
                ' ' +
                date.toLocaleTimeString()
            );
        }

        /**
         * @name setFieldOptionColor
         * @desc sets the tag color pseudo-randomly
         * @param option - field option
         * @param field - metakey field
         */
        function setFieldOptionColor(opt: string, field: string): void {
            if (
                !scope.catalog.fieldOptions[field].mapping.hasOwnProperty(opt)
            ) {
                const charCode = opt
                    .split('')
                    .map((x) => x.charCodeAt(0))
                    .reduce((a, b) => a + b);
                const color =
                    scope.catalog.fieldOptions[field].options[charCode % 8];
                scope.catalog.fieldOptions[field].mapping[opt] = color;
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            if (
                scope.catalog.adminOnlyDbAdd ||
                scope.catalog.adminOnlyDbDelete
            ) {
                monolithService.isAdmin().then(function (adminUser) {
                    scope.catalog.adminUser = adminUser;
                });
            }
            const appListener = semossCoreService.on('update-app', searchItems);
            const filterListener = semossCoreService.on(
                'update-catalog-filters',
                ({ databaseId, key, metaData, newVals, removedVals }) => {
                    const isFilter =
                        (newVals && newVals.length) ||
                        (removedVals && removedVals.length);
                    updateFilteredItemField(databaseId, key, metaData[key]);

                    if (
                        isFilter &&
                        scope.catalog.fieldOptions.hasOwnProperty(key)
                    ) {
                        newVals.forEach(function (item) {
                            refreshFilterFields(key, item, true);
                        });

                        removedVals.forEach(function (item) {
                            refreshFilterFields(key, item, false);
                        });
                    }
                }
            );

            if ($state.current.name.indexOf('home.catalog.database') > -1) {
                changeView('DB');
            }

            // reset the filters
            getFilterOptions(scope.catalog.fields, false);

            if (
                window.localStorage.getItem('smss-catalog-mode') &&
                window.localStorage.getItem('smss-catalog-mode') !== 'undefined'
            ) {
                scope.catalog.mode =
                    window.localStorage.getItem('smss-catalog-mode');
            } else {
                scope.catalog.mode = 'CARD';
                window.localStorage.setItem('smss-catalog-mode', 'CARD');
            }
            if (window.localStorage.getItem('smss-catalog-filter')) {
                scope.catalog.filterView = window.localStorage.getItem(
                    'smss-catalog-filter'
                );
            } else {
                scope.catalog.filterView = 'My Databases';
                window.localStorage.setItem(
                    'smss-catalog-filter',
                    'My Databases'
                );
            }
            // initial scroll listener
            $timeout(() => {
                catalogScrollEle = ele[0].querySelector(
                    '#catalog__databases-scroll'
                );

                if (catalogScrollEle) {
                    catalogScrollEle.addEventListener(
                        'scroll',
                        getMoreDatabases
                    );
                }
            });

            scope.$watch(
                function () {
                    return $state.current.name;
                },
                function (newValue, oldValue) {
                    if (!angular.equals(oldValue, newValue)) {
                        if (newValue.indexOf('home.catalog.database') > -1) {
                            changeView('DB');
                        }
                        if (newValue === 'home.catalog') {
                            changeView('ALL');
                        }
                    }
                }
            );

            scope.$on('$destroy', function () {
                appListener();
                filterListener();
            });

            const themeMap = CONFIG.theme['THEME_MAP'] ? JSON.parse(CONFIG.theme['THEME_MAP']) : {}
            document.title = themeMap.name ? themeMap.name : CUSTOMIZATION.page.title;

            // Set the favicon
            const faviconLink = themeMap.isLogoUrl
                ? themeMap.logo
                : CUSTOMIZATION.page.favicon
                ? CUSTOMIZATION.page.favicon
                : null;

            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = faviconLink;
            document.head.appendChild(link);
        }

        searchItems(true);
        initialize();
    }
}
