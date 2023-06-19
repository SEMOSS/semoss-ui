'use strict';
import './color-by-value.scss';

export default angular
    .module('app.color-by-value.directive', [])
    .directive('colorByValue', colorByValueDirective);

colorByValueDirective.$inject = ['VIZ_COLORS', '$q'];

function colorByValueDirective(VIZ_COLORS, $q) {
    colorByValueCtrl.$inject = [];
    colorByValueLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'colorByValue',
        bindToController: {},
        template: require('./color-by-value.directive.html'),
        controller: colorByValueCtrl,
        link: colorByValueLink,
    };

    function colorByValueCtrl() {}

    function colorByValueLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.colorByValue.colorOn = {
            selected: [],
            options: [],
        };

        scope.colorByValue.selectedColor = {
            selected: {},
            options: [],
        };

        scope.colorByValue.selectedColumn = {
            selected: {},
            options: [],
        };

        scope.colorByValue.instances = {
            taskId: '',
            canCollect: true,
            loading: false,
            options: [],
            search: '',
        };

        scope.colorByValue.values = {
            type: '',
            selected: [],
        };

        scope.colorByValue.highlightRow = false;
        scope.colorByValue.editingRule = -1;

        scope.colorByValue.queuedRules = [];
        scope.colorByValue.appliedRules = [];
        scope.colorByValue.operator = {
            display: '',
            value: '',
        };

        scope.colorByValue.restrict = false;

        scope.colorByValue.updateSelected = updateSelected;
        scope.colorByValue.updateOperator = updateOperator;
        scope.colorByValue.getMoreInstances = getMoreInstances;
        scope.colorByValue.searchInstances = searchInstances;

        scope.colorByValue.addToQueue = addToQueue;
        scope.colorByValue.removeFromQueue = removeFromQueue;
        scope.colorByValue.applyRule = applyRule;
        scope.colorByValue.editRule = editRule;
        scope.colorByValue.removeRule = removeRule;
        scope.colorByValue.getFilterStr = getFilterStr;

        /**
         * @name resetPanel
         * @desc reset the panel information
         * @returns {void}
         */
        function resetPanel() {
            // set the colors
            scope.colorByValue.selectedColor.options = VIZ_COLORS.COLOR_SEMOSS;
            scope.colorByValue.selectedColor.selected =
                scope.colorByValue.selectedColor.options[0];

            scope.colorByValue.queuedRules = [];
            scope.colorByValue.appliedRules = [];
            scope.colorByValue.restrict = false;

            updateApplied();
            updateOptions();
            updateLayout();
        }

        /**
         * @name getFilterStr
         * @param {object} rule the rule to get the filter str for. to be displayed on the UI
         * @desc get the concatenated string for the filter/having
         * @returns {string} the string of the display
         */
        function getFilterStr(rule) {
            let filterStr = '';

            // set up the filters
            for (
                let filterIdx = 0;
                filterIdx < rule.filters.length;
                filterIdx++
            ) {
                filterStr += rule.filters[filterIdx].filterStr;
                if (filterIdx !== rule.filters.length - 1) {
                    filterStr += ', ';
                }
            }

            // set up the havings
            for (
                let havingIdx = 0;
                havingIdx < rule.havings.length;
                havingIdx++
            ) {
                if (havingIdx === 0) {
                    if (filterStr) {
                        filterStr += ', ';
                    }

                    filterStr += 'Having: ';
                }

                filterStr += rule.havings[havingIdx].filterStr;

                if (havingIdx !== rule.havings.length - 1) {
                    filterStr += ', ';
                }
            }

            return filterStr;
        }

        /**
         * @name updateApplied
         * @desc set the applied for color by value
         * @returns {void}
         */
        function updateApplied() {
            // TODO: render based on the individual pieces
            scope.colorByValue.appliedRules = scope.widgetCtrl.getWidget(
                'view.visualization.colorByValue'
            );
        }

        /**
         * @name updateOptions
         * @desc set the options for color by value
         * @returns {void}
         */
        function updateOptions() {
            let headers, layout, keys, options;

            headers = scope.widgetCtrl.getFrame('headers') || [];
            layout = scope.widgetCtrl.getWidget('view.visualization.layout');
            keys = scope.widgetCtrl.getWidget(
                'view.visualization.keys.' + layout
            );

            options = [];
            for (let i = 0, len = keys.length; i < len; i++) {
                if (keys[i].derived) {
                    options.push({
                        alias: keys[i].alias,
                        selector: keys[i].header,
                        derived: keys[i].derived,
                        math: keys[i].math,
                        calculatedBy: keys[i].calculatedBy,
                        groupBy: keys[i].groupBy,
                        operators: getOperators(keys[i].derived, keys[i].type),
                        dataType: keys[i].type,
                    });
                }
            }

            // add frame headers
            for (let i = 0, len = headers.length; i < len; i++) {
                options.push({
                    alias: headers[i].displayName,
                    selector: headers[i].alias,
                    derived: false,
                    math: '',
                    calculatedBy: '',
                    groupBy: [],
                    operators: getOperators(false, headers[i].dataType),
                    dataType: headers[i].dataType,
                });
            }

            options.sort(function (a, b) {
                let lowerA = a.alias.toLowerCase(),
                    lowerB = b.alias.toLowerCase();

                if (lowerA > lowerB) {
                    return 1;
                } else if (lowerA === lowerB) {
                    return 0;
                }

                return -1;
            });

            scope.colorByValue.selectedColumn.options = JSON.parse(
                JSON.stringify(options)
            );
            scope.colorByValue.colorOn.options = JSON.parse(
                JSON.stringify(options)
            );

            if (scope.colorByValue.selectedColumn.options.length > 0) {
                scope.colorByValue.selectedColumn.selected = JSON.parse(
                    JSON.stringify(scope.colorByValue.selectedColumn.options[0])
                );
                scope.colorByValue.operator =
                    scope.colorByValue.selectedColumn.selected.operators[0];
            }

            updateColorOn();
            updateOperator();
            scope.colorByValue.selectedColor.selected =
                scope.colorByValue.selectedColor.options[0];
            scope.colorByValue.restrict = false;
            scope.colorByValue.highlightRow = false;
        }

        /**
         * @name updateLayout
         * @desc  set options when the layout chnages
         * @return {void}
         */
        function updateLayout() {
            let layout = scope.widgetCtrl.getWidget(
                'view.visualization.layout'
            );
            scope.colorByValue.gridLayout = layout === 'Grid';
        }

        /**
         * @name updateColorOn
         * @desc sets color on to be the label of the visualization;
         * @return {void}
         */
        function updateColorOn() {
            let layout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                aliasToColor = '',
                i,
                len,
                layerIndex = 0;

            if (
                scope.widgetCtrl.getFrame('type') !== 'GRID' &&
                layout === 'Graph'
            ) {
                aliasToColor = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data.headers'
                )[0];
            } else {
                let keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + layout
                );
                for (i = 0, len = keys.length; i < len; i++) {
                    // these two have label and x axis, need to force label
                    if (
                        layout === 'Scatter' ||
                        layout === 'SingleAxisCluster' ||
                        layout === 'Map'
                    ) {
                        if (keys[i].model === 'label') {
                            aliasToColor = keys[i].alias;
                            break;
                        }
                    } else if (
                        keys[i].model === 'label' ||
                        keys[i].model === 'dimension' ||
                        keys[i].model === 'x' ||
                        keys[i].model === 'group' ||
                        keys[i].model === 'cluster'
                    ) {
                        aliasToColor = keys[i].alias;
                        break;
                    }
                }
            }

            len = scope.colorByValue.colorOn.options.length;
            if (aliasToColor) {
                for (i = 0; i < len; i++) {
                    if (
                        aliasToColor ===
                        scope.colorByValue.colorOn.options[i].alias
                    ) {
                        scope.colorByValue.colorOn.selected = JSON.parse(
                            JSON.stringify(
                                scope.colorByValue.colorOn.options[i]
                            )
                        );
                        return;
                    }
                }
            }

            if (len > 0) {
                scope.colorByValue.colorOn.selected = JSON.parse(
                    JSON.stringify(scope.colorByValue.colorOn.options[0])
                );
            }
        }

        /**
         * @name updateSelected
         * @desc called when the selectedColumn changes
         * @return {void}
         */
        function updateSelected() {
            let operatorIsValid = false;

            // if (scope.colorByValue.values.type === 'list') {
            //     getInstances();
            // }

            // console.log('check if operator is valid');
            // console.log(scope.colorByValue.selectedColumn.selected.operators);

            for (
                let operatorIdx = 0,
                    operatorLen =
                        scope.colorByValue.selectedColumn.selected.operators
                            .length;
                operatorIdx < operatorLen;
                operatorIdx++
            ) {
                if (
                    scope.colorByValue.selectedColumn.selected.operators[
                        operatorIdx
                    ].value === scope.colorByValue.operator.value
                ) {
                    operatorIsValid = true;
                    break;
                }
            }

            if (!operatorIsValid) {
                scope.colorByValue.operator =
                    scope.colorByValue.selectedColumn.selected.operators[0];
            }

            return updateOperator();
        }

        /**
         * @name updateOperator
         * @desc called when the operator changes
         * @return {void}
         */
        function updateOperator() {
            let deferred = $q.defer();

            if (
                scope.colorByValue.operator.value !== '==' &&
                scope.colorByValue.operator.value !== '!=' &&
                scope.colorByValue.operator.value !== '?like'
            ) {
                if (
                    scope.colorByValue.selectedColumn.selected.dataType.toLowerCase() ===
                    'date'
                ) {
                    scope.colorByValue.values.type = 'date';
                    // } else if (scope.colorByValue.selectedColumn.selected.dataType.toLowerCase() === 'timestamp') {
                    //     scope.colorByValue.values.type = 'timestamp';
                } else {
                    scope.colorByValue.values.type = 'numerical';
                }

                scope.colorByValue.values.selected = '';

                if (scope.colorByValue.selectedColumn.selected.derived) {
                    scope.colorByValue.maxNumericalValue = 0;
                    scope.colorByValue.minNumericalValue = 0;

                    scope.colorByValue.values.selected = 0;
                    deferred.resolve();
                } else {
                    let callback = (response) => {
                        let output = response.pixelReturn[0].output,
                            type = response.pixelReturn[0].operationType;

                        if (type.indexOf('ERROR') > -1) {
                            return;
                        }

                        scope.colorByValue.maxNumericalValue =
                            output.data.values[0][0];
                        scope.colorByValue.minNumericalValue =
                            output.data.values[0][1];

                        scope.colorByValue.values.selected =
                            output.data.values[0][1];
                        deferred.resolve();
                    };

                    scope.widgetCtrl.meta(
                        [
                            {
                                type: 'frame',
                                components: [scope.widgetCtrl.getFrame('name')],
                                meta: true,
                            },
                            {
                                type: 'select2',
                                components: [
                                    [
                                        {
                                            math: 'Max',
                                            alias:
                                                'Max_of_' +
                                                scope.colorByValue
                                                    .selectedColumn.selected
                                                    .alias,
                                            calculatedBy:
                                                scope.colorByValue
                                                    .selectedColumn.selected
                                                    .selector,
                                        },
                                        {
                                            math: 'Min',
                                            alias:
                                                'Min_of_' +
                                                scope.colorByValue
                                                    .selectedColumn.selected
                                                    .alias,
                                            calculatedBy:
                                                scope.colorByValue
                                                    .selectedColumn.selected
                                                    .selector,
                                        },
                                    ],
                                ],
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
            } else if (scope.colorByValue.operator.value === '?like') {
                scope.colorByValue.values.type = 'search';
                scope.colorByValue.values.selected = '';

                scope.colorByValue.maxNumericalValue = 0;
                scope.colorByValue.minNumericalValue = 0;
                deferred.resolve();
            } else {
                scope.colorByValue.values.type = 'list';
                scope.colorByValue.values.selected = [];

                scope.colorByValue.maxNumericalValue = 0;
                scope.colorByValue.minNumericalValue = 0;

                getInstances(deferred);
            }

            return deferred.promise;
        }

        /** Instances */
        /**
         * @name getInstances
         * @param {*} deferred the deferred promise to resolve
         * @desc retrieves instances of the header
         * @return {void}
         */
        function getInstances(deferred) {
            let callback, components;

            scope.colorByValue.instances.taskId = '';
            scope.colorByValue.instances.canCollect = true;
            scope.colorByValue.instances.loading = true;
            scope.colorByValue.instances.options = [];

            callback = (response) => {
                let output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                scope.colorByValue.instances.loading = false;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.colorByValue.instances.taskId = output.taskId;
                scope.colorByValue.instances.canCollect =
                    output.numCollected === output.data.values.length;

                for (let i = 0, len = output.data.values.length; i < len; i++) {
                    scope.colorByValue.instances.options.push(
                        output.data.values[i][0]
                    );
                }

                if (deferred) {
                    deferred.resolve();
                }
            };

            components = [];
            if (scope.colorByValue.selectedColumn.selected.derived) {
                components.push(
                    {
                        meta: true,
                        type: 'frame',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    math: scope.colorByValue.selectedColumn
                                        .selected.math,
                                    calculatedBy:
                                        scope.colorByValue.selectedColumn
                                            .selected.calculatedBy,
                                    alias: scope.colorByValue.selectedColumn
                                        .selected.alias,
                                },
                            ],
                        ],
                    }
                );

                if (
                    scope.colorByValue.selectedColumn.selected.groupBy &&
                    scope.colorByValue.selectedColumn.selected.groupBy.length >
                        0
                ) {
                    components.push({
                        type: 'group',
                        components: [
                            scope.colorByValue.selectedColumn.selected.groupBy,
                        ],
                    });
                }

                components.push(
                    {
                        type: 'sort',
                        components: [
                            [
                                scope.colorByValue.selectedColumn.selected
                                    .calculatedBy,
                            ],
                        ],
                    },
                    {
                        type: 'collect',
                        components: [50],
                        terminal: true,
                    }
                );
            } else {
                components.push(
                    {
                        meta: true,
                        type: 'frame',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    selector:
                                        scope.colorByValue.selectedColumn
                                            .selected.selector,
                                    alias: scope.colorByValue.selectedColumn
                                        .selected.alias,
                                },
                            ],
                        ],
                    }
                );

                if (scope.colorByValue.instances.search) {
                    let filterObj = {};
                    filterObj[
                        scope.colorByValue.selectedColumn.selected.alias
                    ] = {
                        comparator: '?like',
                        value: [scope.colorByValue.instances.search],
                    };

                    components.push({
                        type: 'filter',
                        components: [filterObj],
                    });
                }

                components.push(
                    {
                        type: 'sort',
                        components: [
                            [scope.colorByValue.selectedColumn.selected.alias],
                        ],
                    },
                    {
                        type: 'collect',
                        components: [50],
                        terminal: true,
                    }
                );
            }

            scope.widgetCtrl.meta(components, callback);
        }

        /**
         * @name getMoreInstances
         * @desc gets more instances based on current task id
         * @return {void}
         */
        function getMoreInstances() {
            if (scope.colorByValue.instances.canCollect) {
                let callback;

                // register message to come back to
                callback = (response) => {
                    let output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType;

                    scope.colorByValue.instances.loading = false;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    // add new ones
                    for (
                        let i = 0, len = output.data.values.length;
                        i < len;
                        i++
                    ) {
                        scope.colorByValue.instances.options.push(
                            output.data.values[i][0]
                        );
                    }

                    // update filter control variables
                    scope.colorByValue.instances.taskId = output.taskId;
                    scope.colorByValue.instances.canCollect =
                        output.numCollected === output.data.values.length;
                };

                scope.colorByValue.instances.loading = true;

                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'task',
                            components: [scope.colorByValue.instances.taskId],
                        },
                        {
                            type: 'collect',
                            components: [50],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }
        }

        /**
         * @name searchInstances
         * @desc gets header instances based on search query
         * @param {string} search - search string
         * @return {void}
         */
        function searchInstances(search) {
            scope.colorByValue.instances.search = search;
            getInstances();
        }

        /**
         * @name editRule
         * @param {number} index the index of the rule to edit
         * @desc edit a rule
         * @returns {void}
         */
        function editRule(index) {
            const currentRule = scope.colorByValue.appliedRules[index];

            scope.colorByValue.editingRule = index;
            scope.colorByValue.selectedColor.selected = currentRule.color;

            for (
                let idx = 0;
                idx < scope.colorByValue.colorOn.options.length;
                idx++
            ) {
                if (
                    scope.colorByValue.colorOn.options[idx].alias ===
                    currentRule.colorOn
                ) {
                    scope.colorByValue.colorOn.selected =
                        scope.colorByValue.colorOn.options[idx];
                    break;
                }
            }

            for (
                let idx = 0;
                idx < scope.colorByValue.selectedColumn.options.length;
                idx++
            ) {
                if (
                    scope.colorByValue.selectedColumn.options[idx].alias ===
                    currentRule.valuesColumn
                ) {
                    scope.colorByValue.selectedColumn.selected =
                        scope.colorByValue.selectedColumn.options[idx];
                    break;
                }
            }
            scope.colorByValue.highlightRow = currentRule.highlightRow || false;
            scope.colorByValue.restrict = currentRule.highlightRow || false;

            updateSelected().then(function () {
                scope.colorByValue.operator = currentRule.comparator;
                updateOperator().then(function () {
                    scope.colorByValue.values.selected =
                        currentRule.selectedValues;
                });
            });
        }

        /** Queue */
        /**
         * @name addToQueue
         * @desc takes user selected values and queues the rule. clears the
         *       selected values so user can create another rule
         * @return {void}
         */
        function addToQueue() {
            let selected = scope.colorByValue.values.selected;

            if (!Array.isArray(selected)) {
                selected = [selected];
            }

            scope.colorByValue.queuedRules.push({
                where: scope.colorByValue.selectedColumn.selected,
                operator: scope.colorByValue.operator,
                queuedLogic: 'AND',
                values: JSON.parse(JSON.stringify(selected)),
            });

            scope.colorByValue.values.selected = [];
        }

        /**
         * @name removeFromQueue
         * @param {number} index - index to remove from
         * @desc remove the rule from the queue by index
         * @returns {void}
         */
        function removeFromQueue(index) {
            scope.colorByValue.queuedRules.splice(index, 1);
        }

        /**
         * @name applyRule
         * @desc applys the rule
         * @return {void}
         */
        function applyRule() {
            let variable,
                options = {},
                groupBy = [],
                havingorFilterTag,
                havingorFilterPixel,
                queuedRulesIdx,
                queuedRulesLen,
                pixel = '';

            if (
                (scope.colorByValue.values.type === 'numerical' &&
                    !isNaN(scope.colorByValue.values.selected)) ||
                (scope.colorByValue.values.type === 'search' &&
                    scope.colorByValue.values.selected) ||
                (scope.colorByValue.values.type === 'list' &&
                    scope.colorByValue.values.selected.length > 0) ||
                (scope.colorByValue.values.type === 'date' &&
                    scope.colorByValue.values.selected)
            ) {
                addToQueue();
            }

            if (scope.colorByValue.queuedRules.length === 0) {
                return;
            }

            // if editing a rule, we will remove the old before adding the new rule
            if (scope.colorByValue.editingRule !== -1) {
                removeRule(
                    scope.colorByValue.appliedRules[
                        scope.colorByValue.editingRule
                    ].name
                );
            }

            variable = 'cbv_' + String(Date.now());

            if (scope.colorByValue.highlightRow) {
                options.highlightRow = scope.colorByValue.highlightRow;
            }

            options.color = scope.colorByValue.selectedColor.selected;
            options.colorOn = scope.colorByValue.colorOn.selected.alias;
            options.valuesColumn =
                scope.colorByValue.selectedColumn.selected.alias;
            options.comparator = scope.colorByValue.operator;
            options.selectedValues =
                scope.colorByValue.queuedRules.length === 1
                    ? scope.colorByValue.queuedRules[0].values
                    : [];
            options.queued = scope.colorByValue.queuedRules.length > 1;
            options.restrict = scope.colorByValue.restrict;

            // since we assume that all of the queued have the same where, we can just use this
            pixel = '';
            pixel +=
                variable +
                ' = Frame(' +
                scope.widgetCtrl.getFrame('name') +
                ') | ImplicitFilterOverride(true) | Select(';

            if (scope.colorByValue.colorOn.selected.derived) {
                pixel +=
                    scope.colorByValue.colorOn.selected.math +
                    '(' +
                    scope.colorByValue.colorOn.selected.calculatedBy +
                    ')';
            } else {
                pixel += scope.colorByValue.colorOn.selected.selector;
            }
            pixel += ') | ';

            // TODO: do i need group? its grouping on itself
            // pixel += 'Group(';
            // pixel += scope.colorByValue.colorOn.selected.selector;
            // pixel += ') | ';

            havingorFilterPixel = '';
            havingorFilterTag = 'Filter';

            for (
                queuedRulesIdx = 0,
                    queuedRulesLen = scope.colorByValue.queuedRules.length;
                queuedRulesIdx < queuedRulesLen;
                queuedRulesIdx++
            ) {
                havingorFilterPixel += '(';
                if (
                    scope.colorByValue.queuedRules[queuedRulesIdx].where.derived
                ) {
                    havingorFilterTag = 'Having';

                    for (
                        let groupByIdx = 0,
                            groupByLen =
                                scope.colorByValue.queuedRules[queuedRulesIdx]
                                    .where.groupBy.length;
                        groupByIdx < groupByLen;
                        groupByIdx++
                    ) {
                        if (
                            groupBy.indexOf(
                                scope.colorByValue.queuedRules[queuedRulesIdx]
                                    .where.groupBy[groupByIdx]
                            ) === -1
                        ) {
                            groupBy.push(
                                scope.colorByValue.queuedRules[queuedRulesIdx]
                                    .where.groupBy[groupByIdx]
                            );
                        }
                    }

                    havingorFilterPixel +=
                        scope.colorByValue.queuedRules[queuedRulesIdx].where
                            .math +
                        '(' +
                        scope.colorByValue.queuedRules[queuedRulesIdx].where
                            .calculatedBy +
                        ')';
                } else {
                    havingorFilterPixel +=
                        scope.colorByValue.queuedRules[queuedRulesIdx].where
                            .selector;
                }

                havingorFilterPixel +=
                    ' ' +
                    scope.colorByValue.queuedRules[queuedRulesIdx].operator
                        .value +
                    ' ';
                havingorFilterPixel += JSON.stringify(
                    scope.colorByValue.queuedRules[queuedRulesIdx].values
                );
                havingorFilterPixel += ')';

                if (scope.colorByValue.queuedRules[queuedRulesIdx + 1]) {
                    havingorFilterPixel +=
                        ' ' +
                        scope.colorByValue.queuedRules[queuedRulesIdx]
                            .queuedLogic +
                        ' ';
                }
            }

            if (groupBy.length > 0) {
                pixel += 'Group(';
                for (
                    let groupByIdx = 0, groupByLen = groupBy.length;
                    groupByIdx < groupByLen;
                    groupByIdx++
                ) {
                    pixel += groupBy[groupByIdx] + ', ';
                }
                pixel = pixel.slice(0, -2);
                pixel += ') | ';
            }

            pixel += havingorFilterTag;
            pixel += '(';
            pixel += havingorFilterPixel;
            pixel += ');';

            // clear out
            scope.colorByValue.queuedRules = [];

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'addPanelColorByValue',
                        components: [variable, options],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'retrievePanelColorByValue',
                        components: [variable],
                    },
                    {
                        type: 'collect',
                        components: [scope.widgetCtrl.getOptions('limit')],
                        terminal: true,
                    },
                ],
                () => {},
                [scope.widgetCtrl.widgetId]
            );
        }

        /**
         * @name removeRule
         * @param {string} name - name of the rule to remove
         * @desc remove the rule from the applied by index
         * @returns {void}
         */
        function removeRule(name) {
            scope.widgetCtrl.execute(
                [
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'removePanelColorByValue',
                        components: [name],
                        terminal: true,
                    },
                ],
                () => {},
                [scope.widgetCtrl.widgetId]
            );

            scope.colorByValue.editingRule = -1;
        }

        /** * Helpers */
        /**
         * @name getOperators
         * @param {boolean} derived - is value derived?
         * @param {string} type - type of the value
         * @returns {array} operators
         */
        function getOperators(derived, type) {
            let operators = [
                {
                    display: 'is Equal To',
                    value: '==',
                },
                {
                    display: 'is Not Equal To',
                    value: '!=',
                },
                {
                    display: 'Contains',
                    value: '?like',
                },
                {
                    display: 'is Less Than',
                    value: '<',
                },
                {
                    display: 'is Less Than or Equal To',
                    value: '<=',
                },
                {
                    display: 'is Greater Than',
                    value: '>',
                },
                {
                    display: 'is Greater Than or Equal To',
                    value: '>=',
                },
            ];

            if (derived) {
                return operators.filter(function (op) {
                    return op.display !== 'Contains';
                });
            }

            if (type === 'STRING') {
                return [
                    {
                        display: 'is Equal To',
                        value: '==',
                    },
                    {
                        display: 'is Not Equal To',
                        value: '!=',
                    },
                    {
                        display: 'Contains',
                        value: '?like',
                    },
                ];
            }

            return operators.filter(function (op) {
                return op.display !== 'Contains';
            });
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            let updateTaskListener, colorByValueListener;

            updateTaskListener = scope.widgetCtrl.on(
                'update-task',
                function () {
                    updateApplied();
                    updateOptions();
                    updateLayout();
                }
            );

            colorByValueListener = scope.widgetCtrl.on(
                'update-color-by-value',
                function () {
                    updateApplied();
                    updateOptions();
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                // console.log('destroying color-by-value...');
                colorByValueListener();
                updateTaskListener();
            });

            resetPanel();
        }

        initialize();
    }
}
