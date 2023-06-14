'use strict';

export default angular
    .module('app.edit-x-axis.directive', [])
    .directive('editXAxis', editXAxisDirective);

editXAxisDirective.$inject = ['$timeout'];

function editXAxisDirective($timeout) {
    editXAxisCtrl.$inject = [];
    editXAxisLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'editXAxis',
        bindToController: {},
        template: require('./edit-x-axis.directive.html'),
        controller: editXAxisCtrl,
        link: editXAxisLink,
    };

    function editXAxisCtrl() {}

    function editXAxisLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var editXAxisUpdateFrameListener,
            editXAxisUpdateTaskListener,
            updateOrnamentsListener,
            searchTimeout,
            rangeTimeout;

        // variables
        let defaultFontSize = 12;
        scope.editXAxis.title = {};
        scope.editXAxis.centerTitle = false;
        scope.editXAxis.format = {
            type: 'Default',
            delimiter: 'Default',
            prepend: '',
            append: '',
            maxLength: 10,
            wordWrap: false,
        };
        scope.editXAxis.rotate = 0;
        scope.editXAxis.formatOptions = {
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
        scope.editXAxis.max = {
            show: false,
        };
        scope.editXAxis.min = {
            show: false,
        };

        // functions
        scope.editXAxis.updateTitle = updateTitle;
        scope.editXAxis.updateRotate = updateRotate;
        scope.editXAxis.updateNameGap = updateNameGap;
        scope.editXAxis.updateRange = updateRange;
        scope.editXAxis.execute = execute;
        scope.editXAxis.resetTool = resetTool;

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
            defaultFontSize = Number(
                sharedTools.fontSize.substring(
                    0,
                    sharedTools.fontSize.indexOf('p')
                )
            );

            scope.editXAxis.groupBy = groupBy;
            scope.editXAxis.layout = layout;
            scope.editXAxis.keys = keys;

            if (sharedTools.editXAxis) {
                scope.editXAxis.title.name = sharedTools.editXAxis.title.name;
                scope.editXAxis.title.show = sharedTools.editXAxis.title.show;
                scope.editXAxis.nameGap = sharedTools.editXAxis.nameGap;
                scope.editXAxis.values = sharedTools.editXAxis.values;
                scope.editXAxis.line = sharedTools.editXAxis.line;
                scope.editXAxis.min = sharedTools.editXAxis.min;
                scope.editXAxis.max = sharedTools.editXAxis.max;
                scope.editXAxis.rotate = sharedTools.editXAxis.rotate;
                scope.editXAxis.format = sharedTools.editXAxis.format;
                scope.editXAxis.showAllXValues =
                    sharedTools.editXAxis.showAllXValues;
                scope.editXAxis.fontSize = sharedTools.editXAxis.fontSize
                    ? sharedTools.editXAxis.fontSize
                    : defaultFontSize;
                scope.editXAxis.showTicks =
                    typeof sharedTools.editXAxis.showTicks === 'boolean'
                        ? sharedTools.editXAxis.showTicks
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
            var showLine = true,
                labelRotation = 0,
                nameGap = 25,
                showAllXValues = false,
                key;

            switch (scope.editXAxis.layout) {
                case 'Scatter':
                case 'SingleAxisCluster':
                    for (key in scope.editXAxis.keys) {
                        if (scope.editXAxis.keys[key].model === 'x') {
                            scope.editXAxis.originalTitle =
                                scope.editXAxis.keys[key].alias;
                            break;
                        }
                    }
                    break;
                case 'HeatMap':
                    for (key in scope.editXAxis.keys) {
                        if (scope.editXAxis.keys[key].model === 'x') {
                            scope.editXAxis.originalTitle =
                                scope.editXAxis.keys[key].alias;
                            break;
                        }
                    }
                    if (scope.editXAxis.layout === 'HeatMap') {
                        showLine = false;
                        labelRotation = 315;
                        nameGap = 17;
                    }
                    break;
                default:
                    for (key in scope.editXAxis.keys) {
                        if (scope.editXAxis.keys[key].model === 'label') {
                            scope.editXAxis.originalTitle =
                                scope.editXAxis.keys[key].alias;
                            break;
                        }
                    }
            }

            scope.editXAxis.title.show = true;
            scope.editXAxis.centerTitle = false;
            scope.editXAxis.values = true;
            scope.editXAxis.line = showLine;
            scope.editXAxis.title.name = cleanValue(
                scope.editXAxis.originalTitle
            );
            scope.editXAxis.nameGap = nameGap;
            scope.editXAxis.rotate = labelRotation;
            scope.editXAxis.min = {
                show: false,
            };
            scope.editXAxis.max = {
                show: false,
            };
            scope.editXAxis.format = {
                type: 'Default',
                delimiter: 'Default',
                prepend: '',
                append: '',
                maxLength: 10,
                wordWrap: false,
            };
            scope.editXAxis.showAllXValues = showAllXValues;
            scope.editXAxis.fontSize = defaultFontSize;
            scope.editXAxis.showTicks = false;
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
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            searchTimeout = $timeout(function () {
                execute();
            }, 800);
        }

        /**
         * @name updateRotate
         * @desc setting a delay to when the slider should make the change call
         * @returns {void}
         */
        function updateRotate() {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            searchTimeout = $timeout(function () {
                execute();
            }, 500);
        }

        /**
         * @name updateNameGap
         * @desc setting a delay to when the slider should make the change call
         * @returns {void}
         */
        function updateNameGap() {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            searchTimeout = $timeout(function () {
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
                xMin = scope.editXAxis.min.value,
                xMax = scope.editXAxis.max.value,
                showTicks = scope.editXAxis.line
                    ? scope.editXAxis.showTicks
                    : false;

            if (scope.editXAxis.min.value === null) {
                xMin = undefined;
            }

            if (scope.editXAxis.max.value === null) {
                xMax = undefined;
            }

            newTool.editXAxis = {
                title: scope.editXAxis.title,
                centerTitle: scope.editXAxis.centerTitle,
                values: scope.editXAxis.values,
                line: scope.editXAxis.line,
                format: scope.editXAxis.format,
                rotate: scope.editXAxis.rotate,
                nameGap: scope.editXAxis.nameGap,
                min: {
                    show: scope.editXAxis.min.show,
                    value: xMin,
                },
                max: {
                    show: scope.editXAxis.max.show,
                    value: xMax,
                },
                showAllXValues: scope.editXAxis.showAllXValues,
                fontSize: scope.editXAxis.fontSize,
                showTicks: showTicks,
            };

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

            newTool.editXAxis = false;

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
            editXAxisUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            editXAxisUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                editXAxisUpdateFrameListener();
                editXAxisUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
