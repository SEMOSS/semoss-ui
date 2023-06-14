'use strict';

export default angular
    .module('app.dashboard-filter-legacy-slider.directive', [])
    .directive('dashboardFilterLegacySlider', dashFilterSliderDirective);

dashFilterSliderDirective.$inject = ['$timeout', 'semossCoreService'];

function dashFilterSliderDirective($timeout, semossCoreService) {
    dashboardFilterSliderLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^widget', '^dashboardFilterLegacy'],
        controllerAs: 'dashFilterSlider',
        bindToController: {
            column: '=',
            auto: '=',
        },
        template: require('./dashboard-filter-legacy-slider.directive.html'),
        controller: dashboardFilterSliderCtrl,
        link: dashboardFilterSliderLink,
    };

    function dashboardFilterSliderCtrl() {}

    function dashboardFilterSliderLink(scope, ele, attrs, ctrl) {
        var sliderTimeout, updateComponentListener;

        scope.widgetCtrl = ctrl[0];
        scope.dashFilter = ctrl[1];

        scope.dashFilterSlider.filter = {
            init: false,
        };

        scope.dashFilterSlider.applyFilter = applyFilter;
        scope.dashFilterSlider.applyFilterIfAuto = applyFilterIfAuto;

        /**
         * @name applyFilter
         * @desc runs pixel for filter
         * @return {void}
         */
        function applyFilter() {
            var col = scope.dashFilterSlider.column,
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
            var filter = scope.dashFilterSlider.filter,
                components = [
                    {
                        type: 'variable',
                        components: [filter.frame],
                    },
                ],
                component = {
                    type: 'setFrameFilter',
                    components: [
                        [
                            {
                                type: 'range',
                                alias: col,
                                values: filter.selectedRange,
                            },
                        ],
                    ],
                    terminal: true,
                };

            if (filter.categorical) {
                component.components[0] = 'value';
                component.components[2] = '==';
            }

            components.push(component);

            return components;
        }

        /**
         * @name applyFilterIfAutod
         * @desc runs the filter if auto
         * @return {void}
         */
        function applyFilterIfAuto() {
            if (scope.dashFilterSlider.auto) {
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
            var renderedFiltered,
                renderedUnfiltered,
                selectedRange,
                filter = scope.dashFilterSlider.filter,
                frame =
                    scope.dashFilter.filter[scope.dashFilterSlider.column]
                        .frame;

            if (filter.init) {
                renderedFiltered = filter.renderedFiltered;
                renderedUnfiltered = filter.renderedUnfiltered;
                selectedRange = filter.selectedRange;
            }

            scope.dashFilterSlider.filter = {
                init: true,
                renderedFiltered: renderedFiltered || [],
                renderedUnfiltered: renderedUnfiltered || [],
                selectedRange: selectedRange || [],
                limit: 50,
                frame: frame || scope.widgetCtrl.getFrame('name'),
            };
        }

        /**
         * @name updateFilter
         * @desc main function that requests, resets and then sets filter
         * @return {void}
         */
        function updateFilter() {
            var message = semossCoreService.utility.random(
                scope.dashFilterSlider.column
            );
            resetFilter();
            semossCoreService.once(message, setFilter);

            // emits the message
            scope.dashFilter.getInstances(
                message,
                scope.dashFilterSlider.column,
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
            var renderedFiltered = payload.pixelReturn[0].output,
                renderedUnfiltered = payload.pixelReturn[1].output,
                minMax = payload.pixelReturn[2].output.minMax,
                currentFilter = scope.dashFilterSlider.filter;

            currentFilter.renderedUnfiltered =
                renderedUnfiltered.unfilterValues;
            currentFilter.renderedFiltered = renderedFiltered.filterValues;

            currentFilter.offsetFiltered = renderedFiltered.offset;
            currentFilter.offsetUnfiltered = renderedUnfiltered.offset;

            if (minMax) {
                currentFilter.categorical = false;
                currentFilter.selectedRange = [minMax.min, minMax.max];
                currentFilter.minMax = minMax;
            } else {
                currentFilter.categorical = true;
                currentFilter.categoricalHeaders =
                    currentFilter.renderedUnfiltered
                        .concat(currentFilter.renderedFiltered)
                        .sort();
                currentFilter.selectedRange = currentFilter.renderedUnfiltered;
            }

            scope.dashFilter.filter[
                scope.dashFilterSlider.column
            ].loading = false;
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
