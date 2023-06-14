'use strict';

import angular from 'angular';

import './workspace-filter.scss';

export default angular
    .module('app.workspace.workspace-filter', [])
    .directive('workspaceFilter', workspaceFilterDirective);

workspaceFilterDirective.$inject = [];

function workspaceFilterDirective() {
    workspaceFilterCtrl.$inject = [];
    workspaceFilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./workspace-filter.directive.html'),
        scope: {
            insightCtrl: '=?',
        },
        require: [],
        controllerAs: 'workspaceFilter',
        bindToController: {},
        controller: workspaceFilterCtrl,
        link: workspaceFilterLink,
    };

    function workspaceFilterCtrl() {
        const workspaceFilter = this;

        workspaceFilter.registerFrameFilter = registerFrameFilter;

        /**
         * @name registerFrameFilter
         * @desc register the query-struct-workspaceFilter callbacks to the parent
         * @param {*} getFilter - get the workspaceFilter from the view
         */
        function registerFrameFilter(getFilter): void {
            workspaceFilter.getFrameFilter = getFilter;
        }
    }

    function workspaceFilterLink(scope, ele, attrs, ctrl) {
        // functions
        scope.workspaceFilter.selectFilter = selectFilter;
        scope.workspaceFilter.applyFilter = applyFilter;

        scope.workspaceFilter.frames = {
            columns: {},
            options: [],
            selected: '',
        };

        scope.workspaceFilter.selectedFrameFilterQS = [];

        /** Filter */
        /**
         * @name resetFilter
         * @desc reset the current filter
         */
        function resetFilter(): void {
            // get the frames
            const frames = scope.insightCtrl.getShared('frames');

            // create the options and headers
            scope.workspaceFilter.frames.headers = {};
            scope.workspaceFilter.frames.options = [];
            for (const f in frames) {
                const frame = frames[f];

                // save the options
                scope.workspaceFilter.frames.options.push(frame.name);

                // save the columns
                if (!scope.workspaceFilter.frames.columns[frame.name]) {
                    scope.workspaceFilter.frames.columns[frame.name] = {};
                }

                const headers = frame.headers;
                for (let hIdx = 0, hLen = headers.length; hIdx < hLen; hIdx++) {
                    const h = headers[hIdx];

                    // create the concept (since it is a frame aliases are unique)
                    const concept = `${frame.name}__${h.alias}`;

                    scope.workspaceFilter.frames.columns[frame.name][concept] =
                        {
                            alias: h.alias,
                            concept: concept,
                            selector: h.alias,
                            type: h.dataType,
                            table: h.alias,
                            column: 'PRIM_KEY_PLACEHOLDER',
                        };
                }
            }

            // set the selected frame
            let selected: string = scope.workspaceFilter.frames.selected;
            if (
                !selected ||
                scope.workspaceFilter.frames.options.indexOf(selected) === -1
            ) {
                selected = scope.workspaceFilter.frames.options[0] || '';
            }

            selectFilter(selected);
        }

        /**
         * @name selectFilter
         * @desc reset the current filter
         */
        function selectFilter(frame: string): void {
            scope.workspaceFilter.frames.selected = frame;

            // reset it
            if (!scope.workspaceFilter.frames.selected) {
                scope.workspaceFilter.selectedFrameFilterQS = [];
                return;
            }

            // register function to come back
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.workspaceFilter.selectedFrameFilterQS =
                        output.explicitFilters || [];
                }
            };

            const components: PixelCommand[] = [
                {
                    meta: true,
                    type: 'variable',
                    components: [scope.workspaceFilter.frames.selected],
                },
                {
                    type: 'getFrameFiltersQS',
                    components: [],
                    terminal: true,
                },
            ];

            // execute a meta query
            scope.insightCtrl.meta(components, callback);
        }

        /** New Filters */
        /**
         * @name applyFilter
         * @desc takes current workspaceFilter options and sends them to sheet to update visualization data
         */
        function applyFilter(): void {
            const qsFrameFilters = scope.workspaceFilter.getFrameFilter();

            // build the components
            const components: PixelCommand[] = [];

            components.push(
                {
                    type: 'variable',
                    components: [scope.workspaceFilter.frames.selected],
                },
                {
                    type: 'unfilterFrame',
                    components: [],
                    terminal: true,
                }
            );

            if (qsFrameFilters.length > 0) {
                components.push(
                    {
                        type: 'variable',
                        components: [scope.workspaceFilter.frames.selected],
                    },
                    {
                        type: 'setFrameFilter2',
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
                'update-frame-filter',
                function () {
                    resetFilter();
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying workspaceFilter...');
                frameFilterUpdateTaskListener();
            });

            // set the frame
            resetFilter();
        }

        initialize();
    }
}
