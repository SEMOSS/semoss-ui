'use strict';

import angular from 'angular';

import './widget-view.scss';
import '../total-instances/total-instances.directive';

angular
    .module('app.widget-view.directive', ['app.total-instances.directive'])
    .directive('widgetView', widgetViewDirective);

widgetViewDirective.$inject = ['$timeout', '$compile', 'semossCoreService'];

/**
 * @name widget
 * @desc widget directive used for containing visualization components
 */

function widgetViewDirective($timeout, $compile, semossCoreService) {
    widgetViewCtrl.$inject = [];
    widgetViewLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        scope: {},
        controller: widgetViewCtrl,
        controllerAs: 'widgetView',
        bindToController: {},
        link: widgetViewLink,
        template: require('./widget-view.directive.html'),
    };

    function widgetViewCtrl() {}

    function widgetViewLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        let widgetViewEle,
            widgetContentReplaceEle,
            oldWidget,
            oldWidgetContent,
            oldWidgetScope;

        scope.widgetView.changeFacetInstance = changeFacetInstance;

        scope.widgetView.loading = {
            active: false,
            messageList: [],
        };

        scope.widgetView.showFacet = false;
        scope.widgetView.facetInfo = {};

        /**
         * @name changeFacetInstance
         * @param instance - selected instance
         * @desc go to selected facet instance
         */
        function changeFacetInstance(instance: string): void {
            scope.widgetCtrl.emit('update-facet', {
                index: scope.widgetView.facetInfo.uniqueInstances.indexOf(
                    instance
                ),
                limit: scope.widgetCtrl.getOptions('limit'),
            });
        }

        /**
         * @name updateWidget
         * @desc called to update the widget
         */
        function updateWidget(): void {
            const type = scope.widgetCtrl.getShared('type');

            // based on the type load in the widgetes
            if (type === 'insight') {
                const activeWidget = scope.widgetCtrl.getWidget('active');
                const whereToGetHTML = semossCoreService.getSpecificConfig(
                    activeWidget
                ).view
                    ? 'view'
                    : 'content';
                const layerIndex = 0;

                scope.widgetView.facetInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                );
                scope.widgetView.vizView = scope.widgetCtrl.getWidget('active');

                if (
                    scope.widgetView.facetInfo &&
                    scope.widgetView.facetInfo.viewType ===
                        'Individual Instance'
                ) {
                    let currentIdx = Number(
                            scope.widgetView.facetInfo.instanceIndex
                        ),
                        previousIdx = currentIdx - 1,
                        nextIdx = currentIdx + 1;

                    scope.widgetView.showFacet = true;

                    if (previousIdx < 0) {
                        previousIdx =
                            scope.widgetView.facetInfo.uniqueInstances.length -
                            1;
                    }
                    if (
                        nextIdx >
                        scope.widgetView.facetInfo.uniqueInstances.length - 1
                    ) {
                        nextIdx = 0;
                    }

                    scope.widgetView.facetInfo.selectedInstance =
                        scope.widgetView.facetInfo.uniqueInstances[currentIdx];
                    scope.widgetView.facetInfo.previousInstance =
                        scope.widgetView.facetInfo.uniqueInstances[
                            previousIdx
                        ] || '';
                    scope.widgetView.facetInfo.nextInstance =
                        scope.widgetView.facetInfo.uniqueInstances[nextIdx] ||
                        '';
                } else {
                    scope.widgetView.showFacet = false;
                }

                // its the same, why render it again?
                if (oldWidget === activeWidget) {
                    return;
                }

                scope.widgetCtrl.emit('start-loading', {
                    id: scope.widgetCtrl.widgetId,
                    message: 'Loading Widget',
                });

                semossCoreService
                    .loadWidget(activeWidget, whereToGetHTML)
                    .then(function (html) {
                        renderWidget(html, activeWidget);

                        scope.widgetCtrl.emit('stop-loading', {
                            id: scope.widgetCtrl.widgetId,
                        });
                    });
            } else if (type === 'playsheet') {
                const insight = scope.widgetCtrl.getShared('insight');

                let src = '';
                // if (!window.location.origin) {
                //     src =
                //         window.location.protocol +
                //         '//' +
                //         window.location.hostname +
                //         (window.location.port
                //             ? ':' + window.location.port
                //             : '') +
                //         window.location.pathname;
                // } else {
                //     src = window.location.origin + window.location.pathname;
                // }

                src += './packages/playsheet/#/';
                src += '?engine=' + insight.app_name;
                src += '&questionId=' + insight.app_insight_id;
                src += '&layout=' + insight.layout;
                renderWidget(
                    `<iframe style="position:absolute" id="widgetId_${scope.widgetCtrl.widgetId}" frameborder="0" width="100%" height="100%" onmouseover="this.contentWindow.focus()" src="${src}"></iframe>`,
                    undefined
                );
            } else if (type === 'form') {
                renderWidget('<builder></builder>', undefined);
            } else if (type === 'galaxy') {
                console.error('BRING BACK');
                renderWidget('', undefined);
            }
        }

        /**
         * @name renderWidget
         * @desc called to render the widget
         * @param content - content (html) to render
         * @param widget - type that was rendered
         */
        function renderWidget(
            content: string,
            widget: string | undefined
        ): void {
            if (oldWidgetContent !== content) {
                // bootstrap the content b/c angular's digest messes things up
                if (oldWidgetScope) {
                    oldWidgetScope.$destroy();
                }

                widgetContentReplaceEle.html(content);

                oldWidgetScope = scope.$new();
                oldWidget = widget;

                $compile(widgetContentReplaceEle.contents())(oldWidgetScope);
            }

            oldWidgetContent = content;
        }

        /**
         * @name resizeWidget
         * @desc emits event to resize the widget
         */
        function resizeWidget(): void {
            scope.widgetCtrl.emit('resize-widget', {
                widgetId: scope.widgetCtrl.widgetId,
            });
        }

        /**
         * @name updateLoading
         * @param {object} payload - {id, messageList, visible}
         * @desc called to update when the loading changes
         */
        function updateLoading(payload: {
            id: string;
            active: boolean;
            messageList: string[];
        }): void {
            if (scope.widgetCtrl.widgetId === payload.id) {
                scope.widgetView.loading.active = payload.active;
                scope.widgetView.loading.messageList = payload.messageList;
            }
        }

        /**
         * @name updatePresentation
         * @desc called when the presentation information changes
         */
        function updatePresentation(): void {
            scope.widgetView.presentation =
                semossCoreService.workspace.getWorkspace(
                    scope.widgetCtrl.insightID,
                    'presentation'
                );
        }

        /**
         * @name initialize
         * @desc called when the directive loads
         * @returns {void}
         */
        function initialize(): void {
            let resetPanelListener: () => {},
                widgetUpdateListener: () => {},
                viewUpdateListener: () => {},
                updateLoadingListener: () => {},
                updatePresentationListener: () => {};

            widgetViewEle = ele[0].children[0];
            widgetContentReplaceEle = angular.element(
                ele[0].querySelector(
                    '#widget-view__resizable__content__replace'
                )
            );

            resetPanelListener = semossCoreService.on(
                'reset-panel',
                (payload: { insightID: string; panelId: string }) => {
                    if (
                        payload.insightID === scope.widgetCtrl.insightID &&
                        payload.panelId === scope.widgetCtrl.panelId
                    ) {
                        updateWidget();
                    }
                }
            );
            widgetUpdateListener = scope.widgetCtrl.on(
                'update-task',
                updateWidget
            );
            viewUpdateListener = scope.widgetCtrl.on(
                'update-view',
                updateWidget
            );

            updateLoadingListener = semossCoreService.on(
                'update-loading',
                updateLoading
            );
            updatePresentationListener = semossCoreService.on(
                'updated-presentation',
                (payload: { insightID: string }) => {
                    if (
                        payload &&
                        payload.insightID === scope.widgetCtrl.insightID
                    ) {
                        updatePresentation();
                    }
                }
            );

            scope.$watch(
                function () {
                    return (
                        widgetViewEle.offsetHeight +
                        '-' +
                        widgetViewEle.offsetWidth
                    );
                },
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        resizeWidget();
                    }
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                resetPanelListener();
                widgetUpdateListener();
                viewUpdateListener();
                updateLoadingListener();
                updatePresentationListener();
            });

            updateWidget();
            updatePresentation();
        }

        initialize();
    }
}
