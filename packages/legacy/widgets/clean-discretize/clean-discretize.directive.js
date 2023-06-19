'use strict';

import './clean-discretize.scss';

export default angular
    .module('app.clean-discretize.directive', [])
    .directive('cleanDiscretize', cleanDiscretize);

cleanDiscretize.$inject = ['semossCoreService'];

function cleanDiscretize(semossCoreService) {
    discretizeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    discretizeCtrl.$inject = [];

    return {
        restrict: 'E',
        template: require('./clean-discretize.directive.html'),
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        bindToController: {},
        controllerAs: 'descretize',
        controller: discretizeCtrl,
        link: discretizeLink,
    };

    function discretizeCtrl() {}

    function discretizeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];
        scope.descretize.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.descretize.descretizeColumn = '';
        scope.descretize.headers;

        // custom bins
        scope.descretize.setCustomBins = false;

        // min/max for defining your own breaks
        scope.descretize.advancedSettingsColumn;
        scope.descretize.minValue;
        scope.descretize.maxValue;
        scope.descretize.getMinMax = getMinMax;
        // add your own set of break values
        scope.descretize.customBreaks = [];
        scope.descretize.paramBreaks = [];
        scope.descretize.newBreakValue;
        scope.descretize.addNewBreak = addNewBreak;
        scope.descretize.removeBreakValue = removeBreakValue;

        // set the labels
        scope.descretize.customRanges = [];
        scope.descretize.customLabels = [];

        // execute
        scope.descretize.execute = execute;

        /**
         * @name resetPanel
         * @desc reset the panel when the data changes
         * @return {void}
         */
        function resetPanel() {
            var headers = scope.widgetCtrl.getFrame('headers') || [],
                keepSelected = false,
                headerIdx,
                headerLen;

            if (scope.descretize.PIPELINE) {
                // make sure to grab the right headers for this frame
                let srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (srcComponent.headers && srcComponent.headers.length > 0) {
                    headers = srcComponent.headers;
                }
            }

            if (scope.descretize.PIPELINE) {
                // make sure to grab the right headers for this frame
                let srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (srcComponent.headers && srcComponent.headers.length > 0) {
                    headers = srcComponent.headers;
                }
            }

            scope.descretize.headers = [];
            for (
                headerIdx = 0, headerLen = headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                if (headers[headerIdx].dataType === 'NUMBER') {
                    scope.descretize.headers.push(headers[headerIdx]);
                    if (
                        headers[headerIdx].alias ===
                        scope.descretize.descretizeColumn
                    ) {
                        keepSelected = true;
                    }
                }
            }

            if (!keepSelected) {
                if (scope.descretize.headers.length > 0) {
                    scope.descretize.descretizeColumn =
                        scope.descretize.headers[0].alias;
                } else {
                    scope.descretize.descretizeColumn = '';
                }
            }
        }

        /**
         * @name getMinMax
         * @desc Calculate the min/max values for the selected column
         * @return {void}
         */
        function getMinMax() {
            // first time init
            // or we have selected a new column
            if (
                !scope.descretize.advancedSettingsColumn ||
                (scope.descretize.setCustomBins &&
                    scope.descretize.advancedSettingsColumn !==
                        scope.descretize.descretizeColumn)
            ) {
                let callback;

                // register message to come back to
                callback = function (response) {
                    scope.descretize.minValue =
                        response.pixelReturn[0].output.data.values[0][0];
                    scope.descretize.maxValue =
                        response.pixelReturn[1].output.data.values[0][0];

                    // set the column used for the advanced settings
                    scope.descretize.advancedSettingsColumn =
                        scope.descretize.descretizeColumn;

                    // redo the defualt bins/labels
                    scope.descretize.customRanges = [];
                    scope.descretize.customLabels = [];

                    var binRangeSyntax = _createBinRangeSyntax(
                        scope.descretize.minValue,
                        scope.descretize.maxValue
                    );
                    scope.descretize.customRanges.push(binRangeSyntax);
                    scope.descretize.customLabels.push(
                        '[' + binRangeSyntax + ']'
                    );
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
                                        math: 'Min',
                                        alias:
                                            'Min_of_' +
                                            scope.descretize.descretizeColumn,
                                        calculatedBy:
                                            scope.descretize.descretizeColumn,
                                    },
                                ],
                            ],
                        },
                        {
                            type: 'collect',
                            components: [-1],
                            terminal: true,
                        },
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
                                            scope.descretize.descretizeColumn,
                                        calculatedBy:
                                            scope.descretize.descretizeColumn,
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
        }

        /**
         * @name addNewBreak
         * @desc Determine if we can add a new break value
         * @return {void}
         */
        function addNewBreak() {
            var numBreaks;

            // make sure value is defined
            // do not use !scope.descretize.newBreakValue
            // if value is 0, js thinks it's a boolean
            if (scope.descretize.newBreakValue === undefined) {
                scope.widgetCtrl.alert('error', 'No value defined');
                return;
            }

            // make sure value is larger than the last added break value or the smallest value
            numBreaks = scope.descretize.customBreaks.length;
            if (numBreaks === 0) {
                if (
                    scope.descretize.newBreakValue <= scope.descretize.minValue
                ) {
                    scope.widgetCtrl.alert(
                        'error',
                        'Value entered is smaller or equal to the min value'
                    );
                    return;
                }
            } else if (
                scope.descretize.newBreakValue <=
                scope.descretize.customBreaks[numBreaks - 1]
            ) {
                scope.widgetCtrl.alert(
                    'error',
                    'Value entered is smaller than or equal to the last value added'
                );
                return;
            }

            // make sure value is less than the max value
            if (scope.descretize.newBreakValue >= scope.descretize.maxValue) {
                scope.widgetCtrl.alert(
                    'error',
                    'Value larger than or equal to the max value'
                );
                return;
            }

            // we passed the checks
            // can now add it to the list of values
            scope.descretize.customBreaks.push(scope.descretize.newBreakValue);
            _recalcBinLabels(true);
        }

        /**
         * @name removeBreakValue
         * @param {number} breakValue the value to remove
         * @desc Remove a break value
         * @return {void}
         */
        function removeBreakValue(breakValue) {
            var index = scope.descretize.customBreaks.indexOf(breakValue);
            if (index === -1) {
                scope.widgetCtrl.alert(
                    'error',
                    'Could not find value ' + breakValue + ' to remove'
                );
            }
            scope.descretize.customBreaks.splice(index, 1);
            // need to remove the range and the labels as well
            // just need everything to match by index
            scope.descretize.customRanges.splice(index, 1);
            scope.descretize.customLabels.splice(index, 1);

            // recalculate the bin labels
            _recalcBinLabels(false);
        }

        /**
         * @name _getValuesWithMinMax
         * @desc Get an ordered list of the bin portions
         * @return {Array} the list with the ordered values
         */
        function _getValuesWithMinMax() {
            var values = [],
                numBreaks,
                i;

            // add the min value
            values.push(scope.descretize.minValue);

            // loop through and add the user defined breaks
            numBreaks = scope.descretize.customBreaks.length;
            for (i = 0; i < numBreaks; i++) {
                values.push(scope.descretize.customBreaks[i]);
            }

            // add the max value
            values.push(scope.descretize.maxValue);
            return values;
        }

        /**
         * @name _recalcBinLabels
         * @desc Recalculate the defualt bin labels
         * @param{boolean} addNewBin are we adding a new bin at the end of our current values
         * @return {void}
         */
        function _recalcBinLabels(addNewBin) {
            var binEndPoints, numEndPoints, binRangeSyntax, i;

            // we need to update the bin labels
            // we will need to auto adjust the default bins
            binEndPoints = _getValuesWithMinMax();
            numEndPoints = binEndPoints.length;
            for (i = 0; i < numEndPoints - 1; i++) {
                binRangeSyntax = _createBinRangeSyntax(
                    binEndPoints[i],
                    binEndPoints[i + 1]
                );

                // do we need to update the label?
                // depends on if it was user modified or not
                // if we are at the end (numEndPoints - 2) -> we need to push
                // since we always add bins in order
                // otherwise, see if the syntax matches our default and set that
                if (addNewBin && i === numEndPoints - 2) {
                    scope.descretize.customRanges.push(binRangeSyntax);
                    scope.descretize.customLabels.push(
                        '(' + binRangeSyntax + ']'
                    );
                } else {
                    // set the range value
                    scope.descretize.customRanges[i] = binRangeSyntax;
                    // now determine if we shoudl update the label value
                    if (
                        scope.descretize.customLabels[i].match(
                            /(\[|\()(\d+\.*\d*)\s*\-\s*(\d+\.*\d*)+(\]|\))/g
                        )
                    ) {
                        // here we need to modify the defualt bin label that was given
                        if (i === 0) {
                            scope.descretize.customLabels[i] =
                                '[' + binRangeSyntax + ']';
                        } else {
                            scope.descretize.customLabels[i] =
                                '(' + binRangeSyntax + ']';
                        }
                    }
                }
            }
        }

        /**
         * Get the bin range
         * @param {*} lowerBound the lower bound of the bin
         * @param {*} upperBound the upper bound of the bin
         * @returns {string} the string representation of the bin range
         */
        function _createBinRangeSyntax(lowerBound, upperBound) {
            return lowerBound + ' - ' + upperBound;
        }

        /**
         * @name execute
         * @desc runs the query using all the defined values
         * @return {void}
         */
        function execute() {
            var pixel = scope.widgetCtrl.getFrame('name') + ' | ',
                numBreaks,
                numLabels,
                i;
            if (scope.descretize.PIPELINE) {
                let components = buildParams();
                scope.pipelineComponentCtrl.executeComponent(components, {});
            } else {
                pixel +=
                    'Discretize({"column":"' +
                    scope.descretize.descretizeColumn +
                    '"';

                if (scope.descretize.setCustomBins) {
                    pixel += ',"breaks":"(';
                    pixel += scope.descretize.minValue;
                    numBreaks = scope.descretize.customBreaks.length;
                    for (i = 0; i < numBreaks; i++) {
                        pixel += ',' + scope.descretize.customBreaks[i];
                    }
                    pixel += ',' + scope.descretize.maxValue + ')"';

                    numLabels = scope.descretize.customLabels.length;
                    pixel += ',"labels":"(';
                    for (i = 0; i < numLabels; i++) {
                        if (scope.descretize.customLabels[i].trim() === '') {
                            scope.widgetCtrl.alert(
                                'error',
                                'Must have a label defined for each bin'
                            );
                        }
                        if (i === 0) {
                            pixel += scope.descretize.customLabels[i];
                        } else {
                            pixel += ',' + scope.descretize.customLabels[i];
                        }
                    }
                    pixel += ')"';
                }

                // close off the expression
                pixel += '})';

                scope.widgetCtrl.execute([
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                    {
                        type: 'frame',
                        components: [scope.widgetCtrl.getFrame('name')],
                        terminal: false,
                    },
                    {
                        type: 'queryAll',
                        components: [],
                        terminal: false,
                    },
                    {
                        type: 'autoTaskOptions',
                        components: [scope.widgetCtrl.panelId, 'Grid'],
                        terminal: false,
                    },
                    {
                        type: 'collect',
                        components: [semossCoreService.getOptions('limit')],
                        terminal: true,
                    },
                ]);
            }
        }

        /**
         * @name buildParams
         * @desc build params for pipeline
         * @returns {*} pipeline params
         */
        function buildParams() {
            let numBreaks,
                i,
                params = {
                    SOURCE: {
                        name: scope.pipelineComponentCtrl.getComponent(
                            'parameters.SOURCE.value.name'
                        ),
                    },
                };

            if (
                scope.descretize.setCustomBins &&
                scope.descretize.paramBreaks.length === 0
            ) {
                // paramBreaks have not been set yet
                scope.descretize.paramBreaks.push(scope.descretize.minValue);
                numBreaks = scope.descretize.customBreaks.length;
                for (i = 0; i < numBreaks; i++) {
                    scope.descretize.paramBreaks.push(
                        scope.descretize.customBreaks[i]
                    );
                }
                scope.descretize.paramBreaks.push(scope.descretize.maxValue);
            }

            params.DISCRETIZE = {
                column: scope.descretize.descretizeColumn,
                breaks: scope.descretize.setCustomBins
                    ? scope.descretize.paramBreaks
                    : [],
                labels: scope.descretize.setCustomBins
                    ? scope.descretize.customLabels
                    : [],
            };

            return params;
        }

        /**
         * @name loadPreview
         * @desc loads preview
         * @return {void}
         */
        function loadPreview() {
            var pixel;

            pixel = buildParams();
            scope.pipelineComponentCtrl.previewComponent(pixel);
        }

        /**
         * @name setPipelineState
         * @desc sets the pipeline existing values
         * @returns {void}
         */
        function setPipelineState() {
            let discretizeParam = scope.pipelineComponentCtrl.getComponent(
                    'parameters.DISCRETIZE.value'
                ),
                srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );

            if (!srcComponent) {
                scope.pipelineComponentCtrl.closeComponent();
                return;
            }

            if (discretizeParam) {
                if (scope.descretize.headers) {
                    // make sure that the selected column is an option that exists in the column dropdown
                    let headerIdx, headerLen;
                    for (
                        headerIdx = 0,
                            headerLen = scope.descretize.headers.length;
                        headerIdx < headerLen;
                        headerIdx++
                    ) {
                        if (
                            scope.descretize.headers[headerIdx].alias ===
                            discretizeParam.column
                        ) {
                            scope.descretize.descretizeColumn =
                                discretizeParam.column;
                            break;
                        }
                    }
                } else {
                    scope.descretize.descretizeColumn = discretizeParam.column;
                }
                scope.descretize.setCustomBins =
                    discretizeParam.breaks.length > 0;
                if (scope.descretize.setCustomBins) {
                    scope.descretize.paramBreaks = discretizeParam.breaks;
                    scope.descretize.customBreaks =
                        discretizeParam.breaks.slice(1, -1); // cut off the min and max values
                    scope.descretize.customLabels = discretizeParam.labels;
                    scope.descretize.minValue = discretizeParam.breaks[0];
                    scope.descretize.maxValue =
                        discretizeParam.breaks[
                            discretizeParam.breaks.length - 1
                        ];
                    _recalcBinLabels(false);
                }
            }
            loadPreview();
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var updateFrameListener;

            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );

            scope.$on('$destroy', function () {
                updateFrameListener();
            });

            resetPanel();

            if (scope.descretize.PIPELINE) {
                setPipelineState();
            }
        }

        initialize();
    }
}
