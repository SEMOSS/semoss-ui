'use strict';

import angular from 'angular';

import './dashboard-unfilter-dimensions.scss';

export default angular
    .module('app.dashboard-unfilter.dashboard-unfilter-dimensions', [])
    .directive(
        'dashboardUnfilterDimensions',
        dashboardUnfilterDimensionsDirective
    );

dashboardUnfilterDimensionsDirective.$inject = [];

function dashboardUnfilterDimensionsDirective() {
    dashboardUnfilterDimensionsCtrl.$inject = [];
    dashboardUnfilterDimensionsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '^view'],
        controllerAs: 'dashboardUnfilterDimensions',
        bindToController: {},
        template: require('./dashboard-unfilter-dimensions.directive.html'),
        controller: dashboardUnfilterDimensionsCtrl,
        link: dashboardUnfilterDimensionsLink,
    };

    function dashboardUnfilterDimensionsCtrl() {}

    function dashboardUnfilterDimensionsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.viewCtrl = ctrl[1];

        /**
         * @name resetDimensions
         * @desc reset the view
         */
        function resetDimensions(): void {
            // change to visualization panel view
            const active = scope.widgetCtrl.getWidget('active');
            if (active !== 'dashboard-unfilter') {
                scope.widgetCtrl.execute([
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'setPanelView',
                        components: ['dashboard-unfilter'],
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
