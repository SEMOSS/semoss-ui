'use strict';

export default angular
    .module('app.dashboard-filter-legacy-slider-single.directive', [])
    .directive(
        'dashboardFilterLegacySliderSingle',
        dashFilterSliderSingleDirective
    );

dashFilterSliderSingleDirective.$inject = ['$timeout', 'semossCoreService'];

function dashFilterSliderSingleDirective($timeout, semossCoreService) {
    dashboardFilterSliderSingleLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^widget', '^dashboardFilterLegacy'],
        controllerAs: 'dashFilterSS',
        bindToController: {
            column: '=',
            auto: '=',
        },
        template: require('./dashboard-filter-legacy-slider-single.directive.html'),
        controller: dashboardFilterSliderSingleCtrl,
        link: dashboardFilterSliderSingleLink,
    };

    function dashboardFilterSliderSingleCtrl() {}

    function dashboardFilterSliderSingleLink(scope, ele, attrs, ctrl) {
        var sliderTimeout, updateComponentListener;

        scope.widgetCtrl = ctrl[0];
        scope.dashFilter = ctrl[1];

        scope.dashFilterSS.filter = {
            init: false,
        };

        scope.dashFilterSS.applyFilter = applyFilter;
        scope.dashFilterSS.applyFilterIfAuto = applyFilterIfAuto;

        /**
         * @name applyFilter
         * @desc runs pixel for filter
         * @return {void}
         */
        function applyFilter() {
            let col = scope.dashFilterSS.column,
                pixelComponents = buildPixelComponents(col);

            scope.dashFilter.applyFilter(col, pixelComponents);
        }

        /**
         * @name buildPixelComponents
         * @param {string} col - column name
         * @desc builds the pixel for the filter
         * @return {array} the pixel components
         */
        function buildPixelComponents(col) {
            let filter = scope.dashFilterSS.filter,
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
                                values: filter.selectedRange,
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
            if (scope.dashFilterSS.auto) {
                if (sliderTimeout) {
                    $timeout.cancel(sliderTimeout);
                }
                sliderTimeout = $timeout(function () {
                    applyFilter();
                    $timeout.cancel(sliderTimeout);
                }, 250);
            }
        }

        /**
         * @name resetFilter
         * @desc resets filter object
         * @return {void}
         */
        function resetFilter() {
            let renderedFiltered,
                renderedUnfiltered,
                selectedRange,
                categoricalHeaders,
                filter = scope.dashFilterSS.filter,
                frame =
                    scope.dashFilter.filter[scope.dashFilterSS.column].frame;

            if (filter.init) {
                renderedFiltered = filter.renderedFiltered;
                renderedUnfiltered = filter.renderedUnfiltered;
                selectedRange = filter.selectedRange;
                categoricalHeaders = filter.categoricalHeaders;
            }

            scope.dashFilterSS.filter = {
                init: true,
                renderedFiltered: renderedFiltered || [],
                renderedUnfiltered: renderedUnfiltered || [],
                limit: 50,
                selectedRange: selectedRange || [],
                categoricalHeaders: categoricalHeaders || [],
                frame: frame || scope.widgetCtrl.getFrame('name'),
            };
        }

        /**
         * @name updateFilter
         * @desc main function that requests, resets and then sets filter
         * @return {void}
         */
        function updateFilter() {
            let message = semossCoreService.utility.random(
                scope.dashFilterSS.column
            );
            resetFilter();
            semossCoreService.once(message, setFilter);

            // emits the message
            scope.dashFilter.getInstances(
                message,
                scope.dashFilterSS.column,
                '', // search
                50, // limit
                0, // offset filtered
                0 // offset unfiltered
            );
        }

        /**
         * @name setFilter
         * @param {object} payload - instances returned from filter pixel
         * @desc sets appropriate (un)filtered values
         * @return {void}
         */
        function setFilter(payload) {
            let renderedFiltered = payload.pixelReturn[0].output,
                renderedUnfiltered = payload.pixelReturn[1].output,
                currentFilter = scope.dashFilterSS.filter;

            currentFilter.renderedUnfiltered =
                renderedUnfiltered.unfilterValues;
            currentFilter.renderedFiltered = renderedFiltered.filterValues;

            currentFilter.offsetFiltered = renderedFiltered.offset;
            currentFilter.offsetUnfiltered = renderedUnfiltered.offset;

            currentFilter.categoricalHeaders = currentFilter.renderedUnfiltered
                .concat(currentFilter.renderedFiltered)
                .sort();
            currentFilter.selectedRange = currentFilter.renderedUnfiltered[0];

            scope.dashFilter.filter[scope.dashFilterSS.column].loading = false;
        }

        function initialize() {
            updateFilter();
            updateComponentListener = scope.widgetCtrl.on(
                'update-dashboard-filter-legacy-component',
                updateFilter
            );
            scope.$on('$destroy', updateComponentListener);
        }

        initialize();
    }
}
