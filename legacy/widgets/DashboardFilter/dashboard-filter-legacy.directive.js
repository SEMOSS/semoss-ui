'use strict';

import './dashboard-filter-legacy.scss';

import './dashboard-filter-legacy.directive.js';
import './dashboard-filter-legacy-list.directive.js';
import './dashboard-filter-legacy-list-single.directive.js';
import './dashboard-filter-legacy-slider.directive.js';
import './dashboard-filter-legacy-slider-single.directive.js';

export default angular
    .module('app.dashboard-filter-legacy.directive', [
        'app.dashboard-filter-legacy-list.directive',
        'app.dashboard-filter-legacy-list-single.directive',
        'app.dashboard-filter-legacy-slider.directive',
        'app.dashboard-filter-legacy-slider-single.directive',
    ])
    .directive('dashboardFilterLegacy', dashboardFilterDirective);

dashboardFilterDirective.$inject = ['semossCoreService'];

function dashboardFilterDirective(semossCoreService) {
    dashboardFilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget', '^insight'],
        controllerAs: 'dashboardFilter',
        bindToController: {},
        template: require('./dashboard-filter-legacy.directive.html'),
        controller: dashboardFilterCtrl,
        link: dashboardFilterLink,
    };

    function dashboardFilterCtrl() {}

    function dashboardFilterLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.insightCtrl = ctrl[1];

        var filterUpdateTaskListener,
            filterUpdateFrameListener,
            filterUpdateOrnamentListener;

        scope.dashboardFilter.getInstances = getInstances;
        scope.dashboardFilter.insert = insert;
        scope.dashboardFilter.checkCanCollect = checkCanCollect;
        scope.dashboardFilter.applyFilter = applyFilter;
        scope.dashboardFilter.unfilter = unfilter;

        scope.dashboardFilter.busy = false;
        /**
         * @name getInstances
         * @param {string} msg - message being listened for in child
         * @param {string} column - column to get filter values for
         * @param {search} search - search query, if from dashboard-filter-legacy-list 0 is unfiltered search, 1 is filtered search
         * @param {number} limit - how many instances to get
         * @param {number} offsetFiltered - offset for filtered values
         * @param {number} offsetUnfiltered - offset for unfiltered values
         * @desc called from child components to get instances of filtered and unfiltered values
         * @return {void}
         */
        function getInstances(
            msg,
            column,
            search,
            limit,
            offsetFiltered,
            offsetUnfiltered
        ) {
            let frame = scope.dashboardFilter.filter[column].frame;

            if (!frame) {
                frame = scope.widgetCtrl.getWidget('frame');
            }

            if (scope.dashboardFilter.busy) {
                return;
            }

            scope.dashboardFilter.busy = true;
            scope.widgetCtrl.emit('meta-pixel', {
                commandList: [
                    {
                        type: 'variable',
                        components: [frame],
                        meta: true,
                    },
                    {
                        type: 'frameFilterModelFilteredValues',
                        components: [
                            column,
                            search.replace(/ /g, '_'),
                            limit,
                            offsetFiltered,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'variable',
                        components: [frame],
                        meta: true,
                    },
                    {
                        type: 'frameFilterModelVisibleValues',
                        components: [
                            column,
                            search.replace(/ /g, '_'),
                            limit,
                            offsetUnfiltered,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'variable',
                        components: [frame],
                        meta: true,
                    },
                    {
                        type: 'frameFilterModelNumericRange',
                        components: [column],
                        terminal: true,
                    },
                ],
                insightID: scope.widgetCtrl.insightID,
                listeners: [scope.widgetCtrl.widgetId],
                response: msg,
            });
        }

        function insert(selectedValue, arr) {
            var i,
                values = semossCoreService.utility.freeze(arr);
            for (i = 0; i < values.length; i++) {
                if (i === 0 && selectedValue < values[i]) {
                    values.unshift(selectedValue);

                    break;
                } else if (
                    i === values.length - 1 &&
                    selectedValue > values[i]
                ) {
                    values.push(selectedValue);

                    break;
                } else if (
                    selectedValue >= values[i - 1] &&
                    selectedValue <= values[i]
                ) {
                    values = values
                        .slice(0, i)
                        .concat(selectedValue)
                        .concat(values.slice(i));

                    break;
                }
            }

            if (values.length === 0) {
                values.push(selectedValue);
            }

            return semossCoreService.utility.freeze(values);
        }

        /**
         * @name checkCanCollect
         * @param {array} d - filter model return data
         * @param {number} limit - limit on instances can be be collected at once
         * @desc checks whether to enable can collect variable for infinite filter
         * @returns {boolean} - can collect or not
         */
        function checkCanCollect(d, limit) {
            return d.length === limit;
        }

        /**
         * @name applyFilter
         * @param {string} alias - aliased filter to select
         * @param {array} filterPixelComponentList - pixel for filter
         * @desc takes current filter options and sends them to sheet to update visualization data
         * @returns {void}
         */
        function applyFilter(alias, filterPixelComponentList) {
            if (filterPixelComponentList.length > 0) {
                var insightID = scope.insightCtrl.insightID,
                    // frame = scope.dashboardFilter.filter[alias].frame,
                    frameList = Object.keys(
                        semossCoreService.getShared(
                            scope.widgetCtrl.insightID,
                            'frames'
                        )
                    ),
                    frameIdx,
                    pixel = '';

                // update component list to be proper frame
                // filterPixelComponentList[0].components = [frame];
                for (frameIdx = 0; frameIdx < frameList.length; frameIdx++) {
                    pixel += semossCoreService.pixel.build([
                        {
                            type: 'if',
                            components: [
                                [
                                    {
                                        type: 'frameHeaderExists',
                                        components: [
                                            frameList[frameIdx],
                                            alias,
                                        ],
                                        terminal: true,
                                    },
                                ],
                                filterPixelComponentList[frameIdx],
                                [],
                            ],
                            terminal: true,
                        },
                    ]);
                }

                semossCoreService.emit('execute-pixel', {
                    insightID,
                    commandList: [
                        {
                            type: 'Pixel',
                            components: [pixel],
                            terminal: true,
                        },
                        {
                            type: 'refreshInsight',
                            components: [insightID],
                            terminal: true,
                        },
                    ],
                });
            }
        }

        /**
         * @name unfilter
         * @param {string} col - name of column to unfilter
         * @return {void}
         */
        function unfilter(col) {
            var insightID = scope.insightCtrl.insightID,
                pixel = '',
                frameList = Object.keys(
                    semossCoreService.getShared(
                        scope.widgetCtrl.insightID,
                        'frames'
                    )
                ),
                frameIdx;

            for (frameIdx = 0; frameIdx < frameList.length; frameIdx++) {
                pixel += semossCoreService.pixel.build([
                    {
                        type: 'variable',
                        components: [frameList[frameIdx]],
                    },
                    {
                        type: 'unfilterFrame',
                        components: [col],
                        terminal: true,
                    },
                ]);
            }

            scope.widgetCtrl.emit('unfilter-dashboard-filter-legacy-component');
            semossCoreService.emit('execute-pixel', {
                insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                    {
                        type: 'refreshInsight',
                        components: [insightID],
                        terminal: true,
                    },
                ],
            });
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var dashObj = scope.widgetCtrl.getWidget(
                    'view.DashboardFilter.dashboardFilter'
                ),
                len,
                i;

            scope.dashboardFilter.isAuto = scope.widgetCtrl.getWidget(
                'view.DashboardFilter.options.autoRun'
            );

            if (dashObj) {
                len = dashObj.instances.length;
                i = 0;

                // set selected
                scope.dashboardFilter.selected = dashObj.instances;

                // create the filter obj
                scope.dashboardFilter.filter = {};

                for (i; i < len; i++) {
                    scope.dashboardFilter.filter[
                        scope.dashboardFilter.selected[i]
                    ] = {
                        viewType: dashObj.viewType,
                        singleSelect: dashObj.singleSelect === 'Single Select',
                        frame: dashObj.frame,
                    };
                }
            }

            appendListeners();

            /**
             * @name appendListeners
             * @desc adds listeners if filter is not collapsible
             * @return {void}
             */
            function appendListeners() {
                // append listeners
                if (!filterUpdateFrameListener) {
                    filterUpdateFrameListener = scope.widgetCtrl.on(
                        'update-frame',
                        function () {
                            initialize();
                            scope.widgetCtrl.emit(
                                'update-dashboard-filter-legacy-component'
                            );
                        }
                    );
                }

                if (!filterUpdateTaskListener) {
                    filterUpdateTaskListener = scope.widgetCtrl.on(
                        'update-frame-filter',
                        function () {
                            initialize();
                            scope.widgetCtrl.emit(
                                'update-dashboard-filter-legacy-component'
                            );
                        }
                    );
                }

                filterUpdateOrnamentListener = scope.widgetCtrl.on(
                    'update-ornaments',
                    function () {
                        if (!scope.dashboardFilter.selected) {
                            initialize();
                            scope.widgetCtrl.emit(
                                'update-dashboard-filter-legacy-component'
                            );
                        }
                    }
                );
            }
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying scope.dashboardFilter...');
            if (filterUpdateTaskListener) {
                filterUpdateTaskListener();
            }
            if (filterUpdateFrameListener) {
                filterUpdateFrameListener();
            }
            if (filterUpdateOrnamentListener) {
                filterUpdateOrnamentListener();
            }
        });
    }
}
