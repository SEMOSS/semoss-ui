'use strict';

import angular from 'angular';

import './html-widget-dimensions.scss';

export default angular
    .module('app.html-widget.html-widget-dimensions', [])
    .directive('htmlWidgetDimensions', htmlWidgetDimensionsDirective);

htmlWidgetDimensionsDirective.$inject = [];

function htmlWidgetDimensionsDirective() {
    htmlWidgetDimensionsCtrl.$inject = [];
    htmlWidgetDimensionsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '^view'],
        controllerAs: 'htmlWidgetDimensions',
        bindToController: {},
        template: require('./html-widget-dimensions.directive.html'),
        controller: htmlWidgetDimensionsCtrl,
        link: htmlWidgetDimensionsLink,
    };

    function htmlWidgetDimensionsCtrl() {}

    function htmlWidgetDimensionsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.viewCtrl = ctrl[1];

        /**
         * @name resetDimensions
         * @desc reset the view
         */
        function resetDimensions(): void {
            // change to visualization panel view
            const active = scope.widgetCtrl.getWidget('active');
            if (active !== 'html-widget') {
                scope.widgetCtrl.execute([
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'setPanelView',
                        components: ['html-widget'],
                        terminal: true,
                    },
                ]);
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // register messages
            scope.$on('view--active-updated', resetDimensions);

            // this will auto update the view as well
            resetDimensions();
        }

        initialize();
    }
}
