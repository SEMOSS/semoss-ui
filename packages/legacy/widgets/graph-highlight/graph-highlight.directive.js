'use strict';

export default angular
    .module('app.graph-highlight.directive', [])
    .directive('graphHighlight', graphHighlightDirective);

graphHighlightDirective.$inject = [];

function graphHighlightDirective() {
    graphHighlightCtrl.$inject = [];
    graphHighlightLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'graphHighlight',
        bindToController: {},
        tempplate: require('./graph-highlight.directive.html'),
        controller: graphHighlightCtrl,
        link: graphHighlightLink,
    };

    function graphHighlightCtrl() {}

    function graphHighlightLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.graphHighlight.highlightOptions = {
            selected: '',
            list: [
                {
                    display: 'Highlight Adjacent',
                    value: 'Upstream and Downstream',
                },
                {
                    display: 'Upstream',
                    value: 'Upstream',
                },
                {
                    display: 'Downstream',
                    value: 'Downstream',
                },
            ],
            specific: {
                showSpecific: false,
                list: [],
                selected: '',
            },
        };

        scope.graphHighlight.highlightAdjacent = highlightAdjacent;
        scope.graphHighlight.clearHighlight = clearHighlight;

        /**
         * @name highlightAdjacent
         * @param {Object} highlightOpt - the type of highlighting to perform on the graph
         * @desc requires a selected node to run. will perform the selected highlight option for selected nodes
         * @returns {void}
         */
        function highlightAdjacent(highlightOpt) {
            scope.widgetCtrl.setState(
                'graph-standard.highlightOption',
                highlightOpt.value
            );
            scope.widgetCtrl.emit('update-tool', {
                fn: 'highlightAdjacent',
                args: [highlightOpt.value],
            });
        }

        /**
         * @name clearHighlight
         * @desc removes highlight
         * @returns {void}
         */
        function clearHighlight() {
            scope.graphHighlight.highlightOptions.selected = '';
            scope.widgetCtrl.emit('update-tool', {
                fn: 'resetHighlighting',
                args: [],
            });
        }
    }
}
