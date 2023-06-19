'use strict';

import angular from 'angular';

import './dashboard-filter-dimensions.scss';

export default angular
    .module('app.dashboard-filter.dashboard-filter-dimensions', [])
    .directive('dashboardFilterDimensions', dashboardFilterDimensionsDirective);

dashboardFilterDimensionsDirective.$inject = ['semossCoreService'];

function dashboardFilterDimensionsDirective(
    semossCoreService: SemossCoreService
) {
    dashboardFilterDimensionsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight', '^widget', '^view'],
        controllerAs: 'dashboardFilterDimensions',
        bindToController: {},
        template: require('./dashboard-filter-dimensions.directive.html'),
        controller: dashboardFilterDimensionsCtrl,
        link: dashboardFilterDimensionsLink,
    };

    function dashboardFilterDimensionsCtrl() {}

    function dashboardFilterDimensionsLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];
        scope.viewCtrl = ctrl[2];

        interface options {
            frame: string; // name of the frame that we are filtering off of
            column?: string; // name of the column that we are filtering
            type:
                | 'float'
                | 'checklist'
                | 'dropdown'
                | 'typeahead'
                | 'slider'
                | 'datepicker'
                | 'button'
                | 'multiselect'
                | 'control'; // type of filter to render

            multiple?: boolean; // are allowing the users to select multiple options?
            applied?:
                | false
                | {
                      // special scenarios where we only apply to certain things, if false or missing, apply to all.
                      frames?: string[]; // array of frames to apply the filter
                      panels?: string[]; // array of panels to apply the filter
                  };
            auto?: boolean; // auto run the dashboard (or click),
            dynamic?: boolean; // is the filter dynamic
            optionsCache?: boolean; // cache the options?
            // specific options
            comparator?: string | string[] | undefined; // comparator the range?
            sensitivity?: undefined | number; // interval from the slder
            format?: undefined | string; // format for the slider
            rendered?: undefined | string | string[]; // use the set range values
            vertical?: boolean; // for the button
            searchable?: boolean; // for the checklist and dropdown
            displayValue?: string; // for the dropdown - user created display
            columnType?: string; // for the slider - dataType of selected column
        }

        const DEFAULT_OPTIONS: options = {
            frame: '',
            column: '',
            type: 'float',
            multiple: true,
            applied: false,
            auto: false,
            dynamic: false,
            optionsCache: false,
            comparator: undefined,
            sensitivity: 1,
            format: 'YYYY-MM-DD',
            rendered: undefined,
            vertical: false,
            searchable: true,
            displayValue: 'Filter of <SelectedColumn>',
            columnType: undefined,
        };

        scope.dashboardFilterDimensions.options = DEFAULT_OPTIONS;

        scope.dashboardFilterDimensions.frames = {
            options: [],
        };

        scope.dashboardFilterDimensions.headers = {
            options: [],
        };

        scope.dashboardFilterDimensions.displayType = {
            options: [
                {
                    display: 'Float',
                    value: 'float',
                },
                {
                    display: 'Button',
                    value: 'button',
                },
                {
                    display: 'Checklist',
                    value: 'checklist',
                },
                {
                    display: 'Datepicker',
                    value: 'datepicker',
                },
                {
                    display: 'Dropdown',
                    value: 'dropdown',
                },
                {
                    display: 'Multiselect',
                    value: 'multiselect',
                },
                {
                    display: 'Slider',
                    value: 'slider',
                },
                {
                    display: 'Typeahead',
                    value: 'typeahead',
                },
            ],
        };

        scope.dashboardFilterDimensions.cache = {
            options: ['Default', 'Dynamic', 'Cache'],
            selected: 'Default',
        };

        scope.dashboardFilterDimensions.panels = [];

        scope.dashboardFilterDimensions.restrict = false;

        scope.dashboardFilterDimensions.updateCache = updateCache;
        scope.dashboardFilterDimensions.updateFrame = updateFrame;
        scope.dashboardFilterDimensions.updateColumn = updateColumn;
        scope.dashboardFilterDimensions.updateRestrict = updateRestrict;
        scope.dashboardFilterDimensions.createFilter = createFilter;
        scope.dashboardFilterDimensions.mouseover = mouseover;
        scope.dashboardFilterDimensions.mouseleave = mouseleave;
        scope.dashboardFilterDimensions.panelAdded = panelAdded;

        /**
         * @name resetDimensions
         * @desc create the initial filter
         */
        function resetDimensions(): void {
            let options: options =
                scope.widgetCtrl.getWidget('view.dashboard-filter.options') ||
                {};

            // merge with the defaults
            options = angular.merge({}, DEFAULT_OPTIONS, options);

            // set the initial options
            scope.dashboardFilterDimensions.options = options;

            // set the cache
            if (scope.dashboardFilterDimensions.options.dynamic) {
                scope.dashboardFilterDimensions.cache.selected = 'Dynamic';
            } else if (scope.dashboardFilterDimensions.options.optionsCache) {
                scope.dashboardFilterDimensions.cache.selected = 'Cache';
            } else {
                scope.dashboardFilterDimensions.cache.selected = 'Default';
            }

            const panels = scope.insightCtrl.getShared('panels') || [];

            scope.dashboardFilterDimensions.panels = [];
            for (
                let panelIdx = 0, panelLen = panels.length;
                panelIdx < panelLen;
                panelIdx++
            ) {
                scope.dashboardFilterDimensions.panels.push(
                    panels[panelIdx].panelId
                );
            }

            const frames = scope.insightCtrl.getShared('frames') || {};
            scope.dashboardFilterDimensions.frames.options = [];

            let keepSelected = false;
            for (const frame in frames) {
                if (frames.hasOwnProperty(frame)) {
                    scope.dashboardFilterDimensions.frames.options.push(
                        frames[frame].name
                    );

                    if (
                        scope.dashboardFilterDimensions.options.frame &&
                        frames[frame].name ===
                            scope.dashboardFilterDimensions.options.frame
                    ) {
                        keepSelected = true;
                    }
                }
            }

            if (
                !keepSelected &&
                scope.dashboardFilterDimensions.frames.options.length > 0
            ) {
                scope.dashboardFilterDimensions.options.frame =
                    scope.dashboardFilterDimensions.frames.options[0];
            }

            // sort it
            semossCoreService.utility.sort(
                scope.dashboardFilterDimensions.frames.options,
                'alias'
            );

            // update headers
            if (scope.dashboardFilterDimensions.options.frame) {
                updateFrame();
            }

            // update restricted
            if (
                scope.dashboardFilterDimensions.options.applied.hasOwnProperty(
                    'frames'
                ) ||
                scope.dashboardFilterDimensions.options.applied.hasOwnProperty(
                    'panels'
                )
            ) {
                scope.dashboardFilterDimensions.restrict = true;
            }

            // this is for the restrict options, so it doesn't error with angularJS
            if (!scope.dashboardFilterDimensions.restrict) {
                scope.dashboardFilterDimensions.options.applied = {
                    frames: [],
                    panels: [],
                };
            }
        }

        /**
         * @name updateCache
         * @desc update the cache options
         */
        function updateCache(): void {
            if (scope.dashboardFilterDimensions.cache.selected === 'Dynamic') {
                scope.dashboardFilterDimensions.options.dynamic = true;
                scope.dashboardFilterDimensions.options.optionsCache = false;
            } else if (
                scope.dashboardFilterDimensions.cache.selected === 'Cache'
            ) {
                scope.dashboardFilterDimensions.options.dynamic = false;
                scope.dashboardFilterDimensions.options.optionsCache = true;
            } else {
                scope.dashboardFilterDimensions.options.dynamic = true;
                scope.dashboardFilterDimensions.options.optionsCache = false;
            }
        }

        /**
         * @name updateFrame
         * @desc update headers for the selected frames
         */
        function updateFrame(): void {
            const headers =
                scope.insightCtrl.getShared(
                    `frames.${scope.dashboardFilterDimensions.options.frame}.headers`
                ) || [];

            scope.dashboardFilterDimensions.headers.options = [];

            let keepSelected = false;
            for (
                let headerIdx = 0, headerLen = headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                scope.dashboardFilterDimensions.headers.options.push(
                    headers[headerIdx]
                );

                if (
                    scope.dashboardFilterDimensions.options.column &&
                    headers[headerIdx].alias ===
                        scope.dashboardFilterDimensions.options.column
                ) {
                    keepSelected = true;
                    scope.dashboardFilterDimensions.options.columnType =
                        headers[headerIdx].dataType;
                }
            }

            // sort it
            semossCoreService.utility.sort(
                scope.dashboardFilterDimensions.headers.options,
                'alias'
            );

            if (
                !keepSelected &&
                scope.dashboardFilterDimensions.headers.options.length > 0
            ) {
                scope.dashboardFilterDimensions.options.column =
                    scope.dashboardFilterDimensions.headers.options[0].alias;
                scope.dashboardFilterDimensions.options.columnType =
                    scope.dashboardFilterDimensions.headers.options[0].dataType;
            }
        }

        /**
         * @name updateColumn
         * @desc update selected column type
         */
        function updateColumn(): void {
            const headers =
                scope.dashboardFilterDimensions.headers.options || [];

            for (
                let headerIdx = 0, headerLen = headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                if (
                    scope.dashboardFilterDimensions.options.column &&
                    headers[headerIdx].alias ===
                        scope.dashboardFilterDimensions.options.column
                ) {
                    scope.dashboardFilterDimensions.options.columnType =
                        headers[headerIdx].dataType;
                }
            }
        }

        /**
         * @name updateRestrict
         * @desc update the restrict
         */
        function updateRestrict(): void {
            // clear it out
            scope.dashboardFilterDimensions.options.applied = {
                frames: [],
                panels: [],
            };
        }

        /**
         * @name createFilter
         * @desc saves and creates dashboard filter as a new panel
         */
        function createFilter(): void {
            const components: PixelCommand[] = [];

            const options: options = {
                frame: scope.dashboardFilterDimensions.options.frame,
                type: scope.dashboardFilterDimensions.options.type,
            };

            if (scope.dashboardFilterDimensions.options.type === 'float') {
                // noop
            } else {
                options.column = scope.dashboardFilterDimensions.options.column;
                options.auto = scope.dashboardFilterDimensions.options.auto;
                options.dynamic =
                    scope.dashboardFilterDimensions.options.dynamic;
                options.optionsCache =
                    scope.dashboardFilterDimensions.options.optionsCache;
            }

            if (scope.dashboardFilterDimensions.options.type === 'checklist') {
                options.multiple =
                    scope.dashboardFilterDimensions.options.multiple;
                options.searchable =
                    scope.dashboardFilterDimensions.options.searchable;
            } else if (
                scope.dashboardFilterDimensions.options.type === 'dropdown'
            ) {
                options.multiple =
                    scope.dashboardFilterDimensions.options.multiple;
                options.searchable =
                    scope.dashboardFilterDimensions.options.searchable;
                options.displayValue =
                    scope.dashboardFilterDimensions.options.displayValue;
            } else if (
                scope.dashboardFilterDimensions.options.type === 'typeahead'
            ) {
                // noop
            } else if (
                scope.dashboardFilterDimensions.options.type === 'slider'
            ) {
                options.multiple =
                    scope.dashboardFilterDimensions.options.multiple;

                if (
                    scope.dashboardFilterDimensions.options.columnType ===
                    'NUMBER'
                ) {
                    options.sensitivity =
                        scope.dashboardFilterDimensions.options.sensitivity;
                }

                if (typeof options.comparator !== 'undefined') {
                    options.comparator =
                        scope.dashboardFilterDimensions.options.comparator;
                }

                if (typeof options.sensitivity !== 'undefined') {
                    options.sensitivity =
                        scope.dashboardFilterDimensions.options.sensitivity;
                }

                if (typeof options.format !== 'undefined') {
                    options.format =
                        scope.dashboardFilterDimensions.options.format;
                }
                options.rendered = undefined;
            } else if (
                scope.dashboardFilterDimensions.options.type === 'datepicker'
            ) {
                options.multiple =
                    scope.dashboardFilterDimensions.options.multiple;

                if (typeof options.comparator !== 'undefined') {
                    options.comparator =
                        scope.dashboardFilterDimensions.options.comparator;
                }

                if (typeof options.format !== 'undefined') {
                    options.format =
                        scope.dashboardFilterDimensions.options.format;
                }
            } else if (
                scope.dashboardFilterDimensions.options.type === 'button'
            ) {
                options.multiple =
                    scope.dashboardFilterDimensions.options.multiple;
                options.vertical =
                    scope.dashboardFilterDimensions.options.vertical;
            } else if (
                scope.dashboardFilterDimensions.options.type === 'multiselect'
            ) {
                // noop
            }

            // only if necessary
            if (scope.dashboardFilterDimensions.restrict) {
                options.applied =
                    scope.dashboardFilterDimensions.options.applied;
            } else {
                options.applied = false;
            }

            components.push(
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'setPanelView',
                    components: ['dashboard-filter', options],
                    terminal: true,
                }
            );

            if (components.length > 1) {
                scope.insightCtrl.execute(components);
            }
        }

        /**
         * @name mouseover
         * @desc Called when a user mouseover an option, will highlight the panel.
         * @param option - the panelId to highlight
         */
        function mouseover(option: any): void {
            semossCoreService.emit('highlight-panel', {
                insightID: scope.insightCtrl.insightID,
                panelId: option,
                highlight: true,
            });
        }

        /**
         * @name mouseleave
         * @desc Called when a user's mouse leaves an option, will remove the highlight from the panel.
         * @param option - the panelId to remove the highlight from
         */
        function mouseleave(option: any): void {
            semossCoreService.emit('highlight-panel', {
                insightID: scope.insightCtrl.insightID,
                panelId: option,
                highlight: false,
            });
        }

        /**
         * @name panelAdded
         * @desc called when the user selects an option, will clear the highlight from the panel
         * @param option - the panel option that was selected by the user
         */
        function panelAdded(option: {
            delta: { type: string; value: any };
            value: string;
        }): void {
            if (option.delta && option.delta.type === 'add' && option.value) {
                semossCoreService.emit('highlight-panel', {
                    insightID: scope.insightCtrl.insightID,
                    panelId: option.value,
                    highlight: false,
                });
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         */
        function initialize(): void {
            // register messages
            const updateFrameListener = scope.insightCtrl.on(
                'update-frame',
                resetDimensions
            );

            scope.$on('view--active-updated', resetDimensions);

            scope.$on('$destroy', () => {
                updateFrameListener();
            });

            // this will auto update the view as well
            resetDimensions();
        }

        initialize();
    }
}
