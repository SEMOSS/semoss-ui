'use strict';

export default angular
    .module('app.edit-y-axis.directive', [])
    .directive('editYAxis', editYAxisDirective);

editYAxisDirective.$inject = ['$timeout'];

function editYAxisDirective($timeout) {
    editYAxisCtrl.$inject = [];
    editYAxisLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'editYAxis',
        bindToController: {},
        template: require('./edit-y-axis.directive.html'),
        controller: editYAxisCtrl,
        link: editYAxisLink,
    };

    function editYAxisCtrl() {}

    function editYAxisLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        var editYAxisUpdateFrameListener,
            editYAxisUpdateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            titleTimeout,
            rangeTimeout,
            nameGapTimeout;

        // variables
        scope.editYAxis.title = {};
        scope.editYAxis.max = {
            show: false,
        };
        scope.editYAxis.min = {
            show: false,
        };
        scope.editYAxis.format = {
            type: 'Default',
            delimiter: 'Default',
            prepend: '',
            append: '',
            maxLength: 10,
            wordWrap: false,
        };
        scope.editYAxis.rotate = 0;

        scope.editYAxis.formatOptions = {
            type: {
                list: [
                    {
                        display: 'Default',
                        value: 'Default',
                    },
                    {
                        display: 'Million (e.g. 1.00M)',
                        value: 'Million',
                    },
                    {
                        display: 'Billion (e.g. 1.00B)',
                        value: 'Billion',
                    },
                    {
                        display: 'Trillion (e.g. 1.00T)',
                        value: 'Trillion',
                    },
                    {
                        display: 'Round Whole Number (1000)',
                        value: 'Round Whole Number',
                    },
                    {
                        display: 'Round Tenths (1000.0)',
                        value: 'Round Tenths',
                    },
                    {
                        display: 'Round Hundredth (1000.00)',
                        value: 'Round Hundredth',
                    },
                    {
                        display: 'Short Date (MM/DD)',
                        value: 'Short Date',
                    },
                ],
            },
            delimiter: {
                list: [
                    {
                        display: 'Default',
                        value: 'Default',
                    },
                    {
                        display: 'Comma (1,000)',
                        value: ',',
                    },
                    {
                        display: 'Period (1.000)',
                        value: '.',
                    },
                ],
            },
        };

        // functions
        scope.editYAxis.updateTitle = updateTitle;
        scope.editYAxis.updateRotate = updateRotate;
        scope.editYAxis.updateNameGap = updateNameGap;
        scope.editYAxis.updateRange = updateRange;
        scope.editYAxis.execute = execute;
        scope.editYAxis.resetTool = resetTool;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var layerIndex = 0,
                active = scope.widgetCtrl.getWidget('active'),
                layout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.' + layout
                ),
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                groupBy = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                );

            scope.editYAxis.groupBy = groupBy;
            scope.editYAxis.layout = layout;
            scope.editYAxis.keys = keys;

            if (sharedTools.editYAxis) {
                scope.editYAxis.title.name = sharedTools.editYAxis.title.name;
                scope.editYAxis.title.show = sharedTools.editYAxis.title.show;
                scope.editYAxis.nameGap = sharedTools.editYAxis.nameGap;
                scope.editYAxis.values = sharedTools.editYAxis.values;
                scope.editYAxis.line = sharedTools.editYAxis.line;
                scope.editYAxis.min = sharedTools.editYAxis.min;
                scope.editYAxis.max = sharedTools.editYAxis.max;
                scope.editYAxis.format = sharedTools.editYAxis.format;
                scope.editYAxis.showTicks =
                    typeof sharedTools.editYAxis.showTicks === 'boolean'
                        ? sharedTools.editYAxis.showTicks
                        : false;
            } else {
                getDefaultState();
            }
        }

        /**
         * @name getDefaultState
         * @desc reset scope to default state depending on layout
         * @returns {void}
         */
        function getDefaultState() {
            var valueDimensionCount = 0,
                showLine = true,
                nameGap = 25,
                key;

            switch (scope.editYAxis.layout) {
                case 'Line':
                case 'Column':
                case 'Area':
                case 'Bullet':
                    for (key in scope.editYAxis.keys) {
                        if (scope.editYAxis.keys[key].model === 'value') {
                            scope.editYAxis.originalTitle =
                                scope.editYAxis.keys[key].alias;
                            valueDimensionCount++;
                        }
                    }

                    if (valueDimensionCount > 1) {
                        scope.editYAxis.originalTitle = '';
                        scope.editYAxis.title.show = false;
                    }
                    break;
                case 'Scatter':
                case 'HeatMap':
                    for (key in scope.editYAxis.keys) {
                        if (scope.editYAxis.keys[key].model === 'y') {
                            scope.editYAxis.originalTitle =
                                scope.editYAxis.keys[key].alias;
                            break;
                        }
                    }
                    if (scope.editYAxis.layout === 'HeatMap') {
                        nameGap = 17;
                        showLine = false;
                    }
                    break;
                default:
                    for (key in scope.editYAxis.keys) {
                        if (scope.editYAxis.keys[key].model === 'value') {
                            scope.editYAxis.originalTitle =
                                scope.editYAxis.keys[key].alias;
                            valueDimensionCount++;
                        }
                    }

                    if (valueDimensionCount > 1) {
                        scope.editYAxis.originalTitle = '';
                        scope.editYAxis.title.show = false;
                    }
            }

            scope.editYAxis.title.show = true;
            scope.editYAxis.values = true;
            scope.editYAxis.line = showLine;
            scope.editYAxis.nameGap = nameGap;
            scope.editYAxis.title.name = cleanValue(
                scope.editYAxis.originalTitle
            );
            scope.editYAxis.min = {
                show: false,
            };
            scope.editYAxis.max = {
                show: false,
            };
            scope.editYAxis.format = {
                type: 'Default',
                delimiter: 'Default',
                prepend: '',
                append: '',
                maxLength: 10,
                wordWrap: false,
            };
            scope.editYAxis.showTicks = false;
        }

        function cleanValue(item) {
            if (typeof item === 'string') {
                return item.replace(/_/g, ' ');
            } else if (typeof item === 'number') {
                return item.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                });
            }
            return item;
        }

        /**
         * @name updateTitle
         * @desc update the axis title when user changes it
         * @returns {void}
         */
        function updateTitle() {
            if (titleTimeout) {
                $timeout.cancel(titleTimeout);
            }

            titleTimeout = $timeout(function () {
                execute();
            }, 800);
        }

        /**
         * @name updateRotate
         * @desc setting a delay to when the slider should make the change call
         * @returns {void}
         */
        function updateRotate() {
            if (titleTimeout) {
                $timeout.cancel(titleTimeout);
            }

            titleTimeout = $timeout(function () {
                execute();
            }, 500);
        }

        /**
         * @name updateNameGap
         * @desc setting a delay to when the slider should make the change call
         * @returns {void}
         */
        function updateNameGap() {
            if (nameGapTimeout) {
                $timeout.cancel(nameGapTimeout);
            }

            nameGapTimeout = $timeout(function () {
                execute();
            }, 500);
        }

        /**
         * @name updateRange
         * @desc update the axis title when user changes it
         * @returns {void}
         */
        function updateRange() {
            if (rangeTimeout) {
                $timeout.cancel(rangeTimeout);
            }

            rangeTimeout = $timeout(function () {
                execute();
            }, 800);
        }

        /**
         * @name execute
         * @desc executes the pixel with updated tools settings
         * @returns {void}
         */
        function execute() {
            var newTool = {},
                yMin = scope.editYAxis.min.value,
                yMax = scope.editYAxis.max.value,
                showTicks = scope.editYAxis.line
                    ? scope.editYAxis.showTicks
                    : false;

            if (scope.editYAxis.min.value === null) {
                yMin = undefined;
            }

            if (scope.editYAxis.max.value === null) {
                yMax = undefined;
            }

            newTool.editYAxis = {};
            newTool.editYAxis.title = scope.editYAxis.title;
            newTool.editYAxis.values = scope.editYAxis.values;
            newTool.editYAxis.line = scope.editYAxis.line;
            newTool.editYAxis.rotate = scope.editYAxis.rotate;
            newTool.editYAxis.nameGap = scope.editYAxis.nameGap;
            newTool.editYAxis.min = {
                show: scope.editYAxis.min.show,
                value: yMin,
            };
            newTool.editYAxis.max = {
                show: scope.editYAxis.max.show,
                value: yMax,
            };
            newTool.editYAxis.format = scope.editYAxis.format;
            newTool.editYAxis.showTicks = showTicks;

            // if (edit) {
            //     if (scope.editYAxis.groupBy && scope.editYAxis.groupBy.viewType === 'All Instances') {
            //         scope.widgetCtrl.alert('warn', 'Y-Axis title and values will not appear when Faceting by all instances');
            //         newTool.editYAxis.title.show = false;
            //         newTool.editYAxis.values = false;
            //     }
            // }

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
         * @name resetTool
         * @desc reset tool and execute pixel
         * @returns {void}
         */
        function resetTool() {
            var newTool = {};

            getDefaultState();

            newTool.editYAxis = false;

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
            editYAxisUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            editYAxisUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );
            addDataListener = scope.widgetCtrl.on('added-data', resetPanel);

            // cleanup
            scope.$on('$destroy', function () {
                editYAxisUpdateFrameListener();
                editYAxisUpdateTaskListener();
                updateOrnamentsListener();
                addDataListener();
            });

            resetPanel();
        }

        initialize();
    }
}
