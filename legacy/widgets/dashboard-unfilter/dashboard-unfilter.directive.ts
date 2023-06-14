import angular from 'angular';

import './dashboard-unfilter.scss';

import './dashboard-unfilter-dimensions/dashboard-unfilter-dimensions.directive.ts';

export default angular
    .module('app.dashboard-unfilter.directive', [
        'app.dashboard-unfilter.dashboard-unfilter-dimensions',
    ])
    .directive('dashboardUnfilter', dashboardUnfilterDirective);

dashboardUnfilterDirective.$inject = ['semossCoreService'];

function dashboardUnfilterDirective(semossCoreService) {
    dashboardUnfilterCtrl.$inject = [];
    dashboardUnfilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        scope: {},
        template: require('./dashboard-unfilter.directive.html'),
        require: ['^insight', '^widget'],
        controllerAs: 'dashboardUnfilter',
        controller: dashboardUnfilterCtrl,
        link: dashboardUnfilterLink,
    };

    function dashboardUnfilterCtrl() {}

    function dashboardUnfilterLink(scope, ele, attrs, ctrl) {
        let buttonEle, clickTimer;

        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        /**
         * @name applyFilter
         * @desc unfilters entire frame and refreshses widgets
         */
        function applyFilter(): void {
            const frames = scope.insightCtrl.getShared('frames'),
                panels = scope.insightCtrl.getShared('panels');

            const components: any[] = [];
            Object.keys(frames)
                // unfilter all the frames then refresh the widgets belonging to them
                .forEach(function (frame) {
                    components.push(
                        {
                            type: 'variable',
                            components: [frame],
                        },
                        {
                            type: 'unfilterFrame',
                            components: [],
                            terminal: true,
                        }
                    );
                });

            panels.forEach(function (panelId) {
                const widgetId = `SMSSWidget${scope.insightCtrl.insightID}___${panelId}`;

                components.push({
                    type: 'refresh',
                    components: [widgetId],
                    terminal: true,
                });
            });

            if (components.length > 0) {
                scope.insightCtrl.execute(components);
            }
        }

        /**
         * @name mousedown
         * @desc sets a timer when mouse is down so we do not run unfilter on drag
         */
        function mousedown(): void {
            clickTimer = Date.now();
        }

        /**
         * @name mouseup
         * @desc determines if click was fast enought to run unfilter, resets clickTimer
         */
        function mouseup(): void {
            if (clickTimer) {
                if (Date.now() - clickTimer < 250) {
                    applyFilter();
                }
                clickTimer = null;
            }
        }

        /**
         * @name updatePresentation
         * @desc called when the presentation information changes
         */
        function updatePresentation(): void {
            scope.dashboardUnfilter.presentation =
                scope.insightCtrl.getWorkspace('presentation');
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            const updatedPresentationListener = scope.insightCtrl.on(
                'updated-presentation',
                updatePresentation
            );

            buttonEle = ele[0].querySelector('#dashboard-unfilter__btn');

            buttonEle.addEventListener('mousedown', mousedown);
            buttonEle.addEventListener('mouseup', mouseup);

            updatePresentation();

            scope.$on('$destroy', function () {
                updatedPresentationListener();

                buttonEle.removeEventListener('mousedown', mousedown);
                buttonEle.removeEventListener('mouseup', mouseup);
            });
        }

        initialize();
    }
}
