'use strict';

angular
    .module('app.graph-reset-highlight.directive', [])
    .directive('graphResetHighlight', graphResetHighlight);

graphResetHighlight.$inject = [];

function graphResetHighlight() {
    graphResetHighlightLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: graphResetHighlightLink,
    };

    function graphResetHighlightLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.emit('update-tool', {
                fn: 'resetHighlighting',
                args: [],
            });
        }

        initialize();
    }
}
