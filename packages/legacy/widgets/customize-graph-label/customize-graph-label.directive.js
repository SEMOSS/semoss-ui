'use strict';

import './customize-graph-label.scss';

export default angular
    .module('app.customize-graph-label.directive', [])
    .directive('customizeGraphLabel', customizeGraphLabelDirective);

customizeGraphLabelDirective.$inject = [];

function customizeGraphLabelDirective() {
    customizeGraphLabelCtrl.$inject = [];
    customizeGraphLabelLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'customizeGraphLabel',
        bindToController: {},
        template: require('./customize-graph-label.directive.html'),
        controller: customizeGraphLabelCtrl,
        link: customizeGraphLabelLink,
    };

    function customizeGraphLabelCtrl() {}

    function customizeGraphLabelLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.customizeGraphLabel.headers = ['All Nodes'];
        scope.customizeGraphLabel.instances = [];
        scope.customizeGraphLabel.availableInstances = [];
        scope.customizeGraphLabel.specifyInstances = false;
        scope.customizeGraphLabel.editStyle = false;
        scope.customizeGraphLabel.fontSize = 12;
        scope.customizeGraphLabel.font = ['sans-serif'];

        // functions
        scope.customizeGraphLabel.executeGroup = executeGroup;
        scope.customizeGraphLabel.getUniqueInstances = getUniqueInstances;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var active = scope.widgetCtrl.getWidget('active'),
                layout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.' + layout
                ),
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                key;

            scope.customizeGraphLabel.selectedLayout = layout;

            if (sharedTools.customizeGraphLabel) {
                scope.customizeGraphLabel.selectedHeader =
                    sharedTools.customizeGraphLabel.dimension || 'All Nodes';
                scope.customizeGraphLabel.instances =
                    sharedTools.customizeGraphLabel.instances || [];
                if (scope.customizeGraphLabel.instances.length > 0) {
                    scope.customizeGraphLabel.specifyInstances = true;
                }
                if (
                    (sharedTools.customizeGraphLabel.fontSize &&
                        sharedTools.customizeGraphLabel.fontSize !== 12) ||
                    (sharedTools.customizeGraphLabel.font &&
                        sharedTools.customizeGraphLabel.font !== 'sans-serif')
                ) {
                    scope.customizeGraphLabel.editStyle = true;
                } else {
                    scope.customizeGraphLabel.editStyle = false;
                }
                scope.customizeGraphLabel.fontSize =
                    sharedTools.customizeGraphLabel.fontSize || 12;
                scope.customizeGraphLabel.font = [
                    sharedTools.customizeGraphLabel.font,
                ] || ['sans-serif'];

                getUniqueInstances();
            } else {
                scope.customizeGraphLabel.selectedHeader = 'All Nodes';
            }

            for (key in keys) {
                if (keys[key].model === 'start' || keys[key].model === 'end') {
                    if (
                        scope.customizeGraphLabel.headers.indexOf(
                            keys[key].alias
                        ) === -1
                    ) {
                        scope.customizeGraphLabel.headers.push(keys[key].alias);
                    }
                }
            }
        }

        /**
         * @name getUniqueInstances
         * @desc executes the groub by
         * @param {string} selectedDim - selected dimension to group by
         * @returns {void}
         */
        function getUniqueInstances() {
            if (scope.customizeGraphLabel.selectedHeader !== 'All Nodes') {
                var limit = scope.widgetCtrl.getOptions('limit'),
                    callback;

                callback = function (output) {
                    var selectedDimInstances =
                            output.pixelReturn[0].output.data.values,
                        i;

                    scope.customizeGraphLabel.availableInstances = [];
                    for (i = 0; i < selectedDimInstances.length; i++) {
                        scope.customizeGraphLabel.availableInstances.push(
                            selectedDimInstances[i][0]
                        );
                    }
                };

                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'Pixel',
                            components: [
                                'Select (' +
                                    scope.customizeGraphLabel.selectedHeader +
                                    ') | Collect(' +
                                    limit +
                                    ');',
                            ],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }
        }

        /**
         * @name executeGroup
         * @desc executes the groub by
         * @param {bool} update whether to add rule or not
         * @returns {void}
         */
        function executeGroup(update) {
            var newTool = {};

            if (!scope.customizeGraphLabel.specifyInstances) {
                scope.customizeGraphLabel.instances = [];
            }
            if (!scope.customizeGraphLabel.editStyle) {
                scope.customizeGraphLabel.font = ['sans-serif'];
                scope.customizeGraphLabel.fontSize = 12;
            }

            newTool.customizeGraphLabel = {};
            if (update) {
                newTool.customizeGraphLabel.dimension =
                    scope.customizeGraphLabel.selectedHeader;
                newTool.customizeGraphLabel.instances =
                    scope.customizeGraphLabel.instances;
                newTool.customizeGraphLabel.fontSize =
                    scope.customizeGraphLabel.fontSize;
                newTool.customizeGraphLabel.font =
                    scope.customizeGraphLabel.font[0];
                newTool.displayValues = newTool.displayGraphValues = true;
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
            var customizeGraphLabelUpdateFrameListener,
                customizeGraphLabelUpdateTaskListener,
                updateOrnamentsListener;

            // listeners
            customizeGraphLabelUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            customizeGraphLabelUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                customizeGraphLabelUpdateFrameListener();
                customizeGraphLabelUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
