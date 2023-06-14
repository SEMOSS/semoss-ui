'use strict';

import angular from 'angular';

import visualizationUniversal from '../../core/store/visualization/visualization.js';

import './format-data-values.scss';

export default angular
    .module('app.format-data-values.directive', [])
    .directive('formatDataValues', formatDataValuesDirective);

formatDataValuesDirective.$inject = ['semossCoreService'];

function formatDataValuesDirective(semossCoreService) {
    formatDataValuesCtrl.$inject = [];
    formatDataValuesLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'formatDataValues',
        bindToController: {},
        template: require('./format-data-values.directive.html'),
        controller: formatDataValuesCtrl,
        link: formatDataValuesLink,
    };

    function formatDataValuesCtrl() {}

    function formatDataValuesLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.formatDataValues.dimensions = {
            list: [],
            selected: {},
        };

        scope.formatDataValues.formats = [];
        scope.formatDataValues.defaultOptionsList = [];

        scope.formatDataValues.format = {
            dimension: '',
            dimensionType: '',
            model: '',
            type: 'Default',
            date: 'Default',
            delimiter: 'Default',
            prepend: '',
            append: '',
            round: 2,
            appliedString: '',
            layout: '',
        };
        // list of default options for all dataTypes
        scope.formatDataValues.defaultOptions =
            semossCoreService.visualization.getDefaultOptions();
        // list of custom options such as delimiter, number type
        scope.formatDataValues.customOptions =
            semossCoreService.visualization.getCustomOptions();

        // functions
        scope.formatDataValues.updateFormatDimensions = updateFormatDimensions;
        scope.formatDataValues.updateFormatType = updateFormatType;
        scope.formatDataValues.editFormat = editFormat;
        scope.formatDataValues.removeFormat = removeFormat;
        scope.formatDataValues.resetFormat = resetFormat;
        scope.formatDataValues.executeFormat = executeFormat;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         */
        function resetPanel(): void {
            const active = scope.widgetCtrl.getWidget('active'),
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                );

            scope.formatDataValues.formats = sharedTools.formatDataValues
                .formats
                ? sharedTools.formatDataValues.formats
                : [];

            //get new list of dimensions in case keys have changed
            setFormatDimensions();
        }

        /**
         * @name findDefaultOptions
         * @description Finds option for a given type
         * @param  {string} type Type to match
         * @return {object|null} Matched option if there is one
         */
        function findDefaultOptions(type: string): any {
            const options = scope.formatDataValues.defaultOptions.find(
                function (option) {
                    return option.value === type;
                }
            );
            if (options) {
                // freeze the original options list before changing
                const newOptions = JSON.parse(JSON.stringify(options.formats));
                // remove 'Custom' format which is always the last in the array
                if (type !== 'STRING') {
                    newOptions.pop();
                }
                return newOptions;
            } else {
                return [];
            }
        }

        /**
         * @name getDefaultOptions
         * @description get list of default options based on selected dimensions dataType
         * @param  {string} type datatype of new default options
         * @return {Array} list of options
         */
        function getDefaultOptions(type: string): any {
            const defaultOptionsList = findDefaultOptions(type);

            // for date and timestamp fields combine the default options list
            if (type === 'DATE') {
                const timestampDefaultOptions = findDefaultOptions('TIMESTAMP');
                for (let i = 0; i < timestampDefaultOptions.length; i++) {
                    defaultOptionsList.push(timestampDefaultOptions[i]);
                }
            } else if (type === 'TIMESTAMP') {
                const dateDefaultOptions = findDefaultOptions('DATE');
                for (let i = 0; i < dateDefaultOptions.length; i++) {
                    defaultOptionsList.push(dateDefaultOptions[i]);
                }
            }

            return defaultOptionsList;
        }

        /**
         * @name setFormatDimensions
         * @desc set the list of dimensions available to format
         */
        function setFormatDimensions(): void {
            const tasks = scope.widgetCtrl.getWidget(
                'view.visualization.tasks'
            );
            const selectedLayout = scope.widgetCtrl.getWidget(
                'view.visualization.layout'
            );

            //pull keys from task data to account for multiple layers
            const mapping: any = {},
                options: any = [];
            for (
                let taskIdx = 0, taskLen = tasks.length;
                taskIdx < taskLen;
                taskIdx++
            ) {
                const layout = tasks[taskIdx].layout,
                    keys = tasks[taskIdx].keys[layout];

                for (
                    let keyIdx = 0, keyLen = keys.length;
                    keyIdx < keyLen;
                    keyIdx++
                ) {
                    const key = keys[keyIdx];

                    //only enable formatting for certain value dimensions depending on layout
                    if (
                        isFormatAllowed(layout, key.model) &&
                        key.model !== 'facet'
                    ) {
                        const option = {
                            alias: key.alias,
                            selector: key.header,
                            derived: key.derived,
                            math: key.math,
                            calculatedBy: key.calculatedBy,
                            groupBy: key.groupBy,
                            type: key.type,
                            dataType: key.dataType,
                            model: key.model,
                            additionalDataType: key.hasOwnProperty(
                                'additionalDataType'
                            )
                                ? key.additionalDataType
                                : '',
                        };

                        // add if it doesn't exist
                        if (!mapping.hasOwnProperty(option.alias)) {
                            options.push(option);

                            mapping[option.alias] = true;
                        }
                    }
                }
            }

            options.sort(function (a, b) {
                const lowerA = a.alias.toLowerCase(),
                    lowerB = b.alias.toLowerCase();

                if (lowerA > lowerB) {
                    return 1;
                } else if (lowerA === lowerB) {
                    return 0;
                }

                return -1;
            });

            // set the dimensions
            scope.formatDataValues.dimensions.list = JSON.parse(
                JSON.stringify(options)
            );

            // applicable to only KPI widget
            if (options.length > 1 && selectedLayout === 'KPI') {
                const allDimensions = {
                    alias: 'All Dimensions',
                    selector: 'All Dimensions',
                    derived: true,
                    math: '',
                    calculatedBy: '',
                    groupBy: [],
                    type: 'allDimensions',
                    dataType: 'INT',
                    model: 'dimension',
                    additionalDataType: '',
                };
                scope.formatDataValues.dimensions.list.push(allDimensions);
            }

            //populate dimension field so not empty when opening widget
            if (scope.formatDataValues.dimensions.list.length > 0) {
                scope.formatDataValues.dimensions.selected = JSON.parse(
                    JSON.stringify(scope.formatDataValues.dimensions.list[0])
                );
                updateFormatDimensions();
            }
        }

        /**
         * @name updateFormatDimensions
         * @desc reset scope to new selected dimension
         * @returns {void}
         */
        function updateFormatDimensions(): void {
            //dont run if dimension not yet selected
            if (
                scope.formatDataValues.dimensions.selected.hasOwnProperty(
                    'alias'
                )
            ) {
                // refresh default options based on dimension selected
                scope.formatDataValues.defaultOptionsList = [];
                scope.formatDataValues.defaultOptionsList = getDefaultOptions(
                    scope.formatDataValues.dimensions.selected.dataType
                );

                // populat widget with formats that have been applied
                for (const format in scope.formatDataValues.formats) {
                    if (
                        scope.formatDataValues.formats[format].dimension ===
                        scope.formatDataValues.dimensions.selected.alias
                    ) {
                        //if selected dimension has applied formats, populate widget with selected rules (Viz Level)
                        scope.formatDataValues.format =
                            scope.formatDataValues.formats[format];

                        // check if format has showDefaultOptions since it's a new property
                        if (
                            !scope.formatDataValues.format.hasOwnProperty(
                                'showDefaultOptions'
                            )
                        ) {
                            scope.formatDataValues.format.showDefaultOptions =
                                false;
                            scope.formatDataValues.format.defaultOption = '';
                        }
                        // pre-set default option based on additional data type or the first option in the list so dropdown is populated
                        if (
                            scope.formatDataValues.format.defaultOption === ''
                        ) {
                            if (
                                scope.formatDataValues.dimensions.selected
                                    .additionalDataType
                            ) {
                                scope.formatDataValues.format.defaultOption =
                                    scope.formatDataValues.dimensions.selected.additionalDataType;
                            } else if (
                                scope.formatDataValues.defaultOptionsList
                                    .length > 0
                            ) {
                                scope.formatDataValues.format.defaultOption =
                                    scope.formatDataValues.defaultOptionsList[0].value;
                            }
                        }
                        return;
                    }
                }
                // if no custom formats applied to selected dimension, populate widget with default rules based on data type (Frame Level)
                scope.formatDataValues.format =
                    visualizationUniversal.mapFormatOpts(
                        scope.formatDataValues.dimensions.selected
                    );
                scope.formatDataValues.format.showDefaultOptions = false;
                // pre-set default option based on additional data type or the first option in the list so dropdown is populated
                if (
                    scope.formatDataValues.dimensions.selected
                        .additionalDataType
                ) {
                    scope.formatDataValues.format.defaultOption =
                        scope.formatDataValues.dimensions.selected.additionalDataType;
                } else if (
                    scope.formatDataValues.defaultOptionsList.length > 0
                ) {
                    scope.formatDataValues.format.defaultOption =
                        scope.formatDataValues.defaultOptionsList[0].value;
                } else {
                    scope.formatDataValues.format.defaultOption = '';
                }

                // refresh dependencies for format 'type' options
                updateFormatType();
            }
        }

        /**
         * @name updateFormatType
         * @desc if a certain format 'type' has other format dependencies, pre-populate widget with these dependencies
         */
        function updateFormatType(): void {
            if (scope.formatDataValues.format.type === 'Scientific') {
                scope.formatDataValues.format.delimiter = 'Default';
            } else if (
                scope.formatDataValues.format.type === 'Accounting' ||
                scope.formatDataValues.format.type === 'Thousand' ||
                scope.formatDataValues.format.type === 'Million' ||
                scope.formatDataValues.format.type === 'Billion' ||
                scope.formatDataValues.format.type === 'Trillion'
            ) {
                scope.formatDataValues.format.delimiter = ',';
            }
        }

        /**
         * @name editFormat
         * @desc edit the selected format from applied formats
         * @param idx - selected format
         */
        function editFormat(dimension: string): void {
            let dim;

            for (
                dim = 0;
                dim < scope.formatDataValues.dimensions.list.length;
                dim++
            ) {
                if (
                    scope.formatDataValues.dimensions.list[dim].alias ===
                    dimension
                ) {
                    scope.formatDataValues.dimensions.selected =
                        scope.formatDataValues.dimensions.list[dim];
                }
            }

            updateFormatDimensions();
        }

        /**
         * @name removeFormat
         * @desc remove the selected format from applied formats
         * @param idx - selected format
         */
        function removeFormat(idx: number): void {
            scope.formatDataValues.formats.splice(idx, 1);
            executeFormat(false);
        }

        /**
         * @name resetFormat
         * @desc reset scope to default state for new dimension selection
         */
        function resetFormat(): void {
            scope.formatDataValues.format =
                visualizationUniversal.mapFormatOpts(
                    scope.formatDataValues.dimensions.selected
                );
        }

        /**
         * @name getApplied
         * @desc gets a string of applied formats for display in "Applied Formats" field
         * @returns {void}
         */
        function getApplied(format: any): void {
            let applied = '';

            if (format) {
                let firstFormat = true;

                // check for default option first if it is selected
                if (
                    format.hasOwnProperty('showDefaultOptions') &&
                    format.showDefaultOptions
                ) {
                    // find correct default options in case the currently selected dimension has changed before executing
                    const defaultOptionsList = findDefaultOptions(
                        format.dimensionType
                    );
                    const displayOption = defaultOptionsList.find(function (
                        option
                    ) {
                        return option.value === format.defaultOption;
                    });
                    if (displayOption) {
                        applied = '( ' + displayOption.display + ' )';
                        format.appliedString = applied;
                        return;
                    }
                }

                // non-default formats
                applied += '( ';
                if (format.prepend !== '') {
                    applied = applied + "'" + format.prepend + "' ";
                    firstFormat = false;
                }

                if (format.append !== '') {
                    if (firstFormat) {
                        applied = applied + "'" + format.append + "' ";
                        firstFormat = false;
                    } else {
                        applied = applied + ', ' + "'" + format.append + "' ";
                    }
                }
                if (format.round || format.round === 0) {
                    let roundString = '';
                    if (format.round === 0) {
                        roundString = '0';
                    } else {
                        roundString = '0.';
                    }

                    for (let i = 0; i < format.round; i++) {
                        roundString = roundString + '0';
                    }
                    if (firstFormat) {
                        applied = applied + "'" + roundString + "' ";
                        firstFormat = false;
                    } else {
                        applied = applied + ', ' + "'" + roundString + "' ";
                    }
                }
                if (format.type !== 'Default') {
                    if (firstFormat) {
                        applied = applied + "'" + format.type + "' ";
                        firstFormat = false;
                    } else {
                        applied = applied + ', ' + "'" + format.type + "' ";
                    }
                }
                if (format.date !== 'Default') {
                    if (firstFormat) {
                        applied = applied + "'" + format.date + "' ";
                        firstFormat = false;
                    } else {
                        applied = applied + ', ' + "'" + format.date + "' ";
                    }
                }
                if (format.delimiter !== 'Default') {
                    let delimiterName = '';
                    if (format.delimiter === ',') {
                        delimiterName = 'Comma';
                    } else if (format.delimiter === '.') {
                        delimiterName = 'Period';
                    }

                    if (firstFormat) {
                        applied = applied + "'" + delimiterName + "' ";
                        firstFormat = false;
                    } else {
                        applied = applied + ', ' + "'" + delimiterName + "' ";
                    }
                }
                if (firstFormat) {
                    applied = applied + 'Default';
                }
                applied = applied + ' )';
            }

            format.appliedString = applied;
        }

        /**
         * @name selectDefaultOption
         * @desc reset format rules based on default format selected
         * @returns {void}
         */
        function selectDefaultOption(format: any, dimension: any): any {
            // preserve default option before re-mapping format rules
            const oldDefaultOption = JSON.parse(
                JSON.stringify(format.defaultOption)
            );

            // set additional data type to default selection so we can map the rules
            // we reset dimension info back to original key info once the widget is executed
            if (oldDefaultOption) {
                dimension.additionalDataType = oldDefaultOption;
            }
            format = visualizationUniversal.mapFormatOpts(dimension);
            format.showDefaultOptions = true;
            format.defaultOption = oldDefaultOption;
            return format;
        }

        /**
         * @name executeFormat
         * @desc executes the pixel with updated tools settings
         * @param apply - apply the new filter
         */
        function executeFormat(apply: boolean): void {
            if (
                scope.formatDataValues.format.hasOwnProperty('date') &&
                scope.formatDataValues.format.date !== 'Default' &&
                scope.formatDataValues.dimensions.selected.dataType !==
                    'DATE' &&
                scope.formatDataValues.dimensions.selected.dataType !==
                    'TIMESTAMP'
            ) {
                scope.widgetCtrl.alert(
                    'error',
                    'Date Formats cannot be applied to non-date type fields.'
                );
                return;
            }
            // throw error if default option checkbox selected but no format specified
            if (
                scope.formatDataValues.format.hasOwnProperty(
                    'showDefaultOptions'
                ) &&
                scope.formatDataValues.format.showDefaultOptions &&
                scope.formatDataValues.format.defaultOption === ''
            ) {
                scope.widgetCtrl.alert(
                    'error',
                    'Please select default option from dropdown or de-select default options checkbox'
                );
                return;
            }

            // new format rule created
            if (apply) {
                // if default option selected build format rules around default option
                if (scope.formatDataValues.format.showDefaultOptions) {
                    scope.formatDataValues.format = selectDefaultOption(
                        scope.formatDataValues.format,
                        scope.formatDataValues.dimensions.selected
                    );
                }
                // set up an array when the 'All Dimensions' use case is selected--where we want to loop through all of the dimensions and set the same formatting
                let formatDataDimensions = [
                    scope.formatDataValues.dimensions.selected,
                ];
                if (
                    scope.formatDataValues.dimensions.selected.type ===
                    'allDimensions'
                ) {
                    formatDataDimensions =
                        scope.formatDataValues.dimensions.list;
                }
                for (const dim in formatDataDimensions) {
                    if (formatDataDimensions[dim].type !== 'allDimensions') {
                        // add new format to array of applied formats
                        const format = {
                            dimension: formatDataDimensions[dim].alias,
                            dimensionType: formatDataDimensions[dim].dataType,
                            model: formatDataDimensions[dim].model,
                            type:
                                scope.formatDataValues.format.type || 'Default',
                            date:
                                scope.formatDataValues.format.date || 'Default',
                            delimiter:
                                scope.formatDataValues.format.delimiter ||
                                'Default',
                            prepend:
                                scope.formatDataValues.format.prepend || '',
                            append: scope.formatDataValues.format.append || '',
                            round: scope.formatDataValues.format.round
                                ? scope.formatDataValues.format.round
                                : scope.formatDataValues.format.round === 0
                                ? 0
                                : '',
                            appliedString: '',
                            showDefaultOptions:
                                scope.formatDataValues.format
                                    .showDefaultOptions,
                            defaultOption: scope.formatDataValues.format
                                .showDefaultOptions
                                ? scope.formatDataValues.format.defaultOption
                                : '',
                            layout: scope.widgetCtrl.getWidget(
                                'view.visualization.layout'
                            ),
                        };
                        // get applied format string for new format selection
                        getApplied(format);

                        // refresh previous format rules if changed before execute
                        for (
                            let formatIdx =
                                scope.formatDataValues.formats.length - 1;
                            formatIdx >= 0;
                            formatIdx--
                        ) {
                            let oldFormat =
                                scope.formatDataValues.formats[formatIdx];

                            //if new format rules are applied to the same dimension, remove old rules
                            if (oldFormat.dimension === format.dimension) {
                                scope.formatDataValues.formats.splice(
                                    formatIdx,
                                    1
                                );
                                continue;
                            }

                            // if default option selection has changed for other dimensions not currently selected
                            if (oldFormat.showDefaultOptions) {
                                const dimension =
                                    scope.formatDataValues.dimensions.list.find(
                                        function (dim) {
                                            return (
                                                dim.alias ===
                                                oldFormat.dimension
                                            );
                                        }
                                    );
                                if (dimension) {
                                    oldFormat = selectDefaultOption(
                                        oldFormat,
                                        dimension
                                    );
                                }
                            } else {
                                // clear out old default option selection if checkbox deselected
                                oldFormat.defaultOption = '';
                            }

                            // refresh applied formats string for each dimension
                            getApplied(oldFormat);
                            // save on scope
                            scope.formatDataValues.formats[formatIdx] =
                                oldFormat;
                        }
                        // add new rule
                        scope.formatDataValues.formats.push(format);
                    }
                }
            }

            // execute the pixel
            scope.widgetCtrl.execute(
                [
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'addPanelOrnaments',
                        components: [
                            {
                                tools: {
                                    shared: {
                                        formatDataValues:
                                            scope.formatDataValues.formats
                                                .length > 0
                                                ? {
                                                      formats:
                                                          scope.formatDataValues
                                                              .formats,
                                                  }
                                                : false,
                                    },
                                },
                            },
                        ],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'retrievePanelOrnaments',
                        components: ['tools'],
                        terminal: true,
                    },
                ],
                () => {},
                [scope.widgetCtrl.widgetId]
            );
        }

        /** Utility */
        /**
         * @name isFormatAllowed
         * @desc checks whether custom formatting should be enabled for the selected dimension based on visualization type
         * @returns formatting allowed
         */
        function isFormatAllowed(layout: string, model: string): boolean {
            //old rules to re-implement if labels should NOT be allowed
            /*if (layout === 'HeatMap') {
                if (model !== 'x' && model !== 'y') {
                    return true;
                }
            } else if (layout === 'Waterfall') {
                if (model !== 'label' && model !== 'end') {
                    return true;
                } 
            } else if (layout === 'GanttD3') {
                if (model !== 'task') {
                    return true;
                } 
            } else if (layout === 'TreeMap') {
                if (model !== 'series') {
                    return true;
                }
            } else if (layout === 'Cloud') { 
                if (model !== 'label') {
                    return true;
                }
            } else if (layout === 'Bullet') {
                if (model !== 'targetValue' && model !== 'badMarker' && model !== 'satisfactoryMarker' && model !== 'excellentMarker') {
                    return true;
                }
            } else if (layout === 'GanttD3') {
                //all gannt date dimensions should be formatted the same
                if (model !== 'task' && model !== 'end' && model !== 'milestone') {
                    return true;
                } 
            } else {
                if (model !== 'label') {
                    return true;
                }
            }*/
            if (layout === 'Waterfall') {
                if (model !== 'end') {
                    return true;
                }
            } else if (layout === 'GanttD3') {
                //TODO unsure how gantt d3 configures axis labels
                if (model !== 'progress' && model !== 'task') {
                    return true;
                }
            } else if (layout === 'Cloud') {
                if (model !== 'label') {
                    return true;
                }
            } else {
                return true;
            }

            return false;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // listeners
            const formatDataValuesUpdateFrameListener = scope.widgetCtrl.on(
                    'update-frame',
                    resetPanel
                ),
                formatDataValuesUpdateTaskListener = scope.widgetCtrl.on(
                    'update-task',
                    resetPanel
                ),
                updateOrnamentsListener = scope.widgetCtrl.on(
                    'update-ornaments',
                    resetPanel
                ),
                addDataListener = scope.widgetCtrl.on('added-data', resetPanel);

            // cleanup
            scope.$on('$destroy', function () {
                formatDataValuesUpdateFrameListener();
                formatDataValuesUpdateTaskListener();
                updateOrnamentsListener();
                addDataListener();
            });

            resetPanel();
        }

        initialize();
    }
}
