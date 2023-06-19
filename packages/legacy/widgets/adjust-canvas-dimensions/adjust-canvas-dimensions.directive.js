'use strict';

/**
 * @name adjust-canvas-dimensions
 * @desc change height and width of canvas
 */
export default angular
    .module('app.adjust-canvas-dimensions.directive', [])
    .directive('adjustCanvasDimensions', adjustCanvasDimensionsDirective);

adjustCanvasDimensionsDirective.$inject = [];

function adjustCanvasDimensionsDirective() {
    adjustCanvasDimensionsLink.$inject = [];

    return {
        restrict: 'E',
        template: require('./adjust-canvas-dimensions.directive.html'),
        scope: {},
        require: ['^widget'],
        controllerAs: 'adjustCanvasDimensions',
        bindToController: {},
        link: adjustCanvasDimensionsLink,
        controller: adjustCanvasDimensionsCtrl,
    };

    function adjustCanvasDimensionsCtrl() {}

    function adjustCanvasDimensionsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.adjustCanvasDimensions.auto = true;
        scope.adjustCanvasDimensions.set = set;
        scope.adjustCanvasDimensions.turnOffAuto = turnOffAuto;

        function turnOffAuto() {
            scope.adjustCanvasDimensions.auto = false;
        }

        /**
         * @name set
         * @param {boolean} reset - if true, set canvas to be size of widget content container
         * @returns {void}
         */
        function set(reset) {
            var panelId = scope.widgetCtrl.panelId,
                width,
                height;

            if (reset || scope.adjustCanvasDimensions.auto) {
                width = false;
                height = false;
            } else {
                width = scope.adjustCanvasDimensions.width;
                height = scope.adjustCanvasDimensions.height;
            }

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                shared: {
                                    canvasWidth: width,
                                    canvasHeight: height,
                                },
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools.shared'],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name setSize
         * @desc gets width and height of the chart container
         * @return {void}
         */
        function setSize() {
            var selector =
                'widget[widget-id="' +
                scope.widgetCtrl.widgetId +
                '"] #chart-container';
            scope.adjustCanvasDimensions.width =
                document.querySelector(selector).offsetWidth;
            scope.adjustCanvasDimensions.height =
                document.querySelector(selector).offsetHeight;
        }

        function initialize() {
            var sizeListener = scope.widgetCtrl.on('update-ornaments', setSize);

            scope.$on('$destroy', function () {
                sizeListener();
            });

            setSize();
        }

        initialize();
    }
}
