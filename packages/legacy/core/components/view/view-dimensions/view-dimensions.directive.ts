'use strict';

import angular from 'angular';

import './view-dimensions.scss';

export default angular
    .module('app.view.view-dimensions', [])
    .directive('viewDimensions', viewDimensionsDirective);

viewDimensionsDirective.$inject = ['$compile', 'semossCoreService'];

function viewDimensionsDirective(
    $compile: ng.ICompileService,
    semossCoreService: SemossCoreService
) {
    viewDimensionsCtrl.$inject = [];
    viewDimensionsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '^view'],
        controllerAs: 'viewDimensions',
        bindToController: {},
        template: require('./view-dimensions.directive.html'),
        controller: viewDimensionsCtrl,
        link: viewDimensionsLink,
    };

    function viewDimensionsCtrl() {}

    function viewDimensionsLink(scope, ele, attrs, ctrl) {
        let builderScope, builderHTML;

        scope.widgetCtrl = ctrl[0];
        scope.viewCtrl = ctrl[1];

        scope.viewDimensions.active = {
            view: '',
            layout: '',
        };

        /**
         * @name resetBuilder
         * @desc reset the builder
         */
        function resetBuilder(): void {
            const old = scope.viewDimensions.active.view;

            // set the new active
            scope.viewDimensions.active = scope.viewCtrl.getActive();

            if (
                Object.keys(scope.viewDimensions.active).length === 0 ||
                !scope.viewDimensions.active.view
            ) {
                renderBuilder('');
                return;
            }

            // we are switching views, clear it out so we don't get anything new
            if (old !== scope.viewDimensions.active.view) {
                renderBuilder('');
            }

            // load the new widget
            if (scope.viewDimensions.active.view) {
                const type = 'dimensions';

                semossCoreService
                    .loadWidget(scope.viewDimensions.active.view, type)
                    .then((html: string) => {
                        renderBuilder(html);
                    });
            }
        }

        /**
         * @name renderBuilder
         * @desc render the widget
         * @param html - html to render
         */
        function renderBuilder(html: string): void {
            if (builderHTML !== html) {
                if (builderScope) {
                    builderScope.$destroy();
                }

                ele.html(html);

                builderScope = scope.$new();

                $compile(ele.contents())(builderScope);
            }

            builderHTML = html;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // register messages
            scope.$on('view--active-updated', function () {
                resetBuilder();
            });
            scope.$watch('viewCtrl.selectedTab', function () {
                resetBuilder();
            });

            // this will auto update the builder as well
            resetBuilder();
        }

        initialize();
    }
}
