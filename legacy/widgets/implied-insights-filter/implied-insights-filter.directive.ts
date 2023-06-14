'use strict';

import angular from 'angular';
import './implied-insights-filter.scss';
import '../implied-insights/implied-insights.service';

export default angular
    .module('app.implied-insights-filter.directive', [
        'app.implied-insights.service',
    ])
    .directive('impliedInsightsFilter', impliedInsightsFilterDirective);

impliedInsightsFilterDirective.$inject = [
    'semossCoreService',
    'impliedInsightsService',
    'optionsService',
];

function impliedInsightsFilterDirective(
    semossCoreService,
    impliedInsightsService,
    optionsService
) {
    impliedInsightsFilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        template: require('./implied-insights-filter.directive.html'),
        scope: {
            outliers: '=',
        },
        require: ['^insight', '^widget'],
        controllerAs: 'impliedInsightsFilter',
        bindToController: {},
        link: impliedInsightsFilterLink,
        controller: impliedInsightsFilterCtrl,
    };

    function impliedInsightsFilterCtrl() {}

    function impliedInsightsFilterLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        scope.impliedInsightsFilter.showOverlay = false; // opens UI to add filter
        scope.impliedInsightsFilter.filters = []; // current filters applied
        scope.impliedInsightsFilter.selectedColumn = ''; // selected column to filter
        scope.impliedInsightsFilter.columns = []; // the columns to filter on
        scope.impliedInsightsFilter.outlierValues = {};
        scope.impliedInsightsFilter.filterType = ''; // datatype of selected column
        scope.impliedInsightsFilter.filterHtml =
            '<div class="smss-small">Must select a column to filter.</div>'; // actual filter
        scope.impliedInsightsFilter.selectedValues = []; // selected values
        scope.impliedInsightsFilter.valueOptions = []; // values to filter on
        scope.impliedInsightsFilter.outlierFrame = ''; // name of the frame for column outliers => used as options to filter
        scope.impliedInsightsFilter.frameHeaders = []; // header info for the main frame
        scope.impliedInsightsFilter.previousFrames = [];
        scope.impliedInsightsFilter.showHelpOverlay = false;

        scope.impliedInsightsFilter.toggleOverlay = toggleOverlay;
        scope.impliedInsightsFilter.addFilter = addFilter;
        scope.impliedInsightsFilter.removeFilter = removeFilter;
        scope.impliedInsightsFilter.resetFilter = resetFilter;
        scope.impliedInsightsFilter.updateFilterType = updateFilterType;
        /**
         * @name removeOldViz
         * @desc removes previous frames and panels
         * @returns pixel recipe
         */
        function removeOldViz(): PixelCommand[] {
            const removeFrames = impliedInsightsService.removeFrames(),
                removePanels = impliedInsightsService.removePanels();
            return removeFrames.concat(removePanels);
        }
        /**
         * @name runImpliedInsights
         * @desc calls the implied insights pixel
         * @param initial - true if this is the first time the dashboard is being created
         */
        function runImpliedInsights(): void {
            const callback = function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0],
                    mainFrame = scope.widgetCtrl.getFrame();
                const sheetId =
                        scope.insightCtrl.getWorkbook('worksheetCounter'),
                    frames: string[] = [];
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                // Set frame info
                for (let i = 0; i < output.length; i++) {
                    const frameName = output[i]
                        ? output[i].value[0].name
                        : output[i];
                    frames.push(frameName);
                }
                scope.impliedInsightsFilter.previousFrames = frames;

                // Recreate dashboard
                const commands = impliedInsightsService.createDashboard(
                    false,
                    mainFrame,
                    frames,
                    sheetId
                );
                if (commands.length) {
                    scope.widgetCtrl.execute(commands);
                }

                // Get new outlier data to reset the filter options
                const outlierFrame =
                    output[impliedInsightsService.getFrame('column')];
                optionsService.set(
                    scope.widgetCtrl.widgetId,
                    'outlierFrame',
                    outlierFrame
                );
            };
            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [
                            `${scope.widgetCtrl.getFrame(
                                'name'
                            )} | RunImpliedInsights()`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name toggleOverlay
         * @desc - show/hide the overlay
         */
        function toggleOverlay(): void {
            scope.impliedInsightsFilter.showOverlay =
                !scope.impliedInsightsFilter.showOverlay;
        }

        /**
         * @name updateFilterType
         * @desc grabs the options and creates the correct filter when a column is selected
         */
        function updateFilterType(): void {
            let html,
                type = scope.impliedInsightsFilter.selectedColumn.dataType;
            scope.impliedInsightsFilter.filterType = type;
            scope.impliedInsightsFilter.selectedValues = [];

            scope.impliedInsightsFilter.valueOptions =
                scope.impliedInsightsFilter.outlierValues[
                    scope.impliedInsightsFilter.selectedColumn.alias
                ];
            if (type === 'NUMBER' || type === 'INT' || type === 'DOUBLE') {
                html = buildSliderHTML();
            } else {
                html = buildChecklistHTML();
            }
            scope.impliedInsightsFilter.filterHtml = html;
        }
        /**
         * @name buildChecklistHTML
         * @desc creates the html for the checklist filter
         * @returns html as a string
         */
        function buildChecklistHTML(): string {
            return `
            <smss-checklist model="impliedInsightsFilter.selectedValues"
                options="impliedInsightsFilter.valueOptions"
                searchable
                multiple
                quickselect>
            </smss-checklist>
            `;
        }

        /**
         * @name buildSliderHTML
         * @desc builds html for a number
         * @returns html as a string
         */
        function buildSliderHTML(): string {
            const min = parseFloat(scope.impliedInsightsFilter.valueOptions[0]),
                max = parseFloat(scope.impliedInsightsFilter.valueOptions[1]);
            scope.impliedInsightsFilter.selectedValues = [min, max];

            return `
            <smss-slider model="impliedInsightsFilter.selectedValues"
                multiple
                numerical
                min=${min}
                max=${max}>
            </smss-slider>
            `;
        }

        /**
         * @name resetFilter
         * @desc resets the components in the filter overlay
         */
        function resetFilter(): void {
            scope.impliedInsightsFilter.selectedValues = [];
            scope.impliedInsightsFilter.selectedColumn = '';
            scope.impliedInsightsFilter.valueOptions = [];
            scope.impliedInsightsFilter.filterType = '';
            scope.impliedInsightsFilter.filterHtml =
                '<div class="smss-small">Must select a column to filter.</div>';
        }
        /**
         * @name setFilterOptions
         * @desc sets the filter options using the outlier data
         * @param data - the outlier data
         */
        function setFilterOptions(data): void {
            let options = {},
                outliers;
            for (let i = 0; i < data.length; i++) {
                let column = data[i].Column,
                    value = data[i].Instance,
                    isOutlier = data[i].Outlier === 'TRUE',
                    type;

                if (!isOutlier) {
                    continue;
                }

                type = scope.impliedInsightsFilter.frameHeaders.find(
                    (key) => key.alias === column
                ).dataType;

                if (options.hasOwnProperty(column)) {
                    if (options[column].indexOf(value) === -1) {
                        options[column].push(value);
                    }
                } else {
                    if (
                        type === 'NUMBER' ||
                        type === 'INT' ||
                        type === 'DOUBLE'
                    ) {
                        value = value.slice(1, -1).split(',');
                        options[column] = value;
                    } else {
                        options[column] = [value];
                    }
                }
            }
            outliers = Object.keys(options);
            scope.impliedInsightsFilter.columns =
                scope.impliedInsightsFilter.frameHeaders.filter(function (key) {
                    return outliers.indexOf(key.alias) > -1;
                });
            scope.impliedInsightsFilter.outlierValues = options;
        }
        /**
         * @name createChecklistFilter
         * @desc creates the pixel command for a checklist filter
         */
        function createChecklistFilter(): PixelCommand[] {
            const components: PixelCommand[] = [],
                selections: string[] = [];

            for (
                let k = 0;
                k < scope.impliedInsightsFilter.selectedValues.length;
                k++
            ) {
                const value = scope.impliedInsightsFilter.selectedValues[
                    k
                ].replace(/_/g, '_');
                selections.push(value);
            }
            components.push(
                {
                    type: 'frame',
                    components: [scope.widgetCtrl.getFrame('name')],
                },
                {
                    type: 'setFrameFilter',
                    components: [
                        [
                            {
                                type: 'value',
                                alias: scope.impliedInsightsFilter
                                    .selectedColumn.alias,
                                comparator: '==',
                                values: selections,
                            },
                        ],
                    ],
                    terminal: true,
                }
            );

            return components;
        }
        /**
         * @name createSliderFilter
         * @desc creates the pixel command for slider filter
         */
        function createSliderFilter(): PixelCommand[] {
            const components: PixelCommand[] = [];

            components.push(
                {
                    type: 'frame',
                    components: [scope.widgetCtrl.getFrame('name')],
                },
                {
                    type: 'setFrameFilter',
                    components: [
                        [
                            {
                                type: 'value',
                                alias: scope.impliedInsightsFilter
                                    .selectedColumn.alias,
                                comparator: '>=',
                                values: scope.impliedInsightsFilter
                                    .selectedValues[0],
                                operator: 'AND',
                            },
                            {
                                type: 'value',
                                alias: scope.impliedInsightsFilter
                                    .selectedColumn.alias,
                                comparator: '<=',
                                values: scope.impliedInsightsFilter
                                    .selectedValues[1],
                            },
                        ],
                    ],
                    terminal: true,
                }
            );
            return components;
        }

        /**
         * @name addFilter
         * @desc - called when a user wants to drill down their data by column anomaly
         */
        function addFilter(): void {
            let selected = scope.impliedInsightsFilter.selectedColumn.alias,
                components: PixelCommand[] = [],
                callback;
            scope.impliedInsightsFilter.showOverlay = false;
            scope.widgetCtrl.execute(removeOldViz(), function () {
                if (
                    scope.impliedInsightsFilter.filterType === 'NUMBER' ||
                    scope.impliedInsightsFilter.filterType === 'INT'
                ) {
                    components = createSliderFilter();
                } else {
                    components = createChecklistFilter();
                }

                callback = function (response) {
                    resetFilter();
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }
                    scope.impliedInsightsFilter.filters.push(selected);
                };
                scope.insightCtrl.execute(components, callback);
            });
        }

        /**
         * @name removeFilter
         * @param column - the column to unfilter
         * @desc - called when a user wants to remove a previous anomaly to go back to a past state
         */
        function removeFilter(column: string): void {
            let components: PixelCommand[] = [],
                callback;
            scope.widgetCtrl.execute(removeOldViz(), function () {
                components.push(
                    {
                        type: 'frame',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'Pixel',
                        components: [
                            `UnfilterFrame(["${column.replace(/ /g, '_')}"])`,
                        ],
                        terminal: true,
                    }
                );
                callback = function (response) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }
                    scope.impliedInsightsFilter.filters.pop();
                };
                scope.insightCtrl.execute(components, callback);
            });
        }

        /**
         * @name getOutlierData
         * @desc gets the outlier data to set the filter options
         */
        function getOutlierData(): void {
            let callback;
            callback = function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                if (output.data) {
                    const outlierTableData =
                        semossCoreService.visualization.getTableData(
                            output.data.headers,
                            output.data.values,
                            output.data.headers
                        );
                    setFilterOptions(outlierTableData.rawData);
                }
            };
            scope.widgetCtrl.meta(
                [
                    {
                        type: 'frame',
                        components: [scope.impliedInsightsFilter.outlierFrame],
                        terminal: false,
                    },
                    {
                        type: 'queryAll',
                        components: [],
                        terminal: false,
                    },
                    {
                        type: 'collect',
                        components: [-1],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name initialize
         * @desc initialize the widget
         */
        function initialize(): void {
            const active = scope.widgetCtrl.getWidget('active'),
                prevFilters = optionsService.get(
                    scope.widgetCtrl.widgetId,
                    'filter'
                ),
                outlierFrame = optionsService.get(
                    scope.widgetCtrl.widgetId,
                    'outlierFrame'
                );
            (scope.impliedInsightsFilter.outlierFrame =
                scope.widgetCtrl.getWidget(
                    'view.' + active + '.options.outlierFrame'
                )),
                (scope.impliedInsightsFilter.frameHeaders =
                    scope.widgetCtrl.getWidget(
                        'view.' + active + '.options.headers'
                    ));
            scope.impliedInsightsFilter.helpHtml =
                impliedInsightsService.getHelpHtml() || '';

            if (prevFilters) {
                scope.impliedInsightsFilter.filters = prevFilters;
            }

            if (outlierFrame) {
                scope.impliedInsightsFilter.outlierFrame =
                    outlierFrame.value[0].name;
            }

            if (scope.impliedInsightsFilter.outlierFrame) {
                getOutlierData();
            }

            const updateFrameFilterListener = scope.insightCtrl.on(
                'update-frame-filter',
                runImpliedInsights
            );

            scope.$on('$destroy', function () {
                console.log('destroying implied-insights-filter...');
                updateFrameFilterListener();
                optionsService.set(
                    scope.widgetCtrl.widgetId,
                    'filter',
                    scope.impliedInsightsFilter.filters
                );
            });
        }
        initialize();
    }
}
