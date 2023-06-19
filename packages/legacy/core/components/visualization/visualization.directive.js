'use strict';

import './visualization-dimensions/visualization-dimensions.directive';
import './visualization-empty/visualization-empty.directive';

export default angular
    .module('app.visualization.directive', [
        'app.visualization.visualization-dimensions',
        'app.visualization.visualization-empty',
    ])
    .directive('visualization', visualizationDirective);

visualizationDirective.$inject = ['$compile', 'semossCoreService'];

function visualizationDirective($compile, semossCoreService) {
    visualizationLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    visualizationCtrl.$inject = ['$scope'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^widget'],
        link: visualizationLink,
        controller: visualizationCtrl,
        controllerAs: 'visualization',
        bindToController: {},
    };

    function visualizationCtrl($scope) {
        var visualization = this;

        // Variables
        visualization.contextMenu = {};

        // Functions
        visualization.setContextMenuDataFromClick = setContextMenuDataFromClick;
        visualization.setContextMenuDataFromBrush = setContextMenuDataFromBrush;
        visualization.closeContextMenu = closeContextMenu;
        visualization.openContextMenu = openContextMenu;

        /**
         * @name setContextMenuDataFromBrush
         * @desc set context menu data when triggered by delayed brush
         * @param {string} header - selected header
         * @param {array} value - selected values
         * @returns {void}
         */
        function setContextMenuDataFromBrush(header, value) {
            let state = {
                widgetId: $scope.widgetCtrl.widgetId,
                visualizationType: visualization.type,
                eventType: 'brush',
            };

            // TODO is this the right check??? what if array is empty?
            if (header && value && value.length > 0) {
                state.selected = true;
                state.header = {
                    name: header,
                };
                state.value = value;
            } else {
                state.selected = false;
            }

            semossCoreService.emit('update-context-menu', state);
        }

        /**
         * @name setContextMenuDataFromClick
         * @desc set data for the context menu when triggered by single select
         * @param {event} event - chart api event
         * @param {string} header - selected header
         * @returns {void}
         */
        function setContextMenuDataFromClick(event, header) {
            let state = {
                widgetId: $scope.widgetCtrl.widgetId,
                visualizationType: visualization.type,
                eventType: 'click',
            };

            // Define selected value based on visualization type
            var extracted = extractContextMenuClick(event, header);

            // Define selected header
            if (extracted.header) {
                state.header = extracted.header;
            }

            if (extracted.value) {
                state.selected = true;
                state.value = extracted.value;
            } else {
                state.selected = false;
            }

            semossCoreService.emit('update-context-menu', state);
        }

        /**
         * @name extractContextMenuClick
         * @desc set the selected value from chart event depended on visualization type
         * @param {event} event - chart api event
         * @param {object} header -header
         * @returns {object} value, header
         */
        function extractContextMenuClick(event, header) {
            switch (visualization.type) {
                case 'Column':
                case 'Area':
                case 'Line':
                    if (
                        event.seriesName === 'markLine' ||
                        event.seriesName === 'markArea'
                    ) {
                        return {
                            value: false,
                            header: header,
                        };
                    }

                    return {
                        value: [event.name],
                        header: header,
                    };
                case 'Scatter':
                    if (
                        event.seriesName === 'markLine' ||
                        event.seriesName === 'markArea'
                    ) {
                        return {
                            value: false,
                            header: header,
                        };
                    }

                    return {
                        value: [event.value[header.idx]],
                        header: header,
                    };
                case 'Dendrogram':
                    if (event.name === 'root') {
                        return {
                            value: false,
                            header: header,
                        };
                    }

                    header.name = [event.data.dimension];

                    return {
                        value: [event.data.name],
                        header: header,
                    };

                case 'SingleAxisCluster':
                    return {
                        value: [event.data.value[2][header.name]],
                        header: header,
                    };
                case 'Map':
                case 'Choropleth':
                case 'Bubble':
                case 'Sunburst':
                case 'Radial':
                case 'Pack':
                case 'GanttD3':
                case 'Graph':
                    return {
                        value: [event],
                        header: header,
                    };
                case 'HeatMap':
                case 'Cluster':
                    return {
                        value: [[event.value[0]], [event.value[1]]],
                        header: header,
                    };
                default:
                    return {
                        value: [event.name],
                        header: header,
                    };
            }
        }

        /**
         * @name closeContextMenu
         * @desc close the context menu to dom
         * @returns {void}
         */
        function closeContextMenu() {
            semossCoreService.emit('close-context-menu');
        }

        /**
         * @name openContextMenu
         * @desc add context menu to dom
         * @param {event} event - DOM event
         * @returns {void}
         */
        function openContextMenu(event) {
            semossCoreService.emit('open-context-menu', {
                event: event,
                visualizationType: visualization.type,
                widgetId: $scope.widgetCtrl.widgetId,
            });
        }
    }

    function visualizationLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var oldVisualization, oldVisualizationContent, oldVisualizationScope;

        /**
         * @name updateVisualization
         * @desc called to update the visualization
         * @returns {void}
         */
        function updateVisualization() {
            var selectedType = scope.widgetCtrl.getWidget(
                    'view.visualization.options.type'
                ),
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                visualization = semossCoreService.getActiveVisualizationId(
                    selectedLayout,
                    selectedType
                );

            scope.visualization.type = selectedLayout;

            if (visualization) {
                // clear the old one (if its the same we don't have to do anything)
                if (oldVisualization !== visualization) {
                    renderVisualization('', undefined);
                } else {
                    return;
                }

                scope.widgetCtrl.emit('start-loading', {
                    id: scope.widgetCtrl.widgetId,
                    message: 'Loading Visualization',
                });

                semossCoreService
                    .loadWidget(visualization, 'content')
                    .then(function (html) {
                        renderVisualization(html, visualization);

                        scope.widgetCtrl.emit('stop-loading', {
                            id: scope.widgetCtrl.widgetId,
                        });
                    });
                return;
            }

            renderVisualization(
                '<visualization-empty></visualization-empty>',
                undefined
            );
        }

        /**
         * @name renderWidget
         * @desc called to render the widget
         * @param {string} content - content (html) to render
         * @param {string} visualization - type that was rendered
         * @returns {void}
         */
        function renderVisualization(content, visualization) {
            if (oldVisualizationContent !== content) {
                // bootstrap the content b/c angular's digest messes things up
                if (oldVisualizationScope) {
                    oldVisualizationScope.$destroy();
                }

                ele.html(content);

                oldVisualizationScope = scope.$new();

                $compile(ele.contents())(oldVisualizationScope);

                oldVisualizationContent = content;
                oldVisualization = visualization;
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var updateTaskListener, updateViewListener, resetPanelListener;

            // register the listeners
            updateTaskListener = scope.widgetCtrl.on(
                'update-task',
                updateVisualization
            );
            updateViewListener = scope.widgetCtrl.on(
                'update-view',
                updateVisualization
            );
            resetPanelListener = semossCoreService.on(
                'reset-panel',
                function (payload) {
                    if (
                        payload.insightID === scope.widgetCtrl.insightID &&
                        payload.panelId === scope.widgetCtrl.panelId
                    ) {
                        updateVisualization();
                    }
                }
            );

            // visualizationup
            scope.$on('$destroy', function () {
                updateTaskListener();
                updateViewListener();
                resetPanelListener();
                console.log('DESTROY');
            });

            updateVisualization();
        }

        initialize();
    }
}
