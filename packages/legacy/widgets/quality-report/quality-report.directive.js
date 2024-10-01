'use strict';

import './quality-report.scss';

export default angular
    .module('app.quality-report.directive', [])
    .directive('qualityReport', qualityReportDirective);

qualityReportDirective.$inject = ['semossCoreService'];

function qualityReportDirective(semossCoreService) {
    qualityReportCtrl.$inject = [];
    qualityReportLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'qualityReport',
        bindToController: {},
        template: require('./quality-report.directive.html'),
        controller: qualityReportCtrl,
        link: qualityReportLink,
    };

    function qualityReportCtrl() {}

    function qualityReportLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];
        scope.qualityReport.PIPELINE = scope.pipelineComponentCtrl !== null;

        // VARIABLES
        scope.qualityReport.rules = {
            selected: '',
            options: [],
        };
        scope.qualityReport.columns = {
            selected: '',
            options: [],
        };
        scope.qualityReport.appliedRules = [];
        scope.qualityReport.results = [];
        scope.qualityReport.dataFrame = false;
        scope.qualityReport.optionType = false;
        scope.qualityReport.ruleHasBeenSet = false;
        scope.qualityReport.defaultColor = '#F9A825';
        scope.qualityReport.requiredFields = {};
        scope.qualityReport.specifiedOptions = '';

        // FUNCTIONS
        scope.qualityReport.setRule = setRule;
        scope.qualityReport.setOptions = setOptions;
        scope.qualityReport.addOption = addOption;
        scope.qualityReport.clearOption = clearOption;
        scope.qualityReport.getResults = getResults;
        scope.qualityReport.removeRule = removeRule;
        scope.qualityReport.updateCBV = updateCBV;
        scope.qualityReport.generateReport = generateReport;

        /**
         * @name resetPanel
         * @desc reset the panel information
         * @returns {void}
         */
        function resetPanel() {
            var active = scope.widgetCtrl.getWidget('active'),
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                pixelList,
                newFrame,
                i;

            scope.qualityReport.appliedRules = [];
            scope.qualityReport.results = [];
            scope.qualityReport.dataFrame = false;

            if (sharedTools.qualityReport) {
                pixelList = [];
                scope.qualityReport.appliedRules =
                    sharedTools.qualityReport.appliedRules;
                scope.qualityReport.dataFrame =
                    sharedTools.qualityReport.dataFrame;

                for (
                    i = 0;
                    i < sharedTools.qualityReport.appliedRules.length;
                    i++
                ) {
                    newFrame = false;
                    if (i === 0) {
                        newFrame = true;
                    }

                    pixelList.push({
                        type: 'runDataQuality',
                        components: [
                            sharedTools.qualityReport.appliedRules[i]
                                .selectedRule.ruleID,
                            sharedTools.qualityReport.appliedRules[i]
                                .selectedColumn.value,
                            sharedTools.qualityReport.appliedRules[i]
                                .selectedRule.selectedOptions,
                            sharedTools.qualityReport.dataFrame,
                            newFrame,
                        ],
                        terminal: true,
                        meta: false,
                    });
                }
                getSavedResults(pixelList);
            } else {
                scope.qualityReport.dataFrame =
                    'dataQualityTable_' + String(Date.now());
            }
            getRules();
        }

        /**
         * @name getRules
         * @desc set the available rules to display
         * @returns {void}
         */
        function getRules() {
            var callback;

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.qualityReport.rules.options = [];
                if (output && output.rules && output.rules.length > 0) {
                    scope.qualityReport.rules.options = output.rules;
                }
                // if (scope.qualityReport.PIPELINE) {
                //     setPipelineState();
                // }
                getFrameHeaders();
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: ['GetDQRules()'],
                        terminal: true,
                        meta: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getFrameHeaders
         * @desc set the options for color by value
         * @returns {void}
         */
        function getFrameHeaders() {
            var headers = scope.widgetCtrl.getFrame('headers') || [],
                headerIdx,
                headerLen;

            scope.qualityReport.columns.options = [];

            for (
                headerIdx = 0, headerLen = headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                scope.qualityReport.columns.options.push({
                    name: String(headers[headerIdx].displayName).replace(
                        /_/g,
                        ' '
                    ),
                    value: headers[headerIdx].alias,
                });
            }
        }

        /**
         * @name setRule
         * @desc called when the selected rule changes
         * @return {void}
         */
        function setRule() {
            scope.qualityReport.ruleHasBeenSet = true;
            scope.qualityReport.optionType = false;
            scope.qualityReport.allFieldsSelected = false;
            scope.qualityReport.specifiedOptions = '';

            if (scope.qualityReport.rules.selected) {
                if (scope.qualityReport.rules.selected.option) {
                    scope.qualityReport.optionType =
                        scope.qualityReport.rules.selected.optionType;
                    scope.qualityReport.requiredFields = {
                        column: false,
                        options: false,
                    };
                } else {
                    scope.qualityReport.requiredFields = {
                        column: false,
                    };
                }
            }
        }

        /**
         * @name setOptions
         * @desc record that the options field have been set
         * @param {string} field changed field
         * @return {void}
         */
        function setOptions(field) {
            var prop;

            if (scope.qualityReport.requiredFields.hasOwnProperty(field)) {
                scope.qualityReport.requiredFields[field] = true;
            }

            scope.qualityReport.allFieldsSelected = true;
            for (prop in scope.qualityReport.requiredFields) {
                if (scope.qualityReport.requiredFields.hasOwnProperty(prop)) {
                    if (!scope.qualityReport.requiredFields[prop]) {
                        scope.qualityReport.allFieldsSelected = false;
                        break;
                    }
                }
            }
        }

        /**
         * @name addOption
         * @desc add an accepted format
         * @return {void}
         */
        function addOption() {
            if (
                !scope.qualityReport.rules.selected.hasOwnProperty(
                    'selectedOptions'
                )
            ) {
                scope.qualityReport.rules.selected.selectedOptions = [];
            }

            if (
                scope.qualityReport.newOption &&
                scope.qualityReport.newOption.length > 0
            ) {
                scope.qualityReport.rules.selected.selectedOptions.push(
                    scope.qualityReport.newOption
                );

                if (scope.qualityReport.specifiedOptions) {
                    scope.qualityReport.specifiedOptions +=
                        ', ' + scope.qualityReport.newOption;
                } else {
                    scope.qualityReport.specifiedOptions =
                        scope.qualityReport.newOption;
                }

                scope.qualityReport.newOption = '';
                setOptions('options');
            }
        }

        /**
         * @name clearOption
         * @desc clear all of the options
         * @return {void}
         */
        function clearOption() {
            scope.qualityReport.rules.selected.selectedOptions = [];
            scope.qualityReport.specifiedOptions = '';
        }

        /**
         * @name removeRule
         * @desc remove a specified rule
         * @param {number} index index of selected rule to remove
         * @return {void}
         */
        function removeRule(index) {
            var removePixelComponents;
            if (scope.qualityReport.results[index].cbv.applied) {
                removeColorByValue(scope.qualityReport.results[index]);
            }

            removePixelComponents = removeFromFrame(
                scope.qualityReport.results[index]
            );

            scope.qualityReport.appliedRules.splice(index, 1);
            scope.qualityReport.results.splice(index, 1);
            saveResults(removePixelComponents);
        }

        /**
         * @name removeFromFrame
         * @param {*} ruleInfo the rule to remove from frame
         * @returns {*} array of components
         */
        function removeFromFrame(ruleInfo) {
            var pixelComponents = [];

            pixelComponents = [
                {
                    type: 'Pixel',
                    components: [
                        `R ( "<encode>${scope.qualityReport.dataFrame} <- ${
                            scope.qualityReport.dataFrame
                        }[!(
                            ${scope.qualityReport.dataFrame}$Columns=="${
                            ruleInfo.column
                        }" &
                            ${scope.qualityReport.dataFrame}$Rules=="${
                            ruleInfo.rule
                        }" &
                            ${scope.qualityReport.dataFrame}$Errors=="${
                            ruleInfo.errors
                        }" &
                            ${scope.qualityReport.dataFrame}$Total=="${
                            ruleInfo.total
                        }" &
                            ${scope.qualityReport.dataFrame}$Valid=="${
                            ruleInfo.total - ruleInfo.errors
                        }"
                        )]</encode>" )`,
                    ],
                    terminal: true,
                },
                {
                    type: 'refreshInsight',
                    components: [scope.widgetCtrl.insightID],
                    terminal: true,
                },
            ];
            return pixelComponents;
        }

        /**
         * @name getResults
         * @desc execute pixel to get data quality frame (results)
         * @return {void}
         */
        function getResults() {
            var callback;

            debugger
            if (scope.qualityReport.rules.selected.ruleID == 'Regex Input') {
                scope.qualityReport.rules.selected.selectedOptions[0] =
                    scope.qualityReport.rules.selected.selectedOptions[0].replace(
                        /"/g,
                        '\\"'
                    );
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                    debugger
                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                getDataFromFrame(output, true, false);
            };

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'variable',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'runDataQuality',
                        components: [
                            scope.qualityReport.rules.selected.ruleID,
                            scope.qualityReport.columns.selected.value,
                            scope.qualityReport.rules.selected.selectedOptions,
                            scope.qualityReport.dataFrame,
                            scope.qualityReport.appliedRules.length === 0,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getSavedResults
         * @desc execute pixel to get data quality frame (results)
         * @param {array} pixelList whether or not the rule is new (from the UI) or a previously saved rule
         * @return {void}
         */
        function getSavedResults(pixelList) {
            var callback;

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                getDataFromFrame(output, false, true);
            };

            if (pixelList.length > 0) {
                scope.widgetCtrl.meta(pixelList, callback);
            }
        }

        /**
         * @name addToAppliedRules
         * @desc add new rule to applied rules array
         * @return {void}
         */
        function addToAppliedRules() {
            var cbv = {};

            if (scope.qualityReport.results.length > 0) {
                if (
                    scope.qualityReport.results[
                        scope.qualityReport.results.length - 1
                    ].hasOwnProperty('cbv')
                ) {
                    cbv =
                        scope.qualityReport.results[
                            scope.qualityReport.results.length - 1
                        ].cbv;
                }
            }

            scope.qualityReport.appliedRules.push({
                selectedRule: scope.qualityReport.rules.selected,
                selectedColumn: scope.qualityReport.columns.selected,
                cbv: cbv,
            });
        }

        /**
         * @name getDataFromFrame
         * @desc get data from the frame
         * @param {object} results returned R Frame
         * @param {bool} updateOrnaments whether or not the rule is new (from the UI) or a previously saved rule
         * @param {bool} showAllResults whether or not to append to existing results or get all returned resutls
         * @return {void}
         */
        function getDataFromFrame(results, updateOrnaments, showAllResults) {
            var callback;

            debugger
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (output.data.values.length > 0) {
                    if (showAllResults) {
                        getAllResults(output.data);
                    } else {
                        appendToResults(output.data);
                        addToAppliedRules();
                    }

                    if (updateOrnaments) {
                        saveResults();
                    }
                } else {
                    scope.widgetCtrl.alert(
                        'error',
                        'An error occured with the selected rule'
                    );
                }

                resetValues();
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'frame',
                        components: [results.name],
                    },
                    // Show duplicates if they exist
                    {
                        type: 'Pixel',
                        components: ['Distinct(false)'],
                    },
                    // Select data we want to display
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    alias: 'Columns',
                                },
                                {
                                    alias: 'Rules',
                                },
                                {
                                    alias: 'Total',
                                },
                                {
                                    alias: 'Valid',
                                },
                                {
                                    alias: 'Errors',
                                },
                                {
                                    alias: 'toColor',
                                },
                            ],
                        ],
                    },
                    {
                        type: 'Pixel',
                        components: ['CollectAll()'],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name appendToResults
         * @desc append results to applied rules object
         * @param {object} results data quality results
         * @return {void}
         */
        function appendToResults(results) {
            var ruleIdx, numOfErrors;

            if (results.hasOwnProperty('values') && results.values.length > 0) {
                ruleIdx = results.values.length - 1;
                numOfErrors =
                    results.values[ruleIdx][results.headers.indexOf('Errors')];
                scope.qualityReport.results.push({
                    rule: results.values[ruleIdx][
                        results.headers.indexOf('Rules')
                    ],
                    column: results.values[ruleIdx][
                        results.headers.indexOf('Columns')
                    ],
                    passRate: calculatePassRate(
                        results.values[ruleIdx][
                            results.headers.indexOf('Valid')
                        ],
                        results.values[ruleIdx][
                            results.headers.indexOf('Total')
                        ]
                    ),
                    failedInstances:
                        results.values[ruleIdx][
                            results.headers.indexOf('toColor')
                        ],
                    errors: numOfErrors,
                    total: results.values[ruleIdx][
                        results.headers.indexOf('Total')
                    ],
                    cbv: {
                        applied: numOfErrors > 0,
                        variable: 'cbv_' + String(Date.now()),
                    },
                });
                if (numOfErrors > 0) {
                    addColorByValue(
                        scope.qualityReport.results[
                            scope.qualityReport.results.length - 1
                        ]
                    );
                }
            }
        }

        /**
         * @name getAllResults
         * @desc create all results for existing rules
         * @param {object} results data quality results
         * @return {void}
         */
        function getAllResults(results) {
            var i;

            scope.qualityReport.results = [];

            if (results.hasOwnProperty('values') && results.values.length > 0) {
                for (i = 0; i < results.values.length; i++) {
                    scope.qualityReport.results.push({
                        rule: results.values[i][
                            results.headers.indexOf('Rules')
                        ],
                        column: results.values[i][
                            results.headers.indexOf('Columns')
                        ],
                        passRate: calculatePassRate(
                            results.values[i][results.headers.indexOf('Valid')],
                            results.values[i][results.headers.indexOf('Total')]
                        ),
                        failedInstances:
                            results.values[i][
                                results.headers.indexOf('toColor')
                            ],
                        errors: results.values[i][
                            results.headers.indexOf('Errors')
                        ],
                        total: results.values[i][
                            results.headers.indexOf('Total')
                        ],
                        cbv: scope.qualityReport.appliedRules[i].cbv,
                    });
                }
            }
        }

        /**
         * @name saveResults
         * @param {*} additionalComponents pixel components to prepend to run
         * @desc save applied rules as a panel ornament
         * @return {void}
         */
        function saveResults(additionalComponents) {
            var components = [];
            if (additionalComponents) {
                components = additionalComponents;
            }

            components = components.concat([
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
                                    qualityReport: {
                                        appliedRules:
                                            scope.qualityReport.appliedRules,
                                        dataFrame:
                                            scope.qualityReport.dataFrame,
                                    },
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
            ]);
            scope.widgetCtrl.execute(components);
        }

        /**
         * @name calculatePassRate
         * @desc calculate the pass rate for a given rule and column
         * @param {number} valid number of valid entries
         * @param {number} total number of valid entries
         * @return {string} cleaned pass rate percentage
         */
        function calculatePassRate(valid, total) {
            if (!isNaN(valid) && !isNaN(total)) {
                return (
                    ((valid / total) * 100).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 3,
                    }) + '%'
                );
            }
            return 'Error';
        }

        /**
         * @name updateCBV
         * @desc apply or remove color by value for a specified rule
         * @param {object} rule selected rule
         * @return {void}
         */
        function updateCBV(rule) {
            if (rule.hasOwnProperty('cbv')) {
                if (rule.cbv.hasOwnProperty('applied')) {
                    if (rule.cbv.applied) {
                        addColorByValue(rule);
                    } else {
                        removeColorByValue(rule);
                    }
                    saveResults();
                }
            }
        }

        /**
         * @name addColorByValue
         * @desc paint instances where the rule fails
         * @param {object} rule selected rule
         * @return {void}
         */
        function addColorByValue(rule) {
            var options = {},
                havingorFilterTag,
                havingorFilterPixel,
                pixel = '';

            // ignore cbv if there are no errors to highlight
            if (rule.errors === 0 || !rule.failedInstances) {
                return;
            }

            options = {
                color: scope.qualityReport.defaultColor,
                colorOn: rule.column,
            };

            pixel = '';
            pixel +=
                rule.cbv.variable +
                ' = Frame(' +
                scope.widgetCtrl.getFrame('name') +
                ') | ImplicitFilterOverride(true) | Select(';
            pixel += rule.column;
            pixel += ') | ';
            pixel += 'Group(';
            pixel += rule.column;
            pixel += ') | ';

            havingorFilterPixel = '';
            havingorFilterTag = 'Filter';

            havingorFilterPixel += '(';
            havingorFilterPixel += rule.column;
            havingorFilterPixel += ' == [';
            havingorFilterPixel += rule.failedInstances;
            havingorFilterPixel += '])';

            pixel += havingorFilterTag;
            pixel += '(';
            pixel += havingorFilterPixel;
            pixel += ');';

            scope.widgetCtrl.execute([
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
                    components: [rule.cbv.variable, options],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelColorByValue',
                    components: [rule.cbv.variable],
                },
                {
                    type: 'collect',
                    components: [scope.widgetCtrl.getOptions('limit')],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name removeColorByValue
         * @desc remove applied color by value for selected rul
         * @param {object} rule selected rule
         * @return {void}
         */
        function removeColorByValue(rule) {
            // ignore cbv if there are no errors to highlight
            if (rule.errors === 0 || !rule.failedInstances) {
                return;
            }

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'removePanelColorByValue',
                    components: [rule.cbv.variable],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name generateReport
         * @desc create a quality report dashboard showing results of applied rules
         * @return {void}
         */
        function generateReport() {
            var taskOptionsComponent = {},
                panelNumber = 999;

            taskOptionsComponent[panelNumber] = {
                layout: 'Column',
                alignment: {
                    label: ['Columns'],
                    value: ['Valid', 'Errors'],
                    tooltip: ['Total', 'Rules'],
                },
            };

            scope.widgetCtrl.execute([
                {
                    type: 'addPanelIfAbsent',
                    components: [
                        panelNumber,
                        semossCoreService.workbook.getWorkbook(
                            scope.widgetCtrl.insightID,
                            'worksheet'
                        ),
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panelNumber],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'visualization',
                        {
                            type: 'echarts',
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'frame',
                    components: [scope.qualityReport.dataFrame],
                    terminal: false,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: 'Columns',
                            },
                            {
                                alias: 'Valid',
                            },
                            {
                                alias: 'Errors',
                            },
                            {
                                alias: 'Total',
                            },
                            {
                                alias: 'Rules',
                            },
                        ],
                    ],
                },
                {
                    type: 'group',
                    components: [['Columns']],
                },
                {
                    type: 'taskOptions',
                    components: [taskOptionsComponent],
                },
                {
                    type: 'Pixel',
                    components: ['CollectAll()'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panelNumber],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                shared: {
                                    toggleLegend: true,
                                    toggleStack: true,
                                },
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panelNumber],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name resetValues
         * @desc reset the values in the UI
         * @return {void}
         */
        function resetValues() {
            scope.qualityReport.ruleHasBeenSet = false;
            scope.qualityReport.rules.selected = '';
            scope.qualityReport.columns.selected = '';
            scope.qualityReport.optionType = false;
            scope.qualityReport.allFieldsSelected = false;
            scope.qualityReport.specifiedOptions = '';
        }

        // /**
        //  * @name buildParams
        //  * @desc build params for pipeline
        //  * @returns {*} pipeline params
        //  */
        // function buildParams() {
        //     var params = {
        //         SOURCE: {
        //             name: scope.pipelineComponentCtrl.getComponent('parameters.SOURCE.value.name')
        //         }
        //     };

        //     // TODO: DO I NEED A CONDITIONAL??? flow control? make sure the proper inputs are provided?
        //     // or just do that in html...make sure you can't 'apply' till everything is provided
        //     params.DATA_QUALITY = {
        //         rule: scope.qualityReport.rule,
        //         column: scope.qualityReport.column,
        //         options: scope.qualityReport.customBreaks,
        //         inputTable: scope.qualityReport.customLabels
        //     };

        //     return params;
        // }

        // /**
        //  * @name loadPreview
        //  * @desc loads preview
        //  * @return {void}
        //  */
        // function loadPreview() {
        //     var pixel;

        //     pixel = buildParams();
        //     scope.pipelineComponentCtrl.previewComponent(pixel);
        // }

        // /**
        //  * @name setPipelineState
        //  * @desc sets the pipeline existing values
        //  * @returns {void}
        //  */
        // function setPipelineState() {
        //     let qualityParam = scope.pipelineComponentCtrl.getComponent('parameters.DATA_QUALITY.value'),
        //         srcComponent = scope.pipelineComponentCtrl.getComponent('parameters.SOURCE.value');

        //     if (!srcComponent) {
        //         scope.pipelineComponentCtrl.closeComponent();
        //         return;
        //     }

        //     if (qualityParam) {
        //         setOptions('column');
        //         scope.qualityReport.columns.selected = {
        //             name: qualityParam.column,
        //             value: qualityParam.column
        //         };
        //         for (let i = 0; i < scope.qualityReport.rules.options.length; i++) {
        //             if (scope.qualityReport.rules.options[i].name === qualityParam.rule) {
        //                 scope.qualityReport.rules.selected = scope.qualityReport.rules.options[i];
        //                 setRule();
        //                 if (scope.qualityReport.rules.selected.option) {
        //                     if (scope.qualityReport.optionType === 'checklist') {
        //                         scope.qualityReport.rules.selected.selectedOptions = qualityParam.options;
        //                         setOptions('options');
        //                     } else if (scope.qualityReport.optionType === 'input') {
        //                         for (let j = 0; j < qualityParam.options.length; j++) {
        //                             scope.qualityReport.newOption = qualityParam.options[j];
        //                             addOption();
        //                         }
        //                     }
        //                 }
        //                 break;
        //             }
        //         }
        //     }
        //     loadPreview();
        // }

        /** * Helpers */
        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var updateTaskListener, updateSelectedListener;

            updateTaskListener = scope.widgetCtrl.on(
                'update-task',
                function () {
                    getFrameHeaders();
                }
            );

            updateSelectedListener = scope.widgetCtrl.on(
                'update-selected',
                function () {
                    var selected = scope.widgetCtrl.getSelected('selected');

                    if (
                        selected &&
                        selected.length > 0 &&
                        scope.qualityReport.ruleHasBeenSet
                    ) {
                        scope.qualityReport.columns.selected = {
                            name: selected[0].alias,
                            value: selected[0].alias,
                        };
                        scope.qualityReport.setOptions('column');
                    }
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying quality-report...');
                updateTaskListener();
                updateSelectedListener();
            });

            resetPanel();
        }

        initialize();
    }
}
