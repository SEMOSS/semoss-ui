'use strict';

export default angular
    .module('app.dashboard-filter-legacy-list.directive', [])
    .directive('dashboardFilterLegacyList', dashFilterListDirective);

dashFilterListDirective.$inject = ['$timeout', 'semossCoreService'];

function dashFilterListDirective($timeout, semossCoreService) {
    dashboardFilterListLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^widget', '^dashboardFilterLegacy'],
        controllerAs: 'dashFilterList',
        bindToController: {
            column: '=',
            auto: '=',
        },
        template: require('./dashboard-filter-legacy-list.directive.html'),
        controller: dashboardFilterListCtrl,
        link: dashboardFilterListLink,
    };

    function dashboardFilterListCtrl() {}

    function dashboardFilterListLink(scope, ele, attrs, ctrl) {
        var searchTimeout, updateComponentListener, unfilterComponentLister;
        scope.widgetCtrl = ctrl[0];
        scope.dashFilter = ctrl[1];

        scope.dashFilterList.filter = {
            init: false,
        };

        scope.dashFilterList.applyFilter = applyFilter;
        scope.dashFilterList.applyFilterIfAuto = applyFilterIfAuto;
        scope.dashFilterList.getMoreInstances = getMoreInstances;
        scope.dashFilterList.search = search;
        scope.dashFilterList.selectAll = selectAll;

        /**
         * @name selectAll
         * @desc Updates the boolean value for selectAll, updates the rest of the list items accordingly
         * @returns {void}
         */
        function selectAll() {
            var currentFilter = scope.dashFilterList.filter;
            currentFilter.selectAll = !currentFilter.selectAll;

            // if everything is selected, add all to unfiltered
            if (currentFilter.selectAll) {
                currentFilter.selectedAll = [];
                currentFilter.selectedAll = currentFilter.selectedAll
                    .concat(currentFilter.renderedAll)
                    .filter((item, idx, self) => self.indexOf(item) === idx);
            } else {
                currentFilter.selectedAll = currentFilter.selectedAll.filter(
                    (instance) =>
                        currentFilter.renderedAll.indexOf(instance) === -1
                );
            }

            applyFilterIfAuto();
        }

        /**
         * @name search
         * @desc search for the instances based on searchTerm
         * @returns {void}
         */
        function search() {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }
            searchTimeout = $timeout(function () {
                var currentFilter = scope.dashFilterList.filter;
                // reset vars
                currentFilter.offsetFiltered = 0;
                currentFilter.offsetUnfiltered = 0;
                currentFilter.offsetUnfilteredAll = 0;
                currentFilter.canCollectUnfilteredAll = true;
                currentFilter.canCollectFiltered = true;
                currentFilter.canCollectUnfiltered = true;
                updateFilter();
                $timeout.cancel(searchTimeout);
            }, 500);
        }

        /**
         * @name getMoreInstances
         * @param {boolean} all - if true, user is scrolling in all values list
         * @desc get the next set of instances
         * @returns {void}
         */
        function getMoreInstances(all) {
            var filter = scope.dashFilterList.filter;
            if (all) {
                if (filter.canCollectUnfilteredAll) {
                    filter.offsetUnfilteredAll += filter.limit;
                    filter.offsetFiltered += filter.limit;
                    updateFilter('all');
                }
            } else if (filter.canCollectFiltered) {
                filter.offsetFiltered += filter.limit;
                updateFilter('unfilter');
            }
        }

        /**
         * @name applyFilter
         * @param {object} delta the instance selected
         * @desc runs pixel for filter
         * @return {void}
         */
        function applyFilter(delta) {
            var col = scope.dashFilterList.column,
                frameList = Object.keys(
                    semossCoreService.getShared(
                        scope.widgetCtrl.insightID,
                        'frames'
                    )
                ),
                frameIdx,
                pixelComponents = [];

            for (frameIdx = 0; frameIdx < frameList.length; frameIdx++) {
                pixelComponents.push(
                    buildPixelComponents(col, frameList[frameIdx], delta)
                );
            }

            scope.dashFilter.applyFilter(col, pixelComponents);
        }

        /**
         * @name isSelected
         * @param {num | string} instance - what we are looking for
         * @param {array} selected - array of selected items
         * @desc bsearch to look for a value in the selected array
         * @return {boolean} true if instance is in selected
         */
        function isSelected(instance, selected) {
            const middle = Math.floor(selected.length / 2);
            let middleInstance = selected[middle];

            if (selected.length === 0) {
                return false;
            }
            if (typeof middleInstance === 'string') {
                middleInstance = middleInstance;
            }
            if (selected.length === 1 && middleInstance !== instance) {
                return false;
            }
            if (instance < middleInstance) {
                return isSelected(instance, selected.slice(0, middle));
            } else if (instance > middleInstance) {
                return isSelected(instance, selected.slice(middle + 1));
            }

            return true;
        }

        /**
         * @name buildPixelComponents
         * @param {string} col - column name
         * @param {string} frame - the frame to run on
         * @param {object} delta - the instance selected
         * @desc builds the pixel for the filter
         * @return {array} the pixel components
         */
        function buildPixelComponents(col, frame, delta) {
            var filter = scope.dashFilterList.filter,
                frameFilters = [],
                components = [
                    {
                        type: 'variable',
                        components: [frame],
                    },
                ];

            if (filter.selectAll) {
                let unselected = [];
                if (delta) {
                    unselected = [delta.value];
                }
                // filter.renderedAll.forEach(instance => {
                //     let val = instance;
                //     if (filter.selectedAll.indexOf(val) === -1) {
                //         unselected.push(val);
                //     }
                //     // if (!isSelected(val, filter.selectedAll)) {
                //     //     unselected.push(instance);
                //     // }
                // });

                if (filter.search) {
                    frameFilters.push({
                        type: 'value',
                        alias: col,
                        comparator: '?like',
                        values: filter.search,
                    });

                    if (unselected.length !== 0) {
                        components.push({
                            type: 'addFrameFilter',
                            components: [frameFilters],
                            terminal: true,
                        });
                        frameFilters = [];
                        components.push({
                            type: 'variable',
                            components: [frame],
                        });
                    }
                }

                if (unselected.length > 0) {
                    frameFilters.push({
                        type: 'value',
                        alias: col,
                        comparator: '!=',
                        values: unselected,
                    });
                }

                if (filter.search && unselected.length === 0) {
                    components.push({
                        type: 'setFrameFilter',
                        components: [
                            [
                                {
                                    type: 'value',
                                    alias: col,
                                    comparator: '?like',
                                    values: filter.search,
                                },
                            ],
                        ],
                        terminal: true,
                    });
                } else if (Object.keys(frameFilters).length > 0) {
                    if (delta) {
                        if (delta.type === 'add') {
                            components.push({
                                type: 'removeFrameFilter',
                                components: [frameFilters],
                                terminal: true,
                            });
                        } else {
                            components.push({
                                type: 'addFrameFilter',
                                components: [frameFilters],
                                terminal: true,
                            });
                        }
                    } else {
                        components.push({
                            type: 'addFrameFilter',
                            components: [frameFilters],
                            terminal: true,
                        });
                    }
                } else {
                    components.push({
                        type: 'unfilterFrame',
                        components: [col],
                        terminal: true,
                    });
                }
            } else if (filter.selectedAll.length === 0) {
                components.push({
                    type: 'unfilterFrame',
                    components: [col],
                    terminal: true,
                });
            } else {
                components.push({
                    type: 'setFrameFilter',
                    components: [
                        [
                            {
                                type: 'value',
                                alias: col,
                                comparator: '==',
                                values: filter.selectedAll,
                            },
                        ],
                    ],
                    terminal: true,
                });
            }

            return components;
        }

        /**
         * @name applyFilterIfAuto
         * @param {object} delta the selected value
         * @desc runs the filter if auto
         * @return {void}
         */
        function applyFilterIfAuto(delta) {
            // var col = scope.dashFilterList.column;

            if (scope.dashFilterList.auto) {
                applyFilter(delta);
            }
        }

        /**
         * @name resetFilter
         * @desc resets filter object
         * @return {void}
         */
        function resetFilter() {
            var renderedUnfiltered,
                filter = scope.dashFilterList.filter,
                frame =
                    scope.dashFilter.filter[scope.dashFilterList.column].frame,
                offsetFiltered,
                unfilterFrame,
                canCollectUnfilteredAll,
                offsetUnfilteredAll,
                selectedAll,
                filterSelectAll,
                offsetUnfiltered,
                canCollectFiltered,
                canCollectUnfiltered,
                filterSearch,
                renderedAll;

            if (filter.init) {
                canCollectUnfilteredAll = filter.canCollectUnfilteredAll;
                offsetUnfilteredAll = filter.offsetUnfilteredAll;
                unfilterFrame = filter.unfilterFrame;
                renderedAll = filter.renderedAll;
                selectedAll = filter.selectedAll;
                filterSelectAll = filter.selectAll;
                renderedUnfiltered = filter.renderedUnfiltered;
                offsetUnfiltered = filter.offsetUnfiltered;
                offsetFiltered = filter.offsetFiltered;
                filterSearch = filter.search;
                canCollectFiltered = filter.canCollectFiltered;
                canCollectUnfiltered = filter.canCollectUnfiltered;
            }

            scope.dashFilterList.filter = {
                init: true,
                unfilterFrame: unfilterFrame || false,
                selectAll: filterSelectAll,
                renderedAll: renderedAll || [],
                selectedAll: selectedAll || [],
                selectedUnfiltered: selectedAll || [],
                renderedUnfiltered: renderedUnfiltered || [],
                search: filterSearch || '',
                limit: 50,
                offsetFiltered: offsetFiltered || 0,
                offsetUnfiltered: offsetUnfiltered || 0,
                offsetUnfilteredAll: offsetUnfilteredAll || 0,
                canCollectFiltered: canCollectFiltered || true,
                canCollectUnfiltered: canCollectUnfiltered || true,
                canCollectUnfilteredAll: canCollectUnfilteredAll || true,
                frame: frame || scope.widgetCtrl.getFrame('name'),
            };
        }

        /**
         * @name updateFilter
         * @param {string} onScroll - if user has scrolled, if so from all list ('all') or unfilter list ('unfilter')
         * @desc main function that requests, resets and then sets filter
         * @return {void}
         */
        function updateFilter(onScroll) {
            var message = semossCoreService.utility.random(
                    scope.dashFilterList.column
                ),
                filter,
                unfilterOffset;

            resetFilter();

            filter = scope.dashFilterList.filter;
            semossCoreService.once(message, setFilter.bind(null, onScroll));

            if (onScroll === 'all') {
                unfilterOffset = filter.offsetUnfilteredAll;
            } else {
                unfilterOffset = filter.offsetUnfiltered;
            }
            // this emits the message we are listening for
            scope.dashFilter.getInstances(
                message,
                scope.dashFilterList.column,
                filter.search,
                filter.limit,
                filter.offsetFiltered,
                unfilterOffset
            );
        }

        /**
         * @name setFilter
         * @param {string} onScroll - if user has scrolled, if so from filter list ('filter') or unfilter list ('unfilter')
         * @param {object} payload - instances returned from filter pixel
         * @desc sets appropriate (un)filtered values
         * @return {void}
         */
        function setFilter(onScroll, payload) {
            var renderedFiltered = payload.pixelReturn[0].output,
                renderedUnfiltered = payload.pixelReturn[1].output,
                currentFilter = scope.dashFilterList.filter;

            // allow to get more instances now (for infinite scroll to prevent multiple get instances to run)
            scope.dashFilter.busy = false;

            if (onScroll) {
                if (onScroll === 'all') {
                    currentFilter.renderedAll = currentFilter.renderedAll
                        .concat(renderedUnfiltered.unfilterValues)
                        .concat(renderedFiltered.filterValues);
                    currentFilter.offsetUnfilteredAll =
                        renderedUnfiltered.offset;
                    if (currentFilter.selectAll) {
                        currentFilter.renderedUnfiltered =
                            currentFilter.renderedUnfiltered.concat(
                                renderedUnfiltered.unfilterValues
                            );
                        currentFilter.selectedAll =
                            currentFilter.selectedAll.concat(
                                renderedUnfiltered.unfilterValues
                            );
                    }
                } else {
                    currentFilter.renderedUnfiltered =
                        currentFilter.renderedUnfiltered.concat(
                            renderedUnfiltered.unfilterValues
                        );
                }
            } else if (currentFilter.search) {
                currentFilter.renderedAll =
                    renderedUnfiltered.unfilterValues.concat(
                        renderedFiltered.filterValues
                    );
                currentFilter.renderedUnfiltered =
                    renderedUnfiltered.unfilterValues.filter(
                        (instance) =>
                            currentFilter.renderedAll.indexOf(instance) > -1
                    );
            } else {
                currentFilter.renderedAll = currentFilter.renderedAll
                    .concat(renderedUnfiltered.unfilterValues)
                    .concat(renderedFiltered.filterValues);
                if (
                    !currentFilter.selectAll &&
                    renderedFiltered.filterValues.length === 0
                ) {
                    currentFilter.selectedAll = [];
                }
            }

            if (onScroll !== 'all') {
                currentFilter.offsetUnfiltered = renderedUnfiltered.offset;
                if (
                    !(
                        currentFilter.search &&
                        currentFilter.renderedUnfiltered.length === 0 &&
                        currentFilter.selectedAll.length === 0
                    )
                ) {
                    currentFilter.renderedUnfiltered =
                        renderedUnfiltered.unfilterValues;
                }
            }

            // if we havent set up a filter yet, and there are no values in the filter,
            // renderedUnfiltered needs to be blank becuase the user has yet to select anything
            if (
                !currentFilter.unfilterFrame &&
                renderedFiltered.filterValues.length === 0
            ) {
                currentFilter.renderedUnfiltered = [];
                currentFilter.unfilterFrame = true;
            }

            currentFilter.renderedAll = currentFilter.renderedAll.filter(
                function (item, idx, self) {
                    return self.indexOf(item) === idx;
                }
            );
            currentFilter.renderedAll.sort(function (a, b) {
                if (!isNaN(a) && !isNaN(b)) {
                    return a - b;
                }

                if (a < b) {
                    return -1;
                }

                if (a > b) {
                    return 1;
                }

                return 0;
            });

            if (currentFilter.search !== scope.dashFilterList.prevSearch) {
                if (
                    scope.dashFilterList.filter.renderedAll.length !==
                    scope.dashFilterList.filter.selectedAll.length
                ) {
                    scope.dashFilterList.filter.selectAll = false;
                }
            }

            scope.dashFilterList.prevSearch = currentFilter.search;

            // update filter control variables
            currentFilter.offsetFiltered = renderedFiltered.offset;
            currentFilter.canCollectFiltered = scope.dashFilter.checkCanCollect(
                renderedFiltered.filterValues,
                currentFilter.limit
            );
            currentFilter.canCollectUnfiltered =
                scope.dashFilter.checkCanCollect(
                    renderedUnfiltered.unfilterValues,
                    currentFilter.limit
                );
            scope.dashFilterList.filter.selectedUnfiltered =
                semossCoreService.utility.freeze(
                    scope.dashFilterList.filter.renderedUnfiltered
                );

            checkSelected();
        }

        /**
         * @name checkSelected
         * @desc determines if a filter exists, if not nothing should be selected
         * @return {void}
         */
        function checkSelected() {
            const message = semossCoreService.utility.random('meta');

            semossCoreService.once(message, (payload) => {
                const filters = payload.pixelReturn[0].output;
                let filterExists = false;

                // if select all is checked then we assume there are filters
                if (scope.dashFilterList.filter.selectAll) {
                    filterExists = true;
                }

                filters.forEach((filter) => {
                    if (
                        filter.filterObj &&
                        filter.filterObj &&
                        filter.filterObj.left &&
                        filter.filterObj.left.value ===
                            scope.dashFilterList.column
                    ) {
                        filterExists = true;
                    }
                });

                // to prevent flicker, need to handle selectedAll here
                if (!filterExists) {
                    scope.dashFilterList.filter.selectedAll = [];
                } else if (
                    scope.dashFilterList.filter.selectedAll.length === 0
                ) {
                    // we have closed component, need to reinstate selectedAll
                    scope.dashFilterList.filter.selectedAll =
                        semossCoreService.utility.freeze(
                            scope.dashFilterList.filter.renderedUnfiltered
                        );
                }
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.widgetCtrl.insightID,
                commandList: [
                    {
                        meta: true,
                        type: 'variable',
                        components: [scope.dashFilterList.filter.frame],
                    },
                    {
                        type: 'getFrameFilters',
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        function initialize() {
            updateFilter();
            updateComponentListener = scope.widgetCtrl.on(
                'update-dashboard-filter-legacy-component',
                updateFilter.bind(null, false)
            );
            unfilterComponentLister = scope.widgetCtrl.on(
                'unfilter-dashboard-filter-legacy-component',
                function () {
                    scope.dashFilterList.filter.selectAll = false;
                }
            );
            scope.$on('$destroy', destroy);
        }

        function destroy() {
            updateComponentListener();
            unfilterComponentLister();
        }

        initialize();
    }
}
