'use strict';

import './facet-headers.scss';

export default angular
    .module('app.facetHeaders.directive', [])
    .directive('facetHeaders', facetHeadersDirective);

facetHeadersDirective.$inject = ['$timeout'];

function facetHeadersDirective($timeout) {
    facetHeadersCtrl.$inject = [];
    facetHeadersLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'facetHeaders',
        bindToController: {},
        template: require('./facet-headers.directive.html'),
        controller: facetHeadersCtrl,
        link: facetHeadersLink,
    };

    function facetHeadersCtrl() {}

    function facetHeadersLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var updateTaskListener, updateFrameListener, searchTimeout;

        // Functions
        scope.facetHeaders.updateLayout = updateLayout;
        scope.facetHeaders.setDimensions = setDimensions;
        scope.facetHeaders.updateTitle = updateTitle;
        scope.facetHeaders.toggleCustomLayout = toggleCustomLayout;
        scope.facetHeaders.changeUnitType = changeUnitType;

        // Properties
        scope.facetHeaders.groupByInfo = false;
        scope.facetHeaders.titleName = '';
        scope.facetHeaders.titleFontSize = '';
        scope.facetHeaders.headerFontSize = '';
        scope.facetHeaders.customLayout = false;
        scope.facetHeaders.commonAxis = true;
        scope.facetHeaders.unitType = 'px';
        scope.facetHeaders.availableUnitTypes = [
            {
                display: 'pixels',
                value: 'px',
            },
            {
                display: 'percentage',
                value: '%',
            },
        ];
        scope.facetHeaders.unitMin = 200;
        scope.facetHeaders.unitMax = 500;
        scope.facetHeaders.unitspacingMin = 0;
        scope.facetHeaders.unitspacingMax = 200;
        scope.facetHeaders.selectedLayout = null;
        scope.facetHeaders.grid = {
            width: 200,
            height: 200,
        };
        scope.facetHeaders.spacing = {
            x: 60,
            y: 60,
        };

        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var layerIndex = 0,
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                );

            scope.facetHeaders.selectedLayout = selectedLayout;
            scope.facetHeaders.groupByInfo = groupByInfo;

            if (groupByInfo && groupByInfo.viewType === 'All Instances') {
                scope.facetHeaders.numInstances =
                    scope.facetHeaders.groupByInfo.uniqueInstances.length;
                scope.facetHeaders.titleName =
                    'All Instances of ' + groupByInfo.selectedDim;
            }

            if (sharedTools.facetHeaders) {
                scope.facetHeaders.titleFontSize =
                    sharedTools.facetHeaders.titleFontSize || 18;
                scope.facetHeaders.headerFontSize =
                    sharedTools.facetHeaders.headerFontSize || 14;
                scope.facetHeaders.titleName =
                    sharedTools.facetHeaders.titleName ||
                    'All Instances of ' + groupByInfo.selectedDim;
                scope.facetHeaders.commonAxis =
                    sharedTools.facetHeaders.commonAxis;
                scope.facetHeaders.numberColumns =
                    sharedTools.facetHeaders.numberColumns || 2;
                scope.facetHeaders.customLayout =
                    sharedTools.facetHeaders.customLayout || false;
                scope.facetHeaders.unitType =
                    sharedTools.facetHeaders.unitType || 'px';

                if (scope.facetHeaders.unitType === '%') {
                    scope.facetHeaders.unitMin = 10;
                    scope.facetHeaders.unitMax = 100;
                    scope.facetHeaders.unitspacingMin = 0;
                    scope.facetHeaders.unitspacingMax = 50;
                }

                scope.facetHeaders.grid = {
                    width: sharedTools.facetHeaders.grid.width || 200,
                    height: sharedTools.facetHeaders.grid.height || 200,
                };
                scope.facetHeaders.spacing = {
                    x: sharedTools.facetHeaders.spacing.x || 60,
                    y: sharedTools.facetHeaders.spacing.y || 60,
                };
            } else {
                resetVariables();
            }
        }

        /**
         * @name resetVariables
         * @desc function that resets the state of facetHeaders variables
         * @returns {void}
         */
        function resetVariables() {
            scope.facetHeaders.titleName =
                'All Instances of ' +
                scope.facetHeaders.groupByInfo.selectedDim;
            scope.facetHeaders.titleFontSize = 18;
            scope.facetHeaders.headerFontSize = 14;
            scope.facetHeaders.commonAxis = true;
            scope.facetHeaders.customLayout = false;
            scope.facetHeaders.numberColumns = 2;
            scope.facetHeaders.unitType = 'px';
            scope.facetHeaders.grid = {
                width: 200,
                height: 200,
            };
            scope.facetHeaders.spacing = {
                x: 60,
                y: 60,
            };
        }

        /**
         * @name changeUnitType
         * @desc update min and max values for dimension inputs
         * @returns {void}
         */
        function changeUnitType() {
            scope.facetHeaders.unitMin = 200;
            scope.facetHeaders.unitMax = 500;
            scope.facetHeaders.unitspacingMin = 0;
            scope.facetHeaders.unitspacingMax = 200;
            scope.facetHeaders.grid = {
                width: 200,
                height: 200,
            };
            scope.facetHeaders.spacing = {
                x: 60,
                y: 60,
            };

            if (scope.facetHeaders.unitType === '%') {
                scope.facetHeaders.unitMin = 10;
                scope.facetHeaders.unitMax = 100;
                scope.facetHeaders.unitspacingMin = 0;
                scope.facetHeaders.unitspacingMax = 50;
                scope.facetHeaders.grid = {
                    width: 20,
                    height: 20,
                };
                scope.facetHeaders.spacing = {
                    x: 5,
                    y: 5,
                };
            }
            updateLayout(false);
        }

        /**
         * @name setRows
         * @desc function that determines number of rows
         * @returns {void}
         */
        function setDimensions() {
            if (scope.facetHeaders.numberColumns < 1) {
                return;
            }
            updateLayout(false);
        }

        /**
         * @name toggleCustomLayout
         * @desc function that changes resets values on toggle of custom layout
         * @returns {void}
         */
        function toggleCustomLayout() {
            if (!scope.facetHeaders.customLayout) {
                scope.facetHeaders.unitType = 'px';
                scope.facetHeaders.unitMin = 200;
                scope.facetHeaders.unitMax = 500;
                scope.facetHeaders.unitspacingMin = 0;
                scope.facetHeaders.unitspacingMax = 200;
                scope.facetHeaders.grid = {
                    width: 200,
                    height: 200,
                };
                scope.facetHeaders.spacing = {
                    x: 60,
                    y: 60,
                };
            }
            updateLayout(false);
        }

        /**
         * @name updateTitle
         * @desc update the axis title when user changes it
         * @returns {void}
         */
        function updateTitle() {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            searchTimeout = $timeout(function () {
                updateLayout(false);
            }, 500);
        }

        /**
         * @name updateLayout
         * @desc execute pixel
         * @param {bool} reset reset (true) or execute changes (false)
         * @return {void}
         */
        function updateLayout(reset) {
            var newTool = {};

            if (reset) {
                resetVariables();
                newTool.facetHeaders = {
                    titleFontSize: 18,
                    headerFontSize: 14,
                    commonAxis: true,
                    customLayout: false,
                    numberColumns: 2,
                    titleName: false,
                    unitType: 'px',
                    grid: {
                        width: 200,
                        height: 200,
                    },
                    spacing: {
                        x: 60,
                        y: 60,
                    },
                };
            } else {
                newTool.facetHeaders = {
                    titleName: scope.facetHeaders.titleName,
                    titleFontSize: scope.facetHeaders.titleFontSize,
                    headerFontSize: scope.facetHeaders.headerFontSize,
                    numberColumns: scope.facetHeaders.numberColumns,
                    commonAxis: scope.facetHeaders.commonAxis,
                    customLayout: scope.facetHeaders.customLayout,
                    unitType: scope.facetHeaders.unitType,
                    grid: scope.facetHeaders.grid,
                    spacing: scope.facetHeaders.spacing,
                };
            }

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                shared: newTool,
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            // listeners
            updateTaskListener = scope.widgetCtrl.on('update-task', resetPanel);
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateTaskListener();
                updateFrameListener();
            });

            resetPanel();
        }

        initialize();
    }
}
