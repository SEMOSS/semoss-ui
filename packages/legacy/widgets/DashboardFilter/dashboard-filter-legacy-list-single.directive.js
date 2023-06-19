'use strict';

export default angular
    .module('app.dashboard-filter-legacy-list-single.directive', [])
    .directive(
        'dashboardFilterLegacyListSingle',
        dashFilterListSingleDirective
    );

dashFilterListSingleDirective.$inject = ['$timeout', 'semossCoreService'];

function dashFilterListSingleDirective($timeout, semossCoreService) {
    dashboardFilterListSingleLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^widget', '^dashboardFilterLegacy'],
        controllerAs: 'dashFilterLS',
        bindToController: {
            column: '=',
            auto: '=',
        },
        template: require('./dashboard-filter-legacy-list-single.directive.html'),
        controller: dashboardFilterListSingleCtrl,
        link: dashboardFilterListSingleLink,
    };

    function dashboardFilterListSingleCtrl() {}

    function dashboardFilterListSingleLink(scope, ele, attrs, ctrl) {
        var searchTimeout, updateComponentListener;
        scope.widgetCtrl = ctrl[0];
        scope.dashFilter = ctrl[1];

        scope.dashFilterLS.filter = {
            init: false,
        };
        // if true, the previous state is filtered
        // otherwise the previous state is unfiltered
        scope.dashFilterLS.previousFilterState = false;

        scope.dashFilterLS.applyFilter = applyFilter;
        scope.dashFilterLS.applyFilterIfAuto = applyFilterIfAuto;
        scope.dashFilterLS.getMoreInstances = getMoreInstances;
        scope.dashFilterLS.search = search;

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
                var currentFilter = scope.dashFilterLS.filter;

                // reset vars
                currentFilter.offsetFiltered = 0;
                currentFilter.offsetUnfiltered = 0;
                currentFilter.canCollectFiltered = true;
                currentFilter.canCollectUnfiltered = true;
                updateFilter();
                $timeout.cancel(searchTimeout);
            }, 500);
        }

        /**
         * @name getMoreInstances
         * @param {string} alias - aliased filter value
         * @param {boolean} unfiltered - if true, user is scrolling in unfiltered values list
         * @desc get the next set of instances
         * @returns {void}
         */
        function getMoreInstances() {
            var filter = scope.dashFilterLS.filter;
            if (filter.canCollectUnfiltered) {
                filter.offsetUnfiltered += filter.limit;
                updateFilter(true);
            }

            if (filter.canCollectFiltered) {
                filter.offsetFiltered += filter.limit;
                updateFilter(true);
            }
        }

        /**
         * @name buildPixelComponents
         * @param {string} col - column name
         * @desc builds the pixel for the filter
         * @return {array} the pixel components
         */
        function applyFilter() {
            var col = scope.dashFilterLS.column,
                pixelComponents = buildPixelComponents(col);

            scope.dashFilter.applyFilter(col, pixelComponents);
        }

        function buildPixelComponents(col) {
            var filter = scope.dashFilterLS.filter,
                components = [];

            components.push(
                {
                    type: 'variable',
                    components: [filter.frame],
                },
                {
                    type: 'setFrameFilter',
                    components: [
                        [
                            {
                                type: 'value',
                                alias: col,
                                comparator: '==',
                                values: filter.selectedUnfiltered,
                            },
                        ],
                    ],
                    terminal: true,
                }
            );

            return components;
        }

        /**
         * @name applyFilterIfAuto
         * @desc runs the filter if auto
         * @return {void}
         */
        function applyFilterIfAuto() {
            if (scope.dashFilterLS.auto) {
                applyFilter();
            }
        }

        /**
         * @name resetFilter
         * @desc resets filter object
         * @return {void}
         */
        function resetFilter() {
            var renderedFiltered,
                renderedUnfiltered,
                selectedUnfiltered,
                filter = scope.dashFilterLS.filter,
                frame =
                    scope.dashFilter.filter[scope.dashFilterLS.column].frame,
                filterSearch,
                offsetFiltered,
                offsetUnfiltered,
                canCollectFiltered,
                canCollectUnfiltered;

            if (filter.init) {
                renderedFiltered = filter.renderedFiltered;
                renderedUnfiltered = filter.renderedUnfiltered;
                selectedUnfiltered = filter.selectedUnfiltered;
                offsetUnfiltered = filter.offsetUnfiltered;
                offsetFiltered = filter.offsetFiltered;
                filterSearch = filter.search;
                canCollectFiltered = filter.canCollectFiltered;
                canCollectUnfiltered = filter.canCollectUnfiltered;
            }

            scope.dashFilterLS.filter = {
                init: true,
                selectedUnfiltered: selectedUnfiltered || [],
                renderedFiltered: renderedFiltered || [],
                renderedUnfiltered: renderedUnfiltered || [],
                search: filterSearch || '',
                limit: 50,
                offsetFiltered: offsetFiltered || 0,
                offsetUnfiltered: offsetUnfiltered || 0,
                canCollectFiltered: canCollectFiltered || true,
                canCollectUnfiltered: canCollectUnfiltered || true,
                frame: frame || scope.widgetCtrl.getFrame('name'),
            };
        }

        /**
         * @name updateFilter
         * @param {string} onScroll - if user has scrolled, if so from filter list ('filter') or unfilter list ('unfilter')
         * @desc main function that requests, resets and then sets filter
         * @return {void}
         */
        function updateFilter(onScroll) {
            var message = semossCoreService.utility.random(
                    scope.dashFilterLS.column
                ),
                filter;

            resetFilter();
            filter = scope.dashFilterLS.filter;

            semossCoreService.once(message, setFilter.bind(null, onScroll));

            if (filter.selectedUnfiltered.length === 1) {
                if (!scope.dashFilterLS.previousFilterState) {
                    filter.offsetFiltered = filter.offsetUnfiltered;
                    scope.dashFilterLS.previousFilterState = true;
                }
                filter.offsetUnfiltered = 0;
            }

            scope.dashFilter.getInstances(
                message,
                scope.dashFilterLS.column,
                filter.search,
                filter.limit,
                filter.offsetFiltered,
                filter.offsetUnfiltered
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
            var notInFrame = payload.pixelReturn[0].output,
                inFrame = payload.pixelReturn[1].output,
                currentFilter = scope.dashFilterLS.filter,
                selectedValue;

            // allow to get more instances now (for infinite scroll to prevent multiple get instances to run)
            scope.dashFilter.busy = false;
            // this means we have reset and do not want to add to currentFilter.renderedUnfiltered
            if (notInFrame.filterValues.length === 0 && inFrame.offset === 0) {
                currentFilter.renderedUnfiltered = inFrame.unfilterValues;
            } else {
                currentFilter.renderedUnfiltered =
                    currentFilter.renderedUnfiltered.concat(
                        inFrame.unfilterValues
                    );
            }

            if (!currentFilter.search && inFrame.unfilterValues.length === 1) {
                selectedValue = inFrame.unfilterValues[0];
                currentFilter.renderedUnfiltered =
                    currentFilter.renderedUnfiltered.concat(
                        notInFrame.filterValues.concat(inFrame.unfilterValues)
                    );
                currentFilter.renderedUnfiltered =
                    currentFilter.renderedUnfiltered.filter(
                        (item, idx, self) => {
                            return self.indexOf(item) === idx;
                        }
                    );
                currentFilter.renderedUnfiltered.sort(function (a, b) {
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
                // scope.dashFilter.insert(selectedValue, notInFrame.renderedUnfiltered);
                currentFilter.selectedUnfiltered = [selectedValue];
            } else if (currentFilter.search) {
                // user is searching
                currentFilter.renderedUnfiltered =
                    inFrame.unfilterValues.concat(notInFrame.filterValues);
            } else {
                currentFilter.selectedUnfiltered = [];
            }

            currentFilter.offsetFiltered = notInFrame.offset;
            currentFilter.offsetUnfiltered = inFrame.offset;
            currentFilter.canCollectUnfiltered =
                scope.dashFilter.checkCanCollect(
                    inFrame.unfilterValues,
                    currentFilter.limit
                );
            currentFilter.canCollectFiltered = scope.dashFilter.checkCanCollect(
                notInFrame.filterValues,
                currentFilter.limit
            );
            scope.dashFilter.filter[scope.dashFilterLS.column].loading = false;
        }

        function initialize() {
            updateFilter();

            updateComponentListener = scope.widgetCtrl.on(
                'update-dashboard-filter-legacy-component',
                updateFilter.bind(null, false)
            );
            scope.$on('$destroy', updateComponentListener);
        }

        initialize();
    }
}
