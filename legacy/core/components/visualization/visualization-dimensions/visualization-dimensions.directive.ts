'use strict';

import angular from 'angular';

import './visualization-dimensions.scss';

export default angular
    .module('app.visualization.visualization-dimensions', [])
    .directive('visualizationDimensions', visualizationDimensionsDirective);

visualizationDimensionsDirective.$inject = ['$timeout', 'semossCoreService'];

function visualizationDimensionsDirective($timeout, semossCoreService) {
    visualizationDimensionsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '^view'],
        controllerAs: 'visualizationDimensions',
        bindToController: {},
        template: require('./visualization-dimensions.directive.html'),
        controller: visualizationDimensionsCtrl,
        link: visualizationDimensionsLink,
    };

    function visualizationDimensionsCtrl() {}

    function visualizationDimensionsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.viewCtrl = ctrl[1];

        const OPTIONS = {
                math: {
                    DATE: ['Count', 'UniqueCount'],
                    TIMESTAMP: ['Count', 'UniqueCount'],
                    STRING: ['Count', 'UniqueCount'],
                    FACTOR: ['Count', 'UniqueCount'],
                    NUMBER: [
                        'Average',
                        'UniqueAverage',
                        'Sum',
                        'UniqueSum',
                        'StandardDeviation',
                        'Max',
                        'Median',
                        'Min',
                        'Count',
                        'UniqueCount',
                    ],
                },
                concat: {
                    DATE: ['UniqueGroupConcat', 'GroupConcat'],
                    TIMESTAMP: ['UniqueGroupConcat', 'GroupConcat'],
                    STRING: ['UniqueGroupConcat', 'GroupConcat'],
                    FACTOR: ['UniqueGroupConcat', 'GroupConcat'],
                    NUMBER: ['UniqueGroupConcat', 'GroupConcat'],
                },
            },
            OPTIONSALIAS = {
                Count: 'Count',
                UniqueCount: 'Unique_Count',
                Average: 'Average',
                UniqueAverage: 'Unique_Average',
                Sum: 'Sum',
                UniqueSum: 'Unique_Sum',
                StandardDeviation: 'Standard_Deviation',
                Max: 'Max',
                Median: 'Median',
                Min: 'Min',
                UniqueGroupConcat: 'Unique_Group_Concat',
                GroupConcat: 'GroupConcat',
                Group: 'Group',
            },
            SIMILAR = {
                xy: ['Column', 'Polar', 'Line', 'Area', 'Radar'],
                labelValue: [
                    'Pie',
                    'Funnel',
                    'Cloud',
                    'Gauge',
                    'Radial',
                    'Bubble',
                ],
                labelXY: ['Scatter', 'Map', 'Scatter3d'],
                groupValue: ['Pack', 'Sunburst'],
                startEnd: ['Graph', 'VivaGraph', 'GraphGL'],
            };

        // VARIABLES
        scope.visualizationDimensions.layer = {};

        scope.visualizationDimensions.active = {
            view: '',
            layout: '',
        };

        scope.visualizationDimensions.frame = {
            name: '',
            type: '',
            headers: [],
            joins: [],
        };

        scope.visualizationDimensions.availableFrames = [];

        scope.visualizationDimensions.type = 'echarts';

        scope.visualizationDimensions.headers = {
            // headers for the left side
            raw: [],
            searched: [],
            search: '',
        };

        scope.visualizationDimensions.fields = {
            // fields for the left side
            list: [],
            format: '',
            additional: {
                GGPlot: [''], // ggplot script
                Seaborn: [''], // seaborn script
            },
        };

        scope.visualizationDimensions.drag = {
            source: {
                ele: '',
                idx: -1,
                alias: '',
            },
            active: false,
            original: false,
            target: '',
        };

        scope.visualizationDimensions.autoDraw = true; // bool to auto draw the visualization
        scope.visualizationDimensions.aggregationSelected = false; // bool to activate reset math button for grid

        scope.visualizationDimensions.recommendations = {
            available: false,
            toggle: false,
        };

        scope.visualizationDimensions.facet = {
            active: false,
            viewTypes: ['Individual Instance', 'All Instances', 'Series'],
            selectedViewType: 'Individual Instance',
            allInstances: false,
            allInstanceCharts: [
                'Column',
                'Line',
                'Area',
                'Pie',
                'Funnel',
                'Scatter',
                'Map',
            ],
        };

        scope.visualizationDimensions.visual = {
            name: '',
            image: '',
        };

        scope.visualizationDimensions.showVisuals = false;

        scope.visualizationDimensions.searchHeaders = searchHeaders;
        scope.visualizationDimensions.validateFields = validateFields;
        scope.visualizationDimensions.addField = addField;
        scope.visualizationDimensions.addFields = addFields;
        scope.visualizationDimensions.updateFieldGroup = updateFieldGroup;
        scope.visualizationDimensions.removeField = removeField;
        scope.visualizationDimensions.removeFields = removeFields;
        scope.visualizationDimensions.generateTooltip = generateTooltip;
        scope.visualizationDimensions.onDragStart = onDragStart;
        scope.visualizationDimensions.onDragMoved = onDragMoved;
        scope.visualizationDimensions.onDragDrop = onDragDrop;
        scope.visualizationDimensions.onDragEnd = onDragEnd;
        scope.visualizationDimensions.updateAutoDraw = updateAutoDraw;
        scope.visualizationDimensions.toggleRecommendations =
            toggleRecommendations;
        scope.visualizationDimensions.populateRecommended = populateRecommended;
        scope.visualizationDimensions.resetGridCalculations =
            resetGridCalculations;
        scope.visualizationDimensions.setFrame = setFrame;

        /******************* Old *******************/
        /******************* Old *******************/
        /******************* Old *******************/
        /******************* Old *******************/
        /******************* Old *******************/

        scope.visualizationDimensions.showDimensions = true;

        /*** Dimensions */
        /**
         * @name resetDimensions
         * @desc reset the panel when the widget changes
         */
        function resetDimensions(): void {
            // set the new layer
            scope.visualizationDimensions.layer = scope.viewCtrl.getLayer();

            if (
                !scope.visualizationDimensions.layer ||
                Object.keys(scope.visualizationDimensions.layer).length === 0
            ) {
                return;
            }

            // set the new layout
            scope.visualizationDimensions.active = scope.viewCtrl.getActive();
            if (!scope.visualizationDimensions.active.layout) {
                return;
            }

            // get the frame headers
            scope.visualizationDimensions.frame = angular.extend(
                {
                    name: '',
                    type: '',
                    headers: [],
                    joins: [],
                },
                scope.widgetCtrl.getFrame() || {}
            );

            if (
                !scope.visualizationDimensions.frame ||
                scope.visualizationDimensions.frame.headers.length === 0
            ) {
                return;
            }

            scope.visualizationDimensions.type =
                scope.visualizationDimensions.active.type || 'echarts';

            // get the headers for the left side
            getHeaders();

            // current task
            const keys =
                scope.widgetCtrl.getWidget(
                    `view.visualization.tasks.${scope.visualizationDimensions.layer.taskIdx}.keys.${scope.visualizationDimensions.active.layout}`
                ) || [];

            // create the right list with the given keys
            buildFields(keys);

            const active = scope.widgetCtrl.getWidget('active');
            if (
                scope.visualizationDimensions.active.view === 'visualization' &&
                active !== 'visualization'
            ) {
                validateFields();
            }

            // update the recommendations
            updateRecommendations();
        }

        /**
         * @name paintDimensions
         * @desc a new layout has been selected, try to paint it
         */
        function paintDimensions(): void {
            // this is the old layout
            const old = scope.visualizationDimensions.active.layout;

            // set the new layer
            scope.visualizationDimensions.layer = scope.viewCtrl.getLayer();

            if (
                !scope.visualizationDimensions.layer ||
                Object.keys(scope.visualizationDimensions.layer).length === 0
            ) {
                return;
            }

            // set the new layout
            scope.visualizationDimensions.active = scope.viewCtrl.getActive();
            if (!scope.visualizationDimensions.active.layout) {
                return;
            }

            // get the frame headers
            scope.visualizationDimensions.frame = angular.extend(
                {
                    name: '',
                    type: '',
                    headers: [],
                    joins: [],
                },
                scope.widgetCtrl.getFrame() || {}
            );

            if (
                !scope.visualizationDimensions.frame ||
                scope.visualizationDimensions.frame.headers.length === 0
            ) {
                return;
            }

            scope.visualizationDimensions.type =
                scope.visualizationDimensions.active.type || 'echarts';

            // get the headers for the left side
            getHeaders();

            // if previous keys exist we have to use those as the selected keys AS LONG
            // as they still exist...dropping or renaming columns can cause this to crash so we
            // need to constantly check for them
            let oldKeys: any[],
                keys: any[] = [];

            oldKeys =
                scope.widgetCtrl.getWidget(
                    `view.visualization.tasks.${scope.visualizationDimensions.layer.taskIdx}.keys.${scope.visualizationDimensions.active.layout}`
                ) || [];
            if (oldKeys.length > 0) {
                // if the previous keys exist, we have to remove the ones that don't exist anymore

                // Note: we could splice the keys out, but we aren't sure about the calculated.
                keys = oldKeys;
                keyLoop: for (
                    let keyIdx = 0, keyLen = keys.length;
                    keyIdx < keyLen;
                    keyIdx++
                ) {
                    const key = keys[keyIdx];

                    for (
                        let headerIdx = 0,
                            headerLen =
                                scope.visualizationDimensions.headers.raw
                                    .length;
                        headerIdx < headerLen;
                        headerIdx++
                    ) {
                        const header =
                            scope.visualizationDimensions.headers.raw[
                                headerIdx
                            ];

                        // if it matches, we can break and continue
                        if (!key.calculatedBy && key.alias === header.alias) {
                            continue keyLoop;
                        }
                        if (
                            key.calculatedBy &&
                            key.calculatedBy === header.alias
                        ) {
                            continue keyLoop;
                        }
                    }

                    // key is not found
                    // clear it out and break the loop
                    keys = [];
                    break keyLoop;
                }
            }

            if (keys.length === 0) {
                oldKeys =
                    scope.widgetCtrl.getWidget(
                        `view.visualization.tasks.${scope.visualizationDimensions.layer.taskIdx}.keys.${old}`
                    ) || [];
                if (oldKeys.length > 0) {
                    for (const group in SIMILAR) {
                        if (SIMILAR.hasOwnProperty(group)) {
                            if (
                                SIMILAR[group].indexOf(old) > -1 &&
                                SIMILAR[group].indexOf(
                                    scope.visualizationDimensions.active.layout
                                ) > -1
                            ) {
                                keys = oldKeys;
                                keyLoop: for (
                                    let keyIdx = 0, keyLen = keys.length;
                                    keyIdx < keyLen;
                                    keyIdx++
                                ) {
                                    const key = keys[keyIdx];

                                    for (
                                        let headerIdx = 0,
                                            headerLen =
                                                scope.visualizationDimensions
                                                    .headers.raw.length;
                                        headerIdx < headerLen;
                                        headerIdx++
                                    ) {
                                        const header =
                                            scope.visualizationDimensions
                                                .headers.raw[headerIdx];

                                        // if it matches, we can break and continue
                                        if (
                                            !key.calculatedBy &&
                                            key.alias === header.alias
                                        ) {
                                            continue keyLoop;
                                        }

                                        if (
                                            key.calculatedBy &&
                                            key.calculatedBy === header.alias
                                        ) {
                                            continue keyLoop;
                                        }
                                    }

                                    // key is not found
                                    // clear it out and break the loop
                                    keys = [];
                                    break keyLoop;
                                }
                            }
                        }
                    }
                }
            }

            buildFields(keys);

            // we want to update the dimensions but dont want to auto draw if the layout has not been changed
            if (
                scope.visualizationDimensions.autoDraw &&
                old !== scope.visualizationDimensions.active.layout
            ) {
                validateFields();
            }

            // layout has changed
            updateRecommendations();
        }

        /*** Headers */
        /**
         * @name getHeaders
         * @desc get the headers for the left side
         */
        function getHeaders(): void {
            // create the headers
            scope.visualizationDimensions.headers.raw = [];
            for (
                let headerIdx = 0,
                    len = scope.visualizationDimensions.frame.headers.length;
                headerIdx < len;
                headerIdx++
            ) {
                scope.visualizationDimensions.headers.raw.push({
                    alias: scope.visualizationDimensions.frame.headers[
                        headerIdx
                    ].alias,
                    model: false,
                    math: false,
                    calculatedBy: false,
                    groupBy: [],
                    type: scope.visualizationDimensions.frame.headers[headerIdx]
                        .dataType,
                    derived: false,
                });
            }

            searchHeaders();
        }

        /**
         * @name searchHeaders
         * @desc filter out the model that is used by the list of headers used for drag and drop
         */
        function searchHeaders(): void {
            let cleaned = scope.visualizationDimensions.headers.search.replace(
                / /g,
                '_'
            );

            scope.visualizationDimensions.headers.searched = [];

            let regex;
            try {
                regex = new RegExp(cleaned, 'g');
            } catch (err) {
                regex = false;
            }

            // uppercase after making the regex
            cleaned = cleaned.toUpperCase();

            for (
                let headerIdx = 0,
                    headerLen =
                        scope.visualizationDimensions.headers.raw.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                const header =
                    scope.visualizationDimensions.headers.raw[headerIdx];

                if (
                    (regex && header.alias.match(regex)) ||
                    header.alias.toUpperCase().indexOf(cleaned) > -1
                ) {
                    scope.visualizationDimensions.headers.searched.push(header);
                }
            }
        }

        /**
         * @name getCalculatedByHeaderInfo
         * @param {string} calculatedBy - calculated value
         * @desc returns the original headerInfo
         * @returns {object} - original headerInfo
         */
        function getCalculatedByHeaderInfo(calculatedBy: string): any {
            if (calculatedBy) {
                for (
                    let headerIdx = 0,
                        headerLen =
                            scope.visualizationDimensions.headers.raw.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    const header =
                        scope.visualizationDimensions.headers.raw[headerIdx];

                    if (header.alias === calculatedBy) {
                        return JSON.parse(JSON.stringify(header));
                    }
                }
            }

            return false;
        }

        /*** Fields */
        /**
         * @name buildFields
         * @desc function that verifies the visualization's view and gets the default options (and sets them)
         * @param keys - keys to orient too
         */
        function buildFields(keys: any[]): void {
            // current task that was run
            const task =
                scope.widgetCtrl.getWidget(
                    `view.visualization.tasks.${scope.visualizationDimensions.layer.taskIdx}`
                ) || {};

            const type = scope.visualizationDimensions.active.type || 'echarts';
            const widget =
                semossCoreService.getActiveVisualizationId(
                    scope.visualizationDimensions.active.layout,
                    type
                ) || '';
            const config =
                semossCoreService.getSpecificConfig(widget, 'visualization') ||
                {};

            let groupBy: any[] = [];

            scope.visualizationDimensions.fields.list = config.fields || [];
            scope.visualizationDimensions.fields.format = config.format || '';

            // hide grid reset button by default until we check for math
            scope.visualizationDimensions.aggregationSelected = false;

            // If graph, add facet dimension to keys
            if (
                scope.visualizationDimensions.active.layout === 'Graph' &&
                task.groupByInfo
            ) {
                let dimensionType;
                for (
                    let headerIdx = 0,
                        headerLen =
                            scope.visualizationDimensions.headers.raw.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    const header =
                        scope.visualizationDimensions.headers.raw[headerIdx];

                    if (header.alias === task.groupByInfo.selectedDim) {
                        dimensionType = header.type;
                        break;
                    }
                }

                keys.push({
                    alias: task.groupByInfo.selectedDim,
                    calculatedBy: false,
                    derived: false,
                    groupBy: [],
                    header: task.groupByInfo.selectedDim,
                    math: false,
                    model: 'facet',
                    type: dimensionType,
                });
            }

            if (scope.visualizationDimensions.fields.format === 'graph') {
                for (
                    let listIdx = 0,
                        listLen =
                            scope.visualizationDimensions.fields.list.length;
                    listIdx < listLen;
                    listIdx++
                ) {
                    const field =
                        scope.visualizationDimensions.fields.list[listIdx];

                    if (!field.selected) {
                        field.selected = [];
                    }

                    keys.forEach(function (key) {
                        if (key.model === field.model) {
                            field.selected.push(key);
                        }
                    });
                }
            } else {
                // reverse (because we loop and add in reverse)
                keys.reverse();

                // first we set based on the model
                for (
                    let listIdx = 0,
                        listLen =
                            scope.visualizationDimensions.fields.list.length;
                    listIdx < listLen;
                    listIdx++
                ) {
                    const field =
                        scope.visualizationDimensions.fields.list[listIdx];

                    // add in selected if it isn't there
                    if (!field.selected) {
                        field.selected = [];
                    }

                    for (let keyIdx = keys.length - 1; keyIdx >= 0; keyIdx--) {
                        const key = keys[keyIdx];

                        // match based on model OR
                        // for old Grid visualizations with validate fields that have not yet been added we'll add them to label
                        if (
                            field.model === key.model ||
                            (scope.visualizationDimensions.active.layout ===
                                'Grid' &&
                                key.model === 'validate' &&
                                field.model === 'label')
                        ) {
                            // validate ...
                            if (
                                field.multiField ||
                                field.selected.length === 0
                            ) {
                                const modified = JSON.parse(
                                    JSON.stringify(key)
                                ); // copy it

                                // check for groupBy for grid
                                if (
                                    scope.visualizationDimensions.active
                                        .layout === 'Grid' &&
                                    modified.groupBy &&
                                    modified.groupBy.length > 0
                                ) {
                                    groupBy = modified.groupBy;
                                }

                                if (modified.calculatedBy) {
                                    const calculatedByHeaderInfo =
                                        getCalculatedByHeaderInfo(
                                            modified.calculatedBy
                                        );

                                    // activate grid reset math button
                                    if (
                                        scope.visualizationDimensions.active
                                            .layout === 'Grid'
                                    ) {
                                        scope.visualizationDimensions.aggregationSelected =
                                            true;
                                    }

                                    // clear out the options
                                    modified.availableOptions = [];
                                    if (
                                        calculatedByHeaderInfo &&
                                        (field.group === 'math' ||
                                            field.group === 'concat')
                                    ) {
                                        // options are based on the original
                                        modified.availableOptions =
                                            getAvailableOptions(
                                                field.group,
                                                calculatedByHeaderInfo.type,
                                                field.model
                                            );
                                    }
                                } else if (
                                    scope.visualizationDimensions.active
                                        .layout === 'Grid'
                                ) {
                                    // for grid always add the options
                                    modified.availableOptions = [];
                                    if (
                                        field.group === 'math' ||
                                        field.group === 'concat'
                                    ) {
                                        modified.availableOptions =
                                            getAvailableOptions(
                                                field.group,
                                                modified.type,
                                                field.model
                                            );
                                    }
                                }

                                // pivot table specific manipulations....ugh
                                if (
                                    task &&
                                    task.data &&
                                    task.data.pivotData &&
                                    field.group === 'math'
                                ) {
                                    for (
                                        let valueIdx = 0,
                                            valueLen =
                                                task.data.pivotData.values
                                                    .length;
                                        valueIdx < valueLen;
                                        valueIdx++
                                    ) {
                                        const value =
                                            task.data.pivotData.values[
                                                valueIdx
                                            ];
                                        if (
                                            value.alias === modified.alias &&
                                            value.math
                                        ) {
                                            modified.math = value.math;
                                            modified.calculatedBy = value.alias;
                                            modified.availableOptions =
                                                getAvailableOptions(
                                                    field.group,
                                                    modified.type,
                                                    field.model
                                                );
                                            break;
                                        }
                                    }
                                }

                                // add it
                                field.selected.push(
                                    JSON.parse(JSON.stringify(modified))
                                );

                                // remove it
                                keys.splice(keyIdx, 1); // remove
                            }
                        }
                    }

                    // for grid only groupBy will hold fields selected as group aggregation
                    if (groupBy.length > 0) {
                        // reset selected math to be Group since BE does not return math
                        for (
                            let grpIdx = 0;
                            grpIdx < groupBy.length;
                            grpIdx++
                        ) {
                            const groupField = field.selected.find(
                                (col) => col.alias === groupBy[grpIdx]
                            );
                            if (groupField) {
                                groupField.math = 'Group';
                            }
                        }
                    }

                    // input specific
                    if (field.type === 'input') {
                        // ggplot
                        if (
                            scope.visualizationDimensions.active.layout ===
                                'GGPlot' &&
                            task.data.ggplot
                        ) {
                            scope.visualizationDimensions.fields.additional.GGPlot[0] =
                                'ggplot=["' + task.data.ggplot + '"]';
                            if (task.data.format) {
                                scope.visualizationDimensions.fields.additional.GGPlot[0] +=
                                    ', format=["' + task.data.format + '"]';
                            }
                        } else if (
                            scope.visualizationDimensions.active.layout ===
                                'Seaborn' &&
                            task.data.splot
                        ) {
                            scope.visualizationDimensions.fields.additional.Seaborn[0] =
                                'splot=["' + task.data.splot + '"]';
                            if (task.data.format) {
                                scope.visualizationDimensions.fields.additional.Seaborn[0] +=
                                    ', format=["' + task.data.format + '"]';
                            }
                        }
                    }
                }

                // now we select based on the position
                for (
                    let listIdx = 0,
                        listLen =
                            scope.visualizationDimensions.fields.list.length;
                    listIdx < listLen;
                    listIdx++
                ) {
                    const field =
                        scope.visualizationDimensions.fields.list[listIdx];

                    // add in selected if it isn't there
                    if (!field.selected) {
                        field.selected = [];
                    }

                    if (field.model === 'facet') {
                        continue;
                    }

                    for (let keyIdx = keys.length - 1; keyIdx >= 0; keyIdx--) {
                        const key = keys[keyIdx];

                        // validate ...
                        if (
                            key.model !== 'groupBy' &&
                            (field.multiField || field.selected.length === 0)
                        ) {
                            const modified = JSON.parse(JSON.stringify(key)); // copy it

                            if (
                                field.acceptableTypes.indexOf(modified.type) ===
                                    -1 &&
                                !field.hasOwnProperty('group')
                            ) {
                                if (!field.optional) {
                                    field.selected = [];
                                }
                            } else {
                                if (modified.calculatedBy) {
                                    const calculatedByHeaderInfo =
                                        getCalculatedByHeaderInfo(
                                            modified.calculatedBy
                                        );

                                    modified.availableOptions = [];
                                    modified.availableOptions = [];
                                    if (
                                        calculatedByHeaderInfo &&
                                        (field.group === 'math' ||
                                            field.group === 'concat')
                                    ) {
                                        // options are based on the original
                                        modified.availableOptions =
                                            getAvailableOptions(
                                                field.group,
                                                calculatedByHeaderInfo.type,
                                                field.model
                                            );
                                    }
                                }

                                if (modified.model === field.model) {
                                    field.selected.push(
                                        semossCoreService.utility.freeze(
                                            modified
                                        )
                                    );
                                }
                            }

                            // remove it
                            keys.splice(keyIdx, 1); // remove
                        }
                    }
                }
            }
        }

        /**
         * @name getAvailableOptions
         * @param {string} group  dimension group type
         * @param {string} type  dimension type
         * @param {string} model  dimension chart option model
         * @desc get available dropdown options for chart option
         */
        function getAvailableOptions(
            group: string,
            type: string,
            model: string
        ): { display: string; value: string }[] {
            const options = JSON.parse(JSON.stringify(OPTIONS[group][type]));

            if (model === 'tooltip') {
                if (options.indexOf('GroupConcat') === -1) {
                    options.push('GroupConcat');
                }
                if (options.indexOf('UniqueGroupConcat') === -1) {
                    options.push('UniqueGroupConcat');
                }
            }

            const available: { display: string; value: string }[] = [];
            for (
                let optIdx = 0, optLen = options.length;
                optIdx < optLen;
                optIdx++
            ) {
                available.push({
                    display: OPTIONSALIAS.hasOwnProperty(options[optIdx])
                        ? OPTIONSALIAS[options[optIdx]]
                        : options[optIdx],
                    value: options[optIdx],
                });
            }
            // add the Group aggregation to the dropdown for Grid only
            if (scope.visualizationDimensions.active.layout === 'Grid') {
                available.push({
                    display: 'Group',
                    value: 'Group',
                });
            }

            return available;
        }

        /**
         * @name validateFields
         * @desc function that checks the selected options and checks duplicates if necessary
         */
        function validateFields(): void {
            let valid = true,
                group = false,
                allMath = true,
                oldGroupBy: any[] = [],
                math = false;
            // if graph and not in grid frame, automatically paint, so lets just set
            if (
                (scope.visualizationDimensions.active.layout === 'Graph' ||
                    scope.visualizationDimensions.active.layout ===
                        'VivaGraph' ||
                    scope.visualizationDimensions.active.layout ===
                        'GraphGL') &&
                scope.visualizationDimensions.frame.type === 'GRAPH'
            ) {
                valid = true;
            } else {
                // don't run if we don't have the selectors...
                if (!scope.visualizationDimensions.fields.list.length) {
                    valid = false;
                }

                for (
                    let listIdx = 0,
                        listLen =
                            scope.visualizationDimensions.fields.list.length;
                    listIdx < listLen;
                    listIdx++
                ) {
                    const field =
                        scope.visualizationDimensions.fields.list[listIdx];

                    if (field.type === 'input') {
                        if (
                            !scope.visualizationDimensions.fields.additional[
                                scope.visualizationDimensions.active.layout
                            ][0]
                        ) {
                            valid = false;
                            break;
                        }
                    } else if (field.selected.length === 0 && !field.optional) {
                        valid = false;
                        break;
                    } else if (
                        scope.visualizationDimensions.active.layout === 'Grid'
                    ) {
                        // check all dimensions to see if calculations added without group
                        for (
                            let selectedIdx = 0;
                            selectedIdx < field.selected.length;
                            selectedIdx++
                        ) {
                            const selected = field.selected[selectedIdx];
                            if (selected.math) {
                                // at least 1 calculation has been set
                                math = true;
                                if (selected.math === 'Group') {
                                    // at least 1 group dimension is set
                                    group = true;
                                }
                                if (selected.groupBy.length > 0) {
                                    oldGroupBy = selected.groupBy;
                                }
                            } else {
                                // boolean checking if all dimensions have calculations
                                allMath = false;
                            }
                        }
                        // if all fields have calculations and no groups throw warning and reset last groupBy dimension math to Group
                        if (math && !group && allMath) {
                            valid = false;
                            scope.widgetCtrl.alert(
                                'warn',
                                'At least 1 group dimension is required'
                            );
                            for (
                                let selectedIdx = 0;
                                selectedIdx < field.selected.length;
                                selectedIdx++
                            ) {
                                const oldGroupField =
                                    field.selected[selectedIdx];
                                if (oldGroupField.alias === oldGroupBy[0]) {
                                    oldGroupField.math = 'Group';
                                    scope.visualizationDimensions.fields.list[
                                        listIdx
                                    ].selected[selectedIdx] = oldGroupField;
                                }
                            }
                            break;
                        }
                    }
                }

                if (
                    scope.visualizationDimensions.facet.allInstances &&
                    scope.visualizationDimensions.facet.allInstanceCharts.indexOf(
                        scope.visualizationDimensions.active.layout
                    ) !== -1
                ) {
                    scope.visualizationDimensions.facet.selectedViewType =
                        'All Instances';
                } else {
                    scope.visualizationDimensions.facet.selectedViewType =
                        'Individual Instance';
                }
            }

            if (valid) {
                createVisualization();
            }
        }

        /**
         * @name addField
         * @desc moves the box that was double clicked into the top most empty visual option
         * @param {object} option -
         */
        function addField(option: any): void {
            // temporal...will remove after BE is able to do the smart way of grabbing graph data
            if (
                scope.visualizationDimensions.frame.type === 'GRAPH' &&
                scope.visualizationDimensions.fields.format === 'graph'
            ) {
                return;
            }

            for (
                let listIdx = 0,
                    listLen = scope.visualizationDimensions.fields.list.length;
                listIdx < listLen;
                listIdx++
            ) {
                const field =
                    scope.visualizationDimensions.fields.list[listIdx];

                // only add if it is multi or has nothing
                if (
                    (field.multiField || field.selected.length === 0) &&
                    field.type !== 'input'
                ) {
                    selectField(field, option, true);
                    break;
                }
            }
        }

        /**
         * @name addFields
         * @desc adds all the fields to the visualize
         */
        function addFields(): void {
            const oldAutoDraw = scope.visualizationDimensions.autoDraw;

            // clear off
            removeFields();

            // turn auto draw off to prevent unnecessary running of pixels for each column that's added
            setAutoDraw(false);
            for (
                let headerIdx = 0,
                    headerLen =
                        scope.visualizationDimensions.headers.raw.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                const header =
                    scope.visualizationDimensions.headers.raw[headerIdx];
                if (scope.visualizationDimensions.fields.list[0].multiField) {
                    selectField(
                        scope.visualizationDimensions.fields.list[0],
                        header,
                        true
                    );
                }
            }

            // set the autodraw back to what it was before
            setAutoDraw(oldAutoDraw);
        }

        /**
         * @name selectField
         * @param group - group the option belongs to
         * @param option - actual option
         * @param  auto - true if from quickselect, otherwise drag and drop library handles it
         * @desc selects a visual option and then trys to draw
         */
        function selectField(group: any, option: any, auto: boolean) {
            for (
                let listIdx = 0,
                    listLen = scope.visualizationDimensions.fields.list.length;
                listIdx < listLen;
                listIdx++
            ) {
                const field =
                    scope.visualizationDimensions.fields.list[listIdx];

                if (group.model === field.model) {
                    // check for uniqueness first
                    if (allUnique(field)) {
                        // if its multi add
                        if (!field.multiField) {
                            // if its not multi, set
                            field.selected = [option];
                        } else if (auto) {
                            field.selected.push(
                                semossCoreService.utility.freeze(option)
                            );
                        }
                    }
                }
            }

            if (scope.visualizationDimensions.autoDraw) {
                validateFields();
            }
        }

        /**
         * @name allUnique
         * @param {object} group the dimension being added to
         * @desc determines if an option should be added if there is no math grouping  or it is not already there
         * @return {boolean} if true, all are unique and it is safe to add
         */
        function allUnique(group: any) {
            const unique = {};

            if (
                group.group === 'math' ||
                scope.visualizationDimensions.fields.format === 'graph'
            ) {
                return true;
            }

            for (
                let selectedIdx = 0, selectedLen = group.selected.length;
                selectedIdx < selectedLen;
                selectedIdx++
            ) {
                if (unique[group.selected[selectedIdx].alias]) {
                    return false;
                }

                unique[group.selected[selectedIdx].alias] = true;
            }

            return true;
        }

        /**
         * @name updateFieldGroup
         * @desc function that changes the selecetd options grouping
         */
        function updateFieldGroup(): void {
            if (scope.visualizationDimensions.autoDraw) {
                validateFields();
            }
        }

        /**
         * @name removeField
         * @desc function that clears an individual visual option
         * @param {number} groupIdx -
         * @param {number} optionIdx -
         */
        function removeField(groupIdx: number, optionIdx: number): void {
            if (
                scope.visualizationDimensions.fields.list[groupIdx] &&
                scope.visualizationDimensions.fields.list[groupIdx].selected &&
                scope.visualizationDimensions.fields.list[groupIdx].selected[
                    optionIdx
                ]
            ) {
                scope.visualizationDimensions.fields.list[
                    groupIdx
                ].selected.splice(optionIdx, 1);

                if (scope.visualizationDimensions.autoDraw) {
                    validateFields();
                }
            }
        }

        /**
         * @name removeFields
         * @desc function that clears all the visual options
         */
        function removeFields(): void {
            for (
                let listIdx = 0,
                    listLen = scope.visualizationDimensions.fields.list.length;
                listIdx < listLen;
                listIdx++
            ) {
                const field =
                    scope.visualizationDimensions.fields.list[listIdx];

                for (
                    let selectedIdx = field.selected.length - 1;
                    selectedIdx >= 0;
                    selectedIdx--
                ) {
                    field.selected.splice(selectedIdx, 1);
                }
            }
            // disable reset math button for grid
            scope.visualizationDimensions.aggregationSelected = false;

            if (scope.visualizationDimensions.autoDraw) {
                validateFields();
            }
        }

        /**
         * @name generateTooltip
         * @desc generate tooltip
         * @param  option - option to generate the tooltip for
         * @returns string of the tooltip
         */
        function generateTooltip(option: any): string {
            let content = String(option.alias).replace(/_/g, ' ');
            if (option.type === 'STRING') {
                content += ' is a String';
            } else if (option.type === 'FACTOR') {
                content += ' is a Factor';
            } else if (option.type === 'NUMBER') {
                content += ' is a Number';
            } else if (option.type === 'DATE') {
                content += ' is a Date';
            } else if (option.type === 'TIMESTAMP') {
                content += ' is a Timestamp';
            } else {
                content += ' has an Other Type';
            }

            return content;
        }

        /*** Drag */
        /**
         * @name onDragStart
         * @param event - event object
         * @param idx - positiion in array where option was
         * @param option - the selected option
         * @desc called immediately when dragging begins. Need to give chart options the class to highlight the borders
         */
        function onDragStart(event: any, idx: number, option: any): void {
            scope.visualizationDimensions.drag.source = {
                ele:
                    event && event.target && event.target.parentElement
                        ? event.target.parentElement
                        : {},
                idx: idx,
                alias: option.alias,
            };

            scope.visualizationDimensions.drag.active = true;
        }

        /**
         * @name onDragMoved
         * @param list - the list which has had an element moved from it
         * @param option - the option moved
         * @desc after a move is complete, we remove the old item and determine if a visual needs to be created
         */
        function onDragMoved(list: any, option: any): void {
            if (scope.visualizationDimensions.drag.original) {
                scope.visualizationDimensions.drag.original = false;
                if (
                    list[scope.visualizationDimensions.drag.source.idx]
                        .alias ===
                    scope.visualizationDimensions.drag.source.alias
                ) {
                    list.splice(
                        scope.visualizationDimensions.drag.source.idx,
                        1
                    );
                } else {
                    // we have moved up and the index is wrong (weird thing in dnd lib)
                    list.splice(
                        scope.visualizationDimensions.drag.source.idx + 1,
                        1
                    );
                }
                if (
                    scope.visualizationDimensions.autoDraw &&
                    scope.visualizationDimensions.drag.source.ele.id !==
                        'visualization-dimensions__list--available'
                ) {
                    validateFields();
                }

                return;
            }

            // if undefined we dropped it into dimensions so dont do this
            if (scope.visualizationDimensions.drag.target) {
                // Call paint visualization with new option added
                selectField(
                    scope.visualizationDimensions.drag.target,
                    option,
                    false
                );
            }
        }

        /**
         * @name onDragDrop
         * @param {object} option - the option dropped
         * @param {event} event - event object
         * @param {object} group - the group dropped into, undefined if dimensions list
         * @desc called when option has been dropped into a list.
         * @returns {object} the option must be returned so dnd knows to add it to the list unless its dropped into dimensions
         */
        function onDragDrop(option: any, event: any, group: any): any {
            if (!group) {
                return false;
            }

            if (
                group.acceptableTypes.indexOf(option.type) === -1 &&
                !group.hasOwnProperty('group')
            ) {
                let error =
                    group.name + `${group.name} only supports groups that are `;
                for (
                    let typeIdx = 0, typeLen = group.acceptableTypes.length;
                    typeIdx < typeLen;
                    typeIdx++
                ) {
                    if (typeLen > 1) {
                        if (typeIdx === typeLen - 1) {
                            error += ' or ';
                        } else if (typeIdx > 0) {
                            error += ', ';
                        }
                    }

                    error += group.acceptableTypes[typeIdx];
                }

                scope.widgetCtrl.alert('error', error);

                return false;
            }

            if (group.type === 'input') {
                return false;
            }

            if (
                event.target.parentElement.isEqualNode(
                    scope.visualizationDimensions.drag.source.ele
                )
            ) {
                scope.visualizationDimensions.drag.original = true;
            }

            scope.visualizationDimensions.drag.target = group;

            return option;
        }

        /**
         * @name onDragEnd
         * @desc called once dragging ends
         */
        function onDragEnd(): void {
            scope.visualizationDimensions.drag.active = false;
        }

        /** Auto **/
        /**
         * @name setAutoDraw
         * @param {boolean} autoDraw - set it on or off
         * @desc sets auto draw and triggers it
         */
        function setAutoDraw(autoDraw: boolean): void {
            scope.visualizationDimensions.autoDraw = autoDraw;

            updateAutoDraw();
        }

        /**
         * @name updateAutoDraw
         * @desc auto draws the visualization (if active)
         */
        function updateAutoDraw(): void {
            if (scope.visualizationDimensions.autoDraw) {
                validateFields();
            }
        }

        /** Visualization ***/
        /**
         * @name createVisualization
         * @desc function that creates the visualization based on the passed in values
         */
        function createVisualization(): void {
            let groupBy: string[] = [],
                gridAggregationSelected = false,
                otherMathSelected = false,
                components: PixelCommand[] = [];

            const active = scope.widgetCtrl.getWidget('active');
            const type = scope.widgetCtrl.getWidget(
                'view.visualization.options.type'
            );

            // check if the type is the same
            if (
                active !== 'visualization' ||
                scope.visualizationDimensions.type !== type
            ) {
                components = components.concat([
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'setPanelView',
                        components: [
                            'visualization',
                            {
                                type: scope.visualizationDimensions.type,
                            },
                        ],
                        terminal: true,
                    },
                ]);
            }

            scope.visualizationDimensions.facet.active = false;
            for (
                let listIdx = 0,
                    listLen = scope.visualizationDimensions.fields.list.length;
                listIdx < listLen;
                listIdx++
            ) {
                const field =
                    scope.visualizationDimensions.fields.list[listIdx];

                // for grid only need to loop through selected dimensions to see if a groupBy needs to be added
                if (scope.visualizationDimensions.active.layout === 'Grid') {
                    for (
                        let selectedIdx = 0,
                            selectedLen = field.selected.length;
                        selectedIdx < selectedLen;
                        selectedIdx++
                    ) {
                        const selected = field.selected[selectedIdx];
                        if (selected.math) {
                            gridAggregationSelected = true;
                            if (selected.math === 'Group') {
                                // if changing field from another aggregation to group we need to group by the original column
                                let alias: string;
                                if (selected.calculatedBy) {
                                    alias = selected.calculatedBy;
                                } else {
                                    alias = selected.alias;
                                }

                                if (groupBy.indexOf(alias) === -1) {
                                    groupBy.push(alias);
                                }
                            } else {
                                // at least 1 other aggregation besides 'Group' has been set
                                otherMathSelected = true;
                            }
                        }
                    }
                    // if no group but at least 1 other aggregation loop through selected fields and groupBy
                    if (groupBy.length === 0 && otherMathSelected) {
                        for (
                            let selectedIdx = 0,
                                selectedLen = field.selected.length;
                            selectedIdx < selectedLen;
                            selectedIdx++
                        ) {
                            const selected = field.selected[selectedIdx];
                            if (!selected.math) {
                                selected.math = 'Group';
                                if (groupBy.indexOf(selected.alias) === -1) {
                                    groupBy.push(selected.alias);
                                }
                                // store new math on scope
                                scope.visualizationDimensions.fields.list[
                                    listIdx
                                ].selected[selectedIdx] = selected;
                            }
                        }
                    }
                }

                if (field.group === 'validate' || field.model === 'series') {
                    for (
                        let selectedIdx = 0,
                            selectedLen = field.selected.length;
                        selectedIdx < selectedLen;
                        selectedIdx++
                    ) {
                        const selected = field.selected[selectedIdx];

                        let alias: string;
                        if (selected.calculatedBy) {
                            alias = selected.calculatedBy;
                        } else {
                            alias = selected.alias;
                        }

                        if (groupBy.indexOf(alias) === -1) {
                            groupBy.push(alias);
                        }
                    }
                }

                if (
                    field.model === 'facet' &&
                    scope.visualizationDimensions.active.layout !==
                        'SingleAxisCluster'
                ) {
                    if (field.selected.length > 0) {
                        scope.visualizationDimensions.facet.active = true;
                        scope.visualizationDimensions.facet.selectedDimension =
                            field.selected[0].alias;
                    } else {
                        scope.visualizationDimensions.facet.active = false;
                    }
                }
            }

            if (scope.visualizationDimensions.fields.format === 'graph') {
                components = components.concat(buildGraphPixelComponents());
            } else if (groupBy.length === 0) {
                // nothing to group on, so skip the extra step to check if there are duplicates

                // validate that the types match
                // copy the keys
                const generated = JSON.parse(
                    JSON.stringify(scope.visualizationDimensions.fields.list)
                );

                // generate the proper keys (we loop through the uncopied list b/c it shouldn't change)
                for (
                    let listIdx = 0,
                        listLen =
                            scope.visualizationDimensions.fields.list.length;
                    listIdx < listLen;
                    listIdx++
                ) {
                    const field =
                        scope.visualizationDimensions.fields.list[listIdx];

                    // if the group is optional, clear it out
                    if (field.groupOptional) {
                        for (
                            let selectedIdx = 0,
                                selectedLen = field.selected.length;
                            selectedIdx < selectedLen;
                            selectedIdx++
                        ) {
                            const option =
                                generated[listIdx].selected[selectedIdx];

                            // clear it out
                            if (option.math) {
                                option.math = '';
                                option.groupBy = [];
                                option.alias = option.calculatedBy;
                            }
                        }
                    } else if (
                        field.group === 'math' ||
                        field.group === 'concat'
                    ) {
                        // if the group is math or concat, we will do math
                        // for each one in the group, check if the type matches
                        for (
                            let selectedIdx = 0,
                                selectedLen = field.selected.length;
                            selectedIdx < selectedLen;
                            selectedIdx++
                        ) {
                            const option =
                                generated[listIdx].selected[selectedIdx];

                            // it has to be a calculated column, so updated that
                            if (option.math) {
                                option.alias = option.calculatedBy;
                                option.groupBy = [];
                                option.alias =
                                    (OPTIONSALIAS.hasOwnProperty(option.math)
                                        ? OPTIONSALIAS[option.math]
                                        : option.math) +
                                    '_of_' +
                                    option.alias;
                            } else {
                                option.calculatedBy = option.alias;
                                option.math =
                                    OPTIONS[field.group][option.type][0];
                                option.groupBy = [];
                                option.alias =
                                    (OPTIONSALIAS.hasOwnProperty(option.math)
                                        ? OPTIONSALIAS[option.math]
                                        : option.math) +
                                    '_of_' +
                                    option.alias;
                            }

                            // set it back
                            generated[listIdx].selected[selectedIdx] = option;
                        }
                    }
                }

                components = components.concat(
                    buildGridPixelComponents(generated)
                );
            } else {
                // copy the keys
                const generatedNonDuplicated = JSON.parse(
                        JSON.stringify(
                            scope.visualizationDimensions.fields.list
                        )
                    ),
                    generatedDuplicated = JSON.parse(
                        JSON.stringify(
                            scope.visualizationDimensions.fields.list
                        )
                    );

                // generate the proper keys (we loop through the uncopied list b/c it shouldn't change)
                for (
                    let listIdx = 0,
                        listLen =
                            scope.visualizationDimensions.fields.list.length;
                    listIdx < listLen;
                    listIdx++
                ) {
                    const field =
                        scope.visualizationDimensions.fields.list[listIdx];

                    if (field.group === 'math' || field.group === 'concat') {
                        for (
                            let selectedIdx = 0,
                                selectedLen = field.selected.length;
                            selectedIdx < selectedLen;
                            selectedIdx++
                        ) {
                            let optionNonDuplicated =
                                    generatedNonDuplicated[listIdx].selected[
                                        selectedIdx
                                    ],
                                optionDuplicated =
                                    generatedDuplicated[listIdx].selected[
                                        selectedIdx
                                    ];

                            // for grid only grouped fields need to reset column properties to raw header info
                            if (
                                optionNonDuplicated.math &&
                                optionNonDuplicated.math === 'Group'
                            ) {
                                let alias: string, originalHeaderInfo: any;
                                if (optionNonDuplicated.calculatedBy) {
                                    alias = optionNonDuplicated.calculatedBy;
                                } else {
                                    alias = optionNonDuplicated.alias;
                                }

                                // reset column properties to original raw header values for newly grouped dimensions
                                originalHeaderInfo =
                                    getCalculatedByHeaderInfo(alias);
                                optionNonDuplicated = JSON.parse(
                                    JSON.stringify(originalHeaderInfo)
                                );
                                optionDuplicated = JSON.parse(
                                    JSON.stringify(originalHeaderInfo)
                                );
                            } else {
                                // non duplicated
                                // reset math
                                if (optionNonDuplicated.math) {
                                    for (
                                        let k = 0,
                                            len3 =
                                                scope.visualizationDimensions
                                                    .headers.raw.length;
                                        k < len3;
                                        k++
                                    ) {
                                        if (
                                            scope.visualizationDimensions
                                                .headers.raw[k].alias ===
                                            optionNonDuplicated.calculatedBy
                                        ) {
                                            optionNonDuplicated = JSON.parse(
                                                JSON.stringify(
                                                    scope
                                                        .visualizationDimensions
                                                        .headers.raw[k]
                                                )
                                            );
                                            break;
                                        }
                                    }
                                }

                                // I wrap and check OPTIONSALIAS, since I am unsure if everything follows standard 'math'....
                                if (
                                    field.acceptableTypes.indexOf(
                                        optionNonDuplicated.type
                                    ) === -1 &&
                                    (optionNonDuplicated.type === 'STRING' ||
                                        optionNonDuplicated.type === 'FACTOR' ||
                                        optionNonDuplicated.type === 'DATE' ||
                                        optionNonDuplicated.type ===
                                            'TIMESTAMP')
                                ) {
                                    optionNonDuplicated.calculatedBy =
                                        optionNonDuplicated.alias; // added in because it was not creating Title vs Genre, correctly
                                    optionNonDuplicated.math =
                                        OPTIONS[field.group][
                                            optionNonDuplicated.type
                                        ][0];
                                    optionNonDuplicated.groupBy = groupBy;
                                    optionNonDuplicated.alias =
                                        (OPTIONSALIAS.hasOwnProperty(
                                            optionNonDuplicated.math
                                        )
                                            ? OPTIONSALIAS[
                                                  optionNonDuplicated.math
                                              ]
                                            : optionNonDuplicated.math) +
                                        '_of_' +
                                        optionNonDuplicated.alias;
                                }

                                // duplicated
                                if (optionDuplicated.math) {
                                    // for grid dimensions could have math without having calculatedBy set yet
                                    if (optionDuplicated.calculatedBy) {
                                        optionDuplicated.alias =
                                            optionDuplicated.calculatedBy;
                                    } else {
                                        optionDuplicated.calculatedBy =
                                            optionDuplicated.alias;
                                    }
                                    optionDuplicated.groupBy = groupBy;
                                    optionDuplicated.alias =
                                        (OPTIONSALIAS.hasOwnProperty(
                                            optionDuplicated.math
                                        )
                                            ? OPTIONSALIAS[
                                                  optionDuplicated.math
                                              ]
                                            : optionDuplicated.math) +
                                        '_of_' +
                                        optionDuplicated.alias;
                                } else {
                                    optionDuplicated.calculatedBy =
                                        optionDuplicated.alias;
                                    optionDuplicated.math =
                                        OPTIONS[field.group][
                                            optionDuplicated.type
                                        ][0];
                                    optionDuplicated.groupBy = groupBy;
                                    optionDuplicated.alias =
                                        (OPTIONSALIAS.hasOwnProperty(
                                            optionDuplicated.math
                                        )
                                            ? OPTIONSALIAS[
                                                  optionDuplicated.math
                                              ]
                                            : optionDuplicated.math) +
                                        '_of_' +
                                        optionDuplicated.alias;
                                }
                            }

                            // set it back
                            generatedNonDuplicated[listIdx].selected[
                                selectedIdx
                            ] = optionNonDuplicated;
                            generatedDuplicated[listIdx].selected[selectedIdx] =
                                optionDuplicated;
                        }
                    }
                }
                // do not add check for duplicates to pixel call if grid and at least 1 aggregation selected
                if (gridAggregationSelected) {
                    const gridComponents =
                        buildGridPixelComponents(generatedDuplicated);
                    components = components.concat(gridComponents);
                } else {
                    // convert
                    components = components.concat([
                        {
                            type: 'if',
                            components: [
                                [
                                    {
                                        type: 'variable',
                                        components: [
                                            scope.visualizationDimensions.frame
                                                .name,
                                        ],
                                    },
                                    {
                                        type: 'hasDuplicates',
                                        components: [groupBy],
                                        terminal: true,
                                    },
                                ],
                                buildGridPixelComponents(generatedDuplicated),
                                buildGridPixelComponents(
                                    generatedNonDuplicated
                                ),
                            ],
                            terminal: true,
                        },
                    ]);
                }
            }

            if (components.length > 0) {
                if (scope.visualizationDimensions.facet.active) {
                    const labelDimension: string[] = [];
                    // TODO add value selected dimesnions to labelDimension

                    for (
                        let listIdx = 0,
                            listLen =
                                scope.visualizationDimensions.fields.list
                                    .length;
                        listIdx < listLen;
                        listIdx++
                    ) {
                        const field =
                            scope.visualizationDimensions.fields.list[listIdx];

                        if (
                            field.model === 'label' ||
                            field.model === 'dimension' ||
                            field.model === 'series'
                        ) {
                            for (
                                let selectedIdx = 0,
                                    selectedLen = field.selected.length;
                                selectedIdx < selectedLen;
                                selectedIdx++
                            ) {
                                const selected = field.selected[selectedIdx];

                                labelDimension.push(selected.alias);
                            }
                        } else if (field.model === 'value') {
                            for (
                                let selectedIdx = 0,
                                    selectedLen = field.selected.length;
                                selectedIdx < selectedLen;
                                selectedIdx++
                            ) {
                                const selected = field.selected[selectedIdx];

                                if (selected.calculatedBy) {
                                    labelDimension.push(selected.calculatedBy);
                                } else {
                                    labelDimension.push(selected.alias);
                                }
                            }
                        }
                    }
                    if (
                        labelDimension.indexOf(
                            scope.visualizationDimensions.facet
                                .selectedDimension
                        ) !== -1
                    ) {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Facet dimension cannot be the same as label dimension'
                        );
                    } else {
                        executeFacet(
                            scope.visualizationDimensions.facet
                                .selectedDimension,
                            components
                        );
                    }
                } else {
                    scope.widgetCtrl.execute(components);
                }
            }
        }

        /**
         * @name resetGridCalculations
         * @desc resets all selected grid dimensions to default with no aggregations
         */
        function resetGridCalculations(): void {
            const generated = JSON.parse(
                JSON.stringify(scope.visualizationDimensions.fields.list)
            );
            let components: PixelCommand[] = [];

            for (
                let listIdx = 0,
                    listLen = scope.visualizationDimensions.fields.list.length;
                listIdx < listLen;
                listIdx++
            ) {
                const field =
                    scope.visualizationDimensions.fields.list[listIdx];
                for (
                    let selectedIdx = 0, selectedLen = field.selected.length;
                    selectedIdx < selectedLen;
                    selectedIdx++
                ) {
                    const option = generated[listIdx].selected[selectedIdx];

                    let alias: string, originalHeaderInfo: any;
                    if (option.calculatedBy) {
                        alias = option.calculatedBy;
                    } else {
                        alias = option.alias;
                    }

                    // reset column properties to original raw header values
                    originalHeaderInfo = getCalculatedByHeaderInfo(alias);
                    // set it back
                    generated[listIdx].selected[selectedIdx] =
                        originalHeaderInfo;
                }
            }
            components = components.concat(buildGridPixelComponents(generated));
            scope.widgetCtrl.execute(components);
        }

        /**
         * @name executeFacet
         * @desc executes the groub by for the facet and run it
         * @param {string} selectedDim - selected dimension to group by
         * @param components - pixel components
         */
        function executeFacet(selectedDim, components: PixelCommand[]): void {
            let finalPixel = '',
                facetVariable = 'facet_' + scope.widgetCtrl.panelId;
            const callback = function (output) {
                let selectedDimInstances =
                        output.pixelReturn[0].output.data.values,
                    filterPixel,
                    filterComponent = {},
                    groupComponents: any[] = [],
                    sankeyGroupDims: any[] = [],
                    idx,
                    i,
                    n,
                    k;

                scope.visualizationDimensions.facet.uniqueInstances = [];
                for (i = 0; i < selectedDimInstances.length; i++) {
                    scope.visualizationDimensions.facet.uniqueInstances.push(
                        selectedDimInstances[i][0]
                    );
                }

                if (
                    scope.visualizationDimensions.facet.selectedViewType ===
                        'All Instances' &&
                    scope.visualizationDimensions.facet.uniqueInstances.length >
                        50
                ) {
                    scope.widgetCtrl.alert(
                        'warn',
                        scope.visualizationDimensions.facet.selectedDimension +
                            ' has over 50 unique instances. Can only view facet by individual instance.'
                    );
                    scope.visualizationDimensions.facet.selectedViewType =
                        'Individual Instance';
                    scope.visualizationDimensions.facet.allInstances = false;
                    scope.visualizationDimensions.facet.active = false;
                }

                if (
                    scope.visualizationDimensions.facet.selectedViewType ===
                    'Individual Instance'
                ) {
                    if (
                        scope.visualizationDimensions.active.layout === 'Graph'
                    ) {
                        for (i = 0; i < components.length; i++) {
                            // Remove Facet Dimension from select component
                            if (components[i].type === 'select2') {
                                for (idx in components[i].components[0]) {
                                    if (
                                        components[i].components[0][idx]
                                            .alias === selectedDim
                                    ) {
                                        groupComponents.push(
                                            components[i].components[0][idx]
                                                .alias
                                        );
                                        components[i].components[0].splice(
                                            idx,
                                            1
                                        );
                                        break;
                                    } else {
                                        groupComponents.push(
                                            components[i].components[0][idx]
                                                .alias
                                        );
                                    }
                                }
                                scope.visualizationDimensions.facet.selectComponent =
                                    components[i].components[0];
                            }
                            // Add All Dimensions to group component
                            if (components[i].type === 'group') {
                                // add all dimension (start, end, facet)
                                components[i].components[0] = groupComponents;
                                scope.visualizationDimensions.facet.groupComponent =
                                    components[i].components[0];
                            }
                            // Add to task options
                            if (components[i].type === 'taskOptions') {
                                components[i].components[0][
                                    scope.widgetCtrl.panelId
                                ].groupByInfo = {
                                    selectedDim:
                                        scope.visualizationDimensions.facet
                                            .selectedDimension,
                                    viewType:
                                        scope.visualizationDimensions.facet
                                            .selectedViewType,
                                    instanceIndex: '0',
                                    uniqueInstances: '{' + facetVariable + '}',
                                };
                            }
                        }
                        // Add filer component
                        filterComponent[
                            scope.visualizationDimensions.facet.selectedDimension
                        ] = {
                            comparator: '==',
                            value: scope.visualizationDimensions.facet
                                .uniqueInstances[0],
                        };
                        filterPixel = {
                            type: 'filter',
                            components: [filterComponent],
                        };
                        components.splice(2, 0, filterPixel);
                    } else if (
                        scope.visualizationDimensions.active.layout ===
                            'Sankey' ||
                        scope.visualizationDimensions.active.layout ===
                            'ParallelCoordinates'
                    ) {
                        for (i = 1; i < components[0].components.length; i++) {
                            for (
                                n = 0;
                                n < components[0].components[i].length;
                                n++
                            ) {
                                // Copy select component for group by
                                if (
                                    components[0].components[i][n].type ===
                                    'select2'
                                ) {
                                    sankeyGroupDims = [];
                                    scope.visualizationDimensions.facet.selectComponent =
                                        components[0].components[i][
                                            n
                                        ].components[0];
                                    for (
                                        k = 0;
                                        k <
                                        scope.visualizationDimensions.facet
                                            .selectComponent.length;
                                        k++
                                    ) {
                                        if (
                                            scope.visualizationDimensions.facet
                                                .selectComponent[k].calculatedBy
                                        ) {
                                            sankeyGroupDims.push(
                                                scope.visualizationDimensions
                                                    .facet.selectComponent[k]
                                                    .calculatedBy
                                            );
                                        } else {
                                            sankeyGroupDims.push(
                                                scope.visualizationDimensions
                                                    .facet.selectComponent[k]
                                                    .alias
                                            );
                                        }
                                    }
                                }
                                // Copy group component for group by
                                if (
                                    components[0].components[i][n].type ===
                                    'group'
                                ) {
                                    components[0].components[i][
                                        n
                                    ].components[0] = sankeyGroupDims;
                                    scope.visualizationDimensions.facet.groupComponent =
                                        components[0].components[i][
                                            n
                                        ].components[0];
                                }
                                // Add to task options
                                if (
                                    components[0].components[i][n].type ===
                                    'taskOptions'
                                ) {
                                    components[0].components[i][
                                        n
                                    ].components[0][
                                        scope.widgetCtrl.panelId
                                    ].groupByInfo = {
                                        selectedDim:
                                            scope.visualizationDimensions.facet
                                                .selectedDimension,
                                        viewType:
                                            scope.visualizationDimensions.facet
                                                .selectedViewType,
                                        instanceIndex: '0',
                                        uniqueInstances:
                                            '{' + facetVariable + '}',
                                    };
                                }
                            }

                            // Add filer component
                            filterComponent[
                                scope.visualizationDimensions.facet.selectedDimension
                            ] = {
                                comparator: '==',
                                value: scope.visualizationDimensions.facet
                                    .uniqueInstances[0],
                            };
                            filterPixel = {
                                type: 'filter',
                                components: [filterComponent],
                            };
                            components[0].components[i].splice(
                                2,
                                0,
                                filterPixel
                            );
                        }
                    } else {
                        for (i = 1; i < components[0].components.length; i++) {
                            for (
                                n = 0;
                                n < components[0].components[i].length;
                                n++
                            ) {
                                // Copy select component for group by
                                if (
                                    components[0].components[i][n].type ===
                                    'select2'
                                ) {
                                    scope.visualizationDimensions.facet.selectComponent =
                                        components[0].components[i][
                                            n
                                        ].components[0];
                                }
                                // Copy group component for group by
                                if (
                                    components[0].components[i][n].type ===
                                    'group'
                                ) {
                                    scope.visualizationDimensions.facet.groupComponent =
                                        components[0].components[i][
                                            n
                                        ].components[0];
                                }
                                // Add to task options
                                if (
                                    components[0].components[i][n].type ===
                                    'taskOptions'
                                ) {
                                    components[0].components[i][
                                        n
                                    ].components[0][
                                        scope.widgetCtrl.panelId
                                    ].groupByInfo = {
                                        selectedDim:
                                            scope.visualizationDimensions.facet
                                                .selectedDimension,
                                        viewType:
                                            scope.visualizationDimensions.facet
                                                .selectedViewType,
                                        instanceIndex: '0',
                                        uniqueInstances:
                                            '{' + facetVariable + '}',
                                    };
                                }
                            }

                            // Add filer component
                            filterComponent[
                                scope.visualizationDimensions.facet.selectedDimension
                            ] = {
                                comparator: '==',
                                value: scope.visualizationDimensions.facet
                                    .uniqueInstances[0],
                            };
                            filterPixel = {
                                type: 'filter',
                                components: [filterComponent],
                            };
                            components[0].components[i].splice(
                                2,
                                0,
                                filterPixel
                            );
                        }
                    }
                } else if (
                    scope.visualizationDimensions.facet.selectedViewType ===
                        'All Instances' &&
                    scope.visualizationDimensions.facet.uniqueInstances.length <
                        50
                ) {
                    if (
                        scope.visualizationDimensions.active.layout ===
                            'Column' ||
                        scope.visualizationDimensions.active.layout ===
                            'Line' ||
                        scope.visualizationDimensions.active.layout ===
                            'Area' ||
                        scope.visualizationDimensions.active.layout === 'Pie' ||
                        scope.visualizationDimensions.active.layout ===
                            'Funnel' ||
                        scope.visualizationDimensions.active.layout ===
                            'Scatter' ||
                        scope.visualizationDimensions.active.layout === 'Map'
                    ) {
                        for (i = 1; i < components[0].components.length; i++) {
                            for (
                                n = 0;
                                n < components[0].components[i].length;
                                n++
                            ) {
                                // Copy select component for group by
                                if (
                                    components[0].components[i][n].type ===
                                    'select2'
                                ) {
                                    scope.visualizationDimensions.facet.selectComponent =
                                        components[0].components[i][
                                            n
                                        ].components[0];
                                }
                                // Copy group component for group by
                                if (
                                    components[0].components[i][n].type ===
                                    'group'
                                ) {
                                    scope.visualizationDimensions.facet.groupComponent =
                                        components[0].components[i][
                                            n
                                        ].components[0];
                                }
                                // Add to task options
                                if (
                                    components[0].components[i][n].type ===
                                    'taskOptions'
                                ) {
                                    components[0].components[i][
                                        n
                                    ].components[0][
                                        scope.widgetCtrl.panelId
                                    ].groupByInfo = {
                                        selectedDim:
                                            scope.visualizationDimensions.facet
                                                .selectedDimension,
                                        viewType:
                                            scope.visualizationDimensions.facet
                                                .selectedViewType,
                                        instanceIndex: '0',
                                        uniqueInstances:
                                            '{' + facetVariable + '}',
                                    };
                                }
                            }
                        }
                    }
                } else if (
                    scope.visualizationDimensions.facet.selectedViewType ===
                        'Series' &&
                    scope.visualizationDimensions.active.layout === 'Line'
                ) {
                    for (i = 1; i < components[0].components.length; i++) {
                        for (
                            n = 0;
                            n < components[0].components[i].length;
                            n++
                        ) {
                            // Copy select component for group by
                            if (
                                components[0].components[i][n].type ===
                                'select2'
                            ) {
                                scope.visualizationDimensions.facet.selectComponent =
                                    components[0].components[i][
                                        n
                                    ].components[0];
                            }
                            // Copy group component for group by
                            if (
                                components[0].components[i][n].type === 'group'
                            ) {
                                scope.visualizationDimensions.facet.groupComponent =
                                    components[0].components[i][
                                        n
                                    ].components[0];
                            }
                            // Add to task options
                            if (
                                components[0].components[i][n].type ===
                                'taskOptions'
                            ) {
                                components[0].components[i][n].components[0][
                                    scope.widgetCtrl.panelId
                                ].groupByInfo = {
                                    selectedDim:
                                        scope.visualizationDimensions.facet
                                            .selectedDimension,
                                    viewType:
                                        scope.visualizationDimensions.facet
                                            .selectedViewType,
                                    instanceIndex: '0',
                                    uniqueInstances: '{' + facetVariable + '}',
                                };
                            }
                        }
                    }
                }

                // Do not remove facet variable
                scope.widgetCtrl.execute(components);
            };

            // set facet instances to a variable
            finalPixel += facetVariable + ' = ';
            finalPixel +=
                'Frame(' +
                scope.visualizationDimensions.frame.name +
                ') | Select (' +
                selectedDim +
                ') | Sort(columns=["' +
                selectedDim +
                '"], sort=["asc"]) | Collect(-1);';
            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [finalPixel],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name buildGridPixelComponents
         * @desc function that builds and creates a grid Pixel
         * @param  fields - list of the visualOptions to generate the query for
         * @returns pixel components
         */
        function buildGridPixelComponents(fields: any[]): PixelCommand[] {
            const layer = scope.viewCtrl.getLayer(); // get the most recent

            // create components
            const taskOptionsComponent = {};
            taskOptionsComponent[scope.widgetCtrl.panelId] = {
                layout: scope.visualizationDimensions.active.layout,
                alignment: {},
            };

            if (!layer.new) {
                taskOptionsComponent[scope.widgetCtrl.panelId].layer = {
                    id: layer.id,
                    name: layer.name,
                    addYAxis: layer.addXAxis,
                    addXAxis: layer.addYAxis,
                    z: layer.z,
                    base: layer.base,
                };
            } else {
                taskOptionsComponent[scope.widgetCtrl.panelId].layer = {
                    id: layer.id,
                    name: layer.name,
                    addYAxis: false,
                    addXAxis: false,
                };
            }

            let selectComponent: any[] = [],
                groupComponent: any[] = [],
                rows: any[] = [],
                columns: any[] = [],
                calculations: any[] = [],
                sections: any[] = [],
                optional: any[] = [];

            // add in alignment
            for (
                let listIdx = 0, listLen = fields.length;
                listIdx < listLen;
                listIdx++
            ) {
                const field = fields[listIdx];

                // add in the model
                if (
                    !taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        field.model
                    ]
                ) {
                    taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        field.model
                    ] = [];
                }

                // add in each option
                for (
                    let selectedIdx = 0, selectedLen = field.selected.length;
                    selectedIdx < selectedLen;
                    selectedIdx++
                ) {
                    const selected = field.selected[selectedIdx];

                    // add in math
                    if (selected.math) {
                        // add in the group component
                        if (groupComponent.length === 0) {
                            groupComponent = selected.groupBy;
                        }
                    }

                    // add in the select component
                    let selectIndex = -1;
                    for (
                        let selectComponentIdx = selectComponent.length - 1;
                        selectComponentIdx >= 0;
                        selectComponentIdx--
                    ) {
                        if (
                            selectComponent[selectComponentIdx].alias ===
                            selected.alias
                        ) {
                            selectIndex = selectComponentIdx;
                            break;
                        }
                    }

                    if (selectIndex === -1) {
                        selectComponent.push(
                            semossCoreService.utility.freeze(selected)
                        );
                    }

                    // add to the view component
                    taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        field.model
                    ].push(selected.alias);

                    // collect pivot specific
                    if (
                        scope.visualizationDimensions.fields.format === 'pivot'
                    ) {
                        if (field.model === 'rows') {
                            rows.push(selected.alias);
                        } else if (field.model === 'columns') {
                            columns.push(selected.alias);
                        } else if (field.model === 'calculations') {
                            // eslint-disable-next-line no-loop-func

                            let selectIndex = -1;
                            for (
                                let selectComponentIdx =
                                    selectComponent.length - 1;
                                selectComponentIdx >= 0;
                                selectComponentIdx--
                            ) {
                                if (
                                    selectComponent[selectComponentIdx]
                                        .alias === selected.alias ||
                                    selectComponent[selectComponentIdx]
                                        .calculatedBy === selected.alias
                                ) {
                                    selectIndex = selectComponentIdx;
                                    break;
                                }
                            }
                            //  calculations.push(
                            //     selected.math + '(' + selected.calculatedBy + ')'
                            // );

                            if (selected.math) {
                                calculations.push(
                                    selected.math +
                                        '(' +
                                        (selected.calculatedBy ||
                                            selected.alias) +
                                        ')'
                                );
                            } else {
                                calculations.push(
                                    selected.calculatedBy || selected.alias
                                );
                            }
                            groupComponent = [];
                            if (selectIndex !== -1) {
                                selectComponent[selectIndex].alias =
                                    selected.calculatedBy || selected.alias;
                                selectComponent[selectIndex].math = false;
                                selectComponent[selectIndex].groupBy = [];
                                taskOptionsComponent[
                                    scope.widgetCtrl.panelId
                                ].alignment.calculations[
                                    taskOptionsComponent[
                                        scope.widgetCtrl.panelId
                                    ].alignment.calculations.length - 1
                                ] = selected.calculatedBy || selected.alias;
                            }
                        } else if (field.model === 'sections') {
                            sections.push(selected.alias);
                        } else if (field.model === 'optional') {
                            optional.push(selected.alias);
                        }
                    }
                }
            }

            // add in joins for tinker and native
            const joins = scope.visualizationDimensions.frame.joins || [];
            const joinComponent: any[] = [];
            for (
                let joinIdx = 0, joinLen = joins.length;
                joinIdx < joinLen;
                joinIdx++
            ) {
                joinComponent.push({
                    toColumn: joins[joinIdx].toNode,
                    fromColumn: joins[joinIdx].fromNode,
                    joinType: joins[joinIdx].joinType,
                });
            }

            let collectComponent: any;
            if (scope.visualizationDimensions.fields.format === 'pivot') {
                collectComponent = {
                    type: 'collectPivot',
                    components: [rows, columns, calculations, sections],
                    terminal: true,
                };
            } else if (
                scope.visualizationDimensions.fields.format === 'ggplot'
            ) {
                collectComponent = {
                    type: 'collectGGPlot',
                    components: [
                        scope.visualizationDimensions.fields.additional
                            .GGPlot[0],
                    ],
                    terminal: true,
                };
            } else if (
                scope.visualizationDimensions.fields.format === 'seaborn'
            ) {
                collectComponent = {
                    type: 'collectSeaborn',
                    components: [
                        scope.visualizationDimensions.fields.additional
                            .Seaborn[0],
                    ],
                    terminal: true,
                };
            } else {
                collectComponent = {
                    type: 'collect',
                    components: [scope.widgetCtrl.getOptions('limit')],
                    terminal: true,
                };
            }

            const isRowSpan = scope.widgetCtrl.getWidget(
                'view.visualization.tools.shared.gridSpanRows'
            );
            const sortInfo: any = [];
            // if row span is active and the layout is grid, we will sort all columns
            if (
                scope.visualizationDimensions.active.layout === 'Grid' &&
                isRowSpan
            ) {
                let selectIdx: number;

                for (
                    selectIdx = 0;
                    selectIdx < selectComponent.length;
                    selectIdx++
                ) {
                    sortInfo.push({
                        alias: selectComponent[selectIdx].alias,
                        dir: 'ASC',
                    });
                }
            }

            let pixelComponents = [
                {
                    type: 'frame',
                    components: [scope.visualizationDimensions.frame.name],
                },
                {
                    type: 'select2',
                    components: [selectComponent],
                },
                {
                    type: 'group',
                    components: [groupComponent],
                },
                {
                    type: 'join',
                    components: [joinComponent],
                },
            ];

            // if there are sorts we will add it
            if (sortInfo.length > 0) {
                pixelComponents.push({
                    type: 'sortOptions',
                    components: [sortInfo],
                });
            }

            pixelComponents = pixelComponents.concat([
                {
                    type: 'with',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'format',
                    components: ['table'],
                },
                {
                    type: 'taskOptions',
                    components: [taskOptionsComponent],
                },
                collectComponent,
            ]);

            return pixelComponents;
        }

        /**
         * @name buildGraphPixelComponents
         * @desc function that builds and creates a graph Pixel
         * @returns pixel components
         */
        function buildGraphPixelComponents(): PixelCommand[] {
            // create components
            let taskOptionsComponent = {};
            taskOptionsComponent[scope.widgetCtrl.panelId] = {
                layout: scope.visualizationDimensions.active.layout,
                alignment: {},
            };

            // add in joins for tinker and native
            const joins = scope.visualizationDimensions.frame.joins || [];
            const joinComponent: any[] = [];
            for (
                let joinIdx = 0, joinLen = joins.length;
                joinIdx < joinLen;
                joinIdx++
            ) {
                joinComponent.push({
                    toColumn: joins[joinIdx].toNode,
                    fromColumn: joins[joinIdx].fromNode,
                    joinType: joins[joinIdx].joinType,
                });
            }

            // add in alignment
            let connections = '';

            const startOptions =
                    scope.visualizationDimensions.fields.list[0].selected,
                targetOptions =
                    scope.visualizationDimensions.fields.list[1].selected;
            for (
                let optionIdx = 0, optionLen = startOptions.length;
                optionIdx < optionLen;
                optionIdx++
            ) {
                if (
                    startOptions[optionIdx] &&
                    targetOptions[optionIdx] &&
                    startOptions[optionIdx].alias &&
                    targetOptions[optionIdx].alias
                ) {
                    connections +=
                        startOptions[optionIdx].alias +
                        '.' +
                        targetOptions[optionIdx].alias +
                        ';';
                }
            }

            // add in alignment
            let added: any[] = [],
                selectComponent: any[] = [],
                groupComponent: any[] = [];

            for (
                let listIdx = 0,
                    listLen = scope.visualizationDimensions.fields.list.length;
                listIdx < listLen;
                listIdx++
            ) {
                const field =
                    scope.visualizationDimensions.fields.list[listIdx];

                // add in the model
                if (
                    !taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        field.model
                    ]
                ) {
                    taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        field.model
                    ] = [];
                }

                // add in each option
                for (
                    let selectedIdx = 0, selectedLen = field.selected.length;
                    selectedIdx < selectedLen;
                    selectedIdx++
                ) {
                    const selected = field.selected[selectedIdx];

                    // add in math
                    if (selected.math) {
                        // add in the group component
                        if (groupComponent.length === 0) {
                            groupComponent = selected.groupBy;
                        }
                    }

                    // add in the select component
                    // only add if not there

                    if (added.indexOf(selected.alias) === -1) {
                        added.push(selected.alias);
                        selectComponent.push(selected);
                    }

                    // add to the view component
                    taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        field.model
                    ].push(selected.alias);
                }
            }

            // if select component is empty, its not a valid task. so return no components. that way we won't run an invalid query.
            if (scope.visualizationDimensions.frame.type === 'GRAPH') {
                taskOptionsComponent = {};
                taskOptionsComponent[scope.widgetCtrl.panelId] = {
                    layout: scope.visualizationDimensions.active.layout,
                };

                return [
                    {
                        type: 'taskOptions',
                        components: [taskOptionsComponent],
                    },
                    {
                        type: 'collectGraph',
                        components: [scope.visualizationDimensions.frame.name],
                        terminal: true,
                    },
                ];
            } else if (selectComponent.length === 0) {
                return [];
            }

            return [
                {
                    type: 'frame',
                    components: [scope.visualizationDimensions.frame.name],
                },
                {
                    type: 'select2',
                    components: [selectComponent],
                },
                {
                    type: 'group',
                    components: [groupComponent],
                },
                {
                    type: 'join',
                    components: [joinComponent],
                },
                {
                    type: 'with',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'format',
                    components: [
                        'graph',
                        [
                            {
                                connections: connections,
                            },
                        ],
                    ],
                },
                {
                    type: 'taskOptions',
                    components: [taskOptionsComponent],
                },
                {
                    type: 'collect',
                    components: [scope.widgetCtrl.getOptions('limit')],
                    terminal: true,
                },
            ];
        }

        /*** Recommendation */
        /**
         * @name updateRecommendations
         * @desc check if recommendations are available
         */
        function updateRecommendations(): void {
            if (!scope.visualizationDimensions.active.layout) {
                scope.visualizationDimensions.recommendations.available = false;
                return;
            }

            if (
                scope.widgetCtrl.getShared('frame.recommendations') &&
                scope.visualizationDimensions.recommendations.toggle
            ) {
                if (
                    scope.widgetCtrl.getShared(
                        'frame.recommendations.' +
                            scope.visualizationDimensions.active.layout
                    )
                ) {
                    scope.visualizationDimensions.recommendations.available =
                        true;
                } else {
                    scope.visualizationDimensions.recommendations.available =
                        false;
                }
            }
        }

        /**
         * @name toggleRecommendations
         * @desc toggles recommendations and retrives them from BE if visualizationDimensions.recommendations is true
         */
        function toggleRecommendations(): void {
            scope.visualizationDimensions.recommendations.toggle =
                !scope.visualizationDimensions.recommendations.toggle;

            if (scope.visualizationDimensions.recommendations.toggle) {
                scope.widgetCtrl.execute([
                    {
                        type: 'Pixel',
                        components: ['VizRecommendations()'],
                        terminal: true,
                        meta: true,
                    },
                ]);
            }
        }

        /**
         * @name populateRecommended
         * @desc fills out chart options based on BE recommendations or cached recommendations
         */
        function populateRecommended(): void {
            const recommendation = scope.widgetCtrl.getShared(
                'frame.recommendations.' +
                    scope.visualizationDimensions.active.layout
            );

            if (!recommendation) {
                // no recommendations
                return;
            }

            // turn off autodraw
            setAutoDraw(false);

            const selected = {};
            for (const header in recommendation) {
                if (
                    recommendation.hasOwnProperty(header) &&
                    header !== 'weight'
                ) {
                    // the model we want
                    const model = recommendation[header];

                    if (!selected[model]) {
                        selected[model] = [];
                    }

                    // add the visual panel dimensions full header to the appropriate
                    for (
                        let headerIdx = 0,
                            headerLen =
                                scope.visualizationDimensions.headers.raw
                                    .length;
                        headerIdx < headerLen;
                        headerIdx++
                    ) {
                        const header =
                            scope.visualizationDimensions.headers.raw[
                                headerIdx
                            ];

                        if (header.alias === header) {
                            selected[model].push(header);
                            break;
                        }
                    }
                }
            }

            // update the dimensions
            for (const model in selected) {
                if (selected.hasOwnProperty(model)) {
                    for (
                        let listIdx = 0,
                            listLen =
                                scope.visualizationDimensions.fields.list
                                    .length;
                        listIdx < listLen;
                        listIdx++
                    ) {
                        const field =
                            scope.visualizationDimensions.fields.list[listIdx];

                        if (field.model === model) {
                            field.selected = selected[model];
                        }
                    }
                }
            }
        }

        /**
         * @name getFrames
         * @desc gets a list of available frames
         */
        function getFrames(): void {
            const frames = scope.widgetCtrl.getShared('frames') || {};
            let selectedExists = false;
            scope.visualizationDimensions.availableFrames = [];

            for (const frame in frames) {
                if (frames.hasOwnProperty(frame)) {
                    scope.visualizationDimensions.availableFrames.push(
                        frames[frame]
                    );
                    if (
                        frames[frame].name ===
                        scope.visualizationDimensions.frame.name
                    ) {
                        selectedExists = true;
                    }
                }
            }

            // If the selected frame has been removed, reset everything
            if (!selectedExists) {
                scope.visualizationDimensions.frame = {
                    name: '',
                    type: '',
                    headers: [],
                    joins: [],
                };

                scope.visualizationDimensions.headers = {
                    raw: [],
                    searched: [],
                    search: '',
                };

                scope.visualizationDimensions.fields = {
                    list: [],
                    format: '',
                    additional: {
                        GGPlot: [''], // ggplot script
                        Seaborn: [''], // seaborn script
                    },
                };
            }
        }

        /**
         * @name setFrame
         * @desc called when a different frame is selected and will rerun with the new frame
         */
        function setFrame(): void {
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'setPanelView',
                    components: ['visualization'],
                    terminal: true,
                },
                {
                    type: 'frame',
                    components: [scope.visualizationDimensions.frame.name],
                },
                {
                    type: 'queryAll',
                    components: [],
                },
                {
                    type: 'autoTaskOptions',
                    components: [scope.widgetCtrl.panelId, 'Grid'],
                },
                {
                    type: 'collect',
                    components: [scope.widgetCtrl.getOptions('limit')],
                    terminal: true,
                },
            ]);
            scope.viewCtrl.updatedFrame();

            scope.viewCtrl.updatedActive(true, {
                view: 'visualization',
                layout: 'Grid',
                type: 'echarts',
            });
        }

        /**
         * @name getCurrentViz
         * @desc gets the current visualization's name and image
         */
        function getCurrentViz() {
            const widget =
                    semossCoreService.getActiveVisualizationId(
                        scope.visualizationDimensions.active.layout,
                        scope.visualizationDimensions.active.type
                    ) || '',
                config = semossCoreService.getSpecificConfig(widget) || {};

            scope.visualizationDimensions.visual = {
                name: config.name,
                image: config.icon,
            };
        }

        /** Utility */

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize() {
            let recommendationListener: () => void, frameListener: () => void;

            // listeners
            scope.$on('view--active-updated', (event, paint) => {
                if (paint) {
                    paintDimensions();
                } else {
                    resetDimensions();
                }
                getCurrentViz();
                scope.visualizationDimensions.showVisuals = false;
            });

            recommendationListener = scope.widgetCtrl.on(
                'visualization-recommendations-received',
                updateRecommendations
            );
            frameListener = scope.widgetCtrl.on('update-frame', getFrames);

            // cleanup
            scope.$on('$destroy', function () {
                recommendationListener();
                frameListener();
            });

            resetDimensions();
            getFrames();
            getCurrentViz();
        }

        initialize();
    }
}
