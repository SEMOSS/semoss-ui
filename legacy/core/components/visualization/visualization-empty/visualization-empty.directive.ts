'use strict';

import angular from 'angular';

import './visualization-empty.scss';

export default angular
    .module('app.visualization.visualization-empty', [])
    .directive('visualizationEmpty', visualizationEmptyDirective);

visualizationEmptyDirective.$inject = [];

function visualizationEmptyDirective() {
    visualizationEmptyLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^insight', '^widget'],
        controllerAs: 'visualizationEmpty',
        bindToController: {},
        template: require('./visualization-empty.directive.html'),
        controller: visualizationEmptyCtrl,
        link: visualizationEmptyLink,
    };

    function visualizationEmptyCtrl() {}

    function visualizationEmptyLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        scope.visualizationEmpty.frames = {
            options: [],
            selected: '',
        };

        scope.visualizationEmpty.visualize = visualize;

        /** * Frame */
        /**
         * @name updateFrame
         * @desc update frame options
         */
        function updateFrame(): void {
            let keepSelected = false;

            const frames = scope.widgetCtrl.getShared('frames') || {};

            scope.visualizationEmpty.frames.options = [];
            for (const f in frames) {
                if (frames.hasOwnProperty(f)) {
                    const frame = frames[f];

                    scope.visualizationEmpty.frames.options.push(frame.name);

                    if (
                        frame.name === scope.visualizationEmpty.frames.selected
                    ) {
                        keepSelected = true;
                    }
                }
            }

            if (
                !keepSelected &&
                scope.visualizationEmpty.frames.options.length > 0
            ) {
                scope.visualizationEmpty.frames.selected =
                    scope.visualizationEmpty.frames.options[0];
            }
            if (scope.visualizationEmpty.frames.options.length === 1) {
                visualize();
            }
            scope.widgetCtrl.emit('change-visualization-tab', {
                tab: 'VISUAL',
            });
        }

        /** * Frame */
        /**
         * @name visualize
         * @desc visualize the frame
         */
        function visualize(): void {
            if (!scope.visualizationEmpty.frames.selected) {
                scope.widgetCtrl.alert('warn', 'Frame needs to be selected.');
                return;
            }

            // lets generate a grid with all columns
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
                {
                    type: 'frame',
                    components: [scope.visualizationEmpty.frames.selected],
                },
                {
                    type: 'queryAll',
                    components: [],
                },
                {
                    type: 'autoTaskOptions',
                    components: [scope.widgetCtrl.panelId, 'Grid'],
                },
                {
                    type: 'collect',
                    components: [scope.widgetCtrl.getOptions('limit')],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name updatePresentation
         * @desc called when the presentation information changes
         */
        function updatePresentation(): void {
            scope.visualizationEmpty.presentation =
                scope.insightCtrl.getWorkspace('presentation');
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize() {
            // add listeners
            const updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                () => {
                    updateFrame();
                }
            );

            const updatePresentationListener = scope.insightCtrl.on(
                'updated-presentation',
                (payload: { insightID: string }) => {
                    updatePresentation();
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateFrameListener();
                updatePresentationListener();
            });

            // update the list
            updateFrame();
            updatePresentation();
        }

        initialize();
    }
}
