'use strict';

const MENU = require('./menu.json');

export default angular
    .module('app.widget-tab.widget-tab-clean', [])
    .directive('widgetTabClean', widgetTabCleanDirective);

widgetTabCleanDirective.$inject = ['CONFIG'];

function widgetTabCleanDirective(CONFIG) {
    widgetTabCleanCtrl.$inject = [];
    widgetTabCleanLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', 'widgetTab'],
        controllerAs: 'widgetTabClean',
        bindToController: {},
        controller: widgetTabCleanCtrl,
        link: widgetTabCleanLink,
    };

    function widgetTabCleanCtrl() {}

    function widgetTabCleanLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.widgetTabCtrl = ctrl[1];

        /**
         * @name refreshTask
         * @desc refresh the view with the last task executed
         * @param {string} frameType - current frameType
         * @return {void}
         */
        function refreshTask(frameType) {
            let headers = scope.widgetCtrl.getFrame('headers') || [],
                joins = scope.widgetCtrl.getFrame('joins') || [],
                pixelComponent = [],
                selectComponent = [],
                taskOptionsComponent = {},
                joinComponent = [],
                i,
                len,
                limit = scope.widgetCtrl.getOptions('limit'),
                frameName = scope.widgetCtrl.getFrame('name'),
                newFrameType = CONFIG.defaultScriptingLanguage || 'R';

            taskOptionsComponent[scope.widgetCtrl.panelId] = {
                layout: 'Grid',
                alignment: {
                    label: [],
                },
            };

            // add in alignment
            for (i = 0, len = headers.length; i < len; i++) {
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].alignment.label.push(headers[i].alias);

                // add in the select component
                selectComponent.push({
                    alias: headers[i].alias,
                });
            }

            // setup the joins if they exist
            for (i = 0, len = joins.length; i < len; i++) {
                joinComponent.push({
                    fromColumn: joins[i].fromNode,
                    toColumn: joins[i].toNode,
                    joinType: joins[i].joinType,
                });
            }

            if (frameType !== 'R' && frameType !== 'PY') {
                if (newFrameType === 'PYTHON') {
                    newFrameType = 'PY';
                }

                pixelComponent.push(
                    {
                        type: 'variable',
                        components: [frameName],
                    },
                    {
                        type: 'convert',
                        components: [newFrameType, frameName],
                        terminal: true,
                    }
                );
            }

            // assumimg that headers never change
            pixelComponent = pixelComponent.concat([
                {
                    type: 'frame',
                    components: [frameName],
                },
                {
                    type: 'select2',
                    components: [selectComponent],
                },
                {
                    type: 'join',
                    components: [joinComponent],
                },
                {
                    type: 'format',
                    components: ['table'],
                },
                {
                    type: 'taskOptions',
                    components: [taskOptionsComponent],
                },
                {
                    type: 'collect',
                    components: [limit],
                    terminal: true,
                },
            ]);

            if (pixelComponent.length > 0) {
                scope.widgetCtrl.execute(pixelComponent);
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let updateFrameListener,
                frameType = scope.widgetCtrl.getFrame('type');

            // register listeners
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                function () {
                    scope.widgetTabCtrl.refreshContent();
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateFrameListener();
                console.log('DESTROY');
            });

            if (scope.widgetCtrl.getWidget('active') !== 'visualization') {
                scope.widgetCtrl.execute([
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'setPanelView',
                        components: ['visualization'],
                        terminal: true,
                    },
                ]);
            }

            // initialize the data
            refreshTask(frameType);

            scope.widgetTabCtrl.setContent(MENU);
        }

        initialize();
    }
}
