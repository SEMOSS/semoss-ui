'use strict';

import angular from 'angular';

import './workspace-panel-filter.scss';

export default angular
    .module('app.workspace.workspace-panel-filter', [])
    .directive('workspacePanelFilter', workspacePanelFilterDirective);

workspacePanelFilterDirective.$inject = [];

function workspacePanelFilterDirective() {
    workspacePanelFilterCtrl.$inject = [];
    workspacePanelFilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./workspace-panel-filter.directive.html'),
        scope: {},
        require: ['^insight'],
        controllerAs: 'workspacePanelFilter',
        bindToController: {
            panelId: '=?',
            close: '&?',
        },
        controller: workspacePanelFilterCtrl,
        link: workspacePanelFilterLink,
    };

    function workspacePanelFilterCtrl() {
        const workspacePanelFilter = this;

        workspacePanelFilter.registerPanelFilter = registerPanelFilter;

        /**
         * @name registerPanelFilter
         * @desc register the query-struct-filter callbacks to the parent
         * @param {*} getFilter - get the workspacePanelFilter from the view
         */
        function registerPanelFilter(getFilter): void {
            workspacePanelFilter.getFrameFilter = getFilter;
        }
    }

    function workspacePanelFilterLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];

        // functions
        scope.workspacePanelFilter.selectPanelFilter = selectPanelFilter;
        scope.workspacePanelFilter.applyPanelFilter = applyPanelFilter;

        scope.workspacePanelFilter.panels = {
            source: '',
            columns: {},
            selected: '',
        };

        scope.workspacePanelFilter.selectedPanelFilterQS = [];

        /** Filter */
        /**
         * @name resetPanelFilter
         * @desc reset the current panel filter
         */
        function resetPanelFilter(): void {
            selectPanelFilter(scope.workspacePanelFilter.panelId || '');
        }

        /**
         * @name selectPanelFilter
         * @desc select the current filter
         */
        function selectPanelFilter(panelId: string): void {
            // select the panel
            scope.workspacePanelFilter.panels.selected = panelId;

            // clear the headers and columns
            scope.workspacePanelFilter.panels.source = '';
            scope.workspacePanelFilter.panels.headers = {};
            scope.workspacePanelFilter.panels.columns = {};

            // reset it
            if (!scope.workspacePanelFilter.panels.selected) {
                scope.workspacePanelFilter.selectedPanelFilterQS = [];
                return;
            }

            const widgetId = `SMSSWidget${scope.insightCtrl.insightID}___${scope.workspacePanelFilter.panelId}`;

            // get the frame name
            const frameName = scope.insightCtrl.getWidget(widgetId, 'frame');

            // set the source
            scope.workspacePanelFilter.panels.source = frameName;

            // get the frame name
            const frame = scope.insightCtrl.getShared('frames.' + frameName);

            const headers = frame.headers;
            for (let hIdx = 0, hLen = headers.length; hIdx < hLen; hIdx++) {
                const h = headers[hIdx];

                // create the concept (since it is a frame aliases are unique)
                const concept = `${scope.workspacePanelFilter.panels.source}__${h.alias}`;

                scope.workspacePanelFilter.panels.columns[concept] = {
                    alias: h.alias,
                    concept: concept,
                    selector: h.alias,
                    type: h.dataType,
                    table: h.alias,
                    column: 'PRIM_KEY_PLACEHOLDER',
                };
            }

            // register function to come back
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.workspacePanelFilter.selectedPanelFilterQS =
                        output.explicitFilters || [];
                }
            };

            const components: PixelCommand[] = [
                {
                    meta: true,
                    type: 'panel',
                    components: [scope.workspacePanelFilter.panels.selected],
                },
                {
                    type: 'getPanelFiltersQS',
                    components: [],
                    terminal: true,
                },
            ];

            // execute a meta query
            scope.insightCtrl.meta(components, callback);
        }

        /** New Filters */
        /**
         * @name applyPanelFilter
         * @desc takes current workspacePanelFilter options and sends them to sheet to update visualization data
         */
        function applyPanelFilter(): void {
            const qsFrameFilters = scope.workspacePanelFilter.getFrameFilter();

            // build the components
            const components: PixelCommand[] = [];

            components.push(
                {
                    type: 'panel',
                    components: [scope.workspacePanelFilter.panels.selected],
                },
                {
                    type: 'unfilterPanel',
                    components: [],
                    terminal: true,
                }
            );

            if (qsFrameFilters.length > 0) {
                components.push(
                    {
                        type: 'panel',
                        components: [
                            scope.workspacePanelFilter.panels.selected,
                        ],
                    },
                    {
                        type: 'setPanelFilter2',
                        components: [qsFrameFilters],
                        terminal: true,
                    }
                );
            }

            scope.insightCtrl.execute(components);
        }

        /** Helpers */

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // append listeners
            const frameFilterUpdateTaskListener = scope.insightCtrl.on(
                'update-panel-filter',
                function () {
                    resetPanelFilter();
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying workspacePanelFilter...');
                frameFilterUpdateTaskListener();
            });

            // set the frame
            resetPanelFilter();
        }

        initialize();
    }
}
