'use strict';

interface View {
    name: string;
    height: number;
    content: string;
}

import angular from 'angular';

import './view.scss';

import './view-layer/view-layer.directive.ts';
import './view-layout/view-layout.directive.ts';
import './view-dimensions/view-dimensions.directive.ts';
import './view-tools/view-tools.directive.ts';

export default angular
    .module('app.view.directive', [
        'app.view.view-layer',
        'app.view.view-layout',
        'app.view.view-dimensions',
        'app.view.view-tools',
    ])
    .directive('view', viewDirective);

viewDirective.$inject = ['semossCoreService', '$timeout'];

function viewDirective(semossCoreService, $timeout) {
    viewCtrl.$inject = ['$scope'];
    viewLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'view',
        bindToController: {},
        template: require('./view.directive.html'),
        controller: viewCtrl,
        link: viewLink,
    };

    function viewCtrl($scope) {
        $scope.view.updatedLayer = updatedLayer; //message to children that layer has been update
        $scope.view.getLayer = getLayer; // get the layer. Overwritten in view-layer
        $scope.view.updatedActive = updatedActive; //message to children that layer has been update
        $scope.view.getActive = getActive; // get the active. Overwritten in view-layout
        $scope.view.activeLayout = {};
        $scope.view.updatedFrame = updatedFrame; // message to children that the selected frame has been updated
        /**
         * @name updatedLayer
         * @desc the layer has been updated, tell everyone
         */
        function updatedLayer(): void {
            $scope.$broadcast('view--layer-updated');
        }

        /**
         * @name getLayer
         * @desc the layer information.
         */
        function getLayer(): any {
            return {};
        }

        /**
         * @name updatedActive
         * @desc the view/layer has been updated, tell everyone
         */
        function updatedActive(paint: boolean, view?: any): void {
            $scope.view.activeLayout = view;

            $scope.$broadcast('view--active-updated', paint);

            if (paint) {
                $scope.view.selectedTab = 'DATA';
            }
        }

        /**
         * @name getActive
         * @desc the layer information.
         */
        function getActive(): any {
            return $scope.view.activeLayout;
        }

        /**
         * @name updatedFrame
         * @desc the selected frame has been updated
         */
        function updatedFrame(): void {
            $scope.$broadcast('view--frame-updated');
        }
    }

    function viewLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.view.open = false;
        scope.view.items = [];
        scope.view.selectedTab = 'VISUAL';

        scope.view.updateTab = updateTab;

        /**
         * @name updateTab
         * @desc updates the tab of the visualize menu
         * @param tab - name of tab
         */
        function updateTab(tab: string): void {
            scope.view.selectedTab = tab;
        }

        /**
         * @name updateView
         * @desc updates the selected layout
         */
        function updateView(): void {
            let active = scope.widgetCtrl.getWidget('active'),
                type,
                layout;
            if (active === 'visualization') {
                type = scope.widgetCtrl.getWidget(
                    'view.visualization.options.type'
                );
                layout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                );

                scope.view.updatedActive(false, {
                    view: active,
                    layout: layout,
                    type: type,
                });
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            const updateTabListener = scope.widgetCtrl.on(
                'change-visualization-tab',
                function (payload) {
                    if (payload.tab) {
                        updateTab(payload.tab);
                    }
                }
            );

            const updateTaskListener = scope.widgetCtrl.on(
                'update-task',
                updateView
            );

            scope.$on('$destroy', function () {
                updateTabListener();
                updateTaskListener();
            });

            const active = scope.widgetCtrl.getWidget('active');

            if (active === 'dashboard-filter') {
                scope.view.selectedTab = 'DATA';
            }
        }

        initialize();
    }
}
