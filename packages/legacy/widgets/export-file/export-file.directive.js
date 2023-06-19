'use strict';

import './export-file.scss';

export default angular
    .module('app.export-file.directive', [])
    .directive('exportFile', exportFileDirective);

exportFileDirective.$inject = ['semossCoreService'];

function exportFileDirective(semossCoreService) {
    exportFileCtrl.$inject = [];
    exportFileLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        template: require('./export-file.directive.html'),
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'exportFile',
        bindToController: {},
        controller: exportFileCtrl,
        link: exportFileLink,
    };

    function exportFileCtrl() {}

    function exportFileLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.exportFile.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.exportFile.closeExport = closeExport;
        scope.exportFile.runExport = runExport;
        scope.exportFile.delimiter = '';
        scope.exportFile.panelId = '';
        scope.exportFile.types = {
            selected: 'ToCsv',
            list: [
                {
                    display: 'CSV',
                    value: 'ToCsv',
                },
                {
                    display: 'TSV',
                    value: 'ToTsv',
                },
                {
                    display: 'Text',
                    value: 'ToTxt',
                },
                {
                    display: 'Excel',
                    value: 'ToExcel',
                },
            ],
        };

        /**
         * @name getFrameName
         * @param {string} accessor - how do we want to access the frame?
         * @returns {*} frame options
         */
        function getFrame(accessor) {
            if (scope.exportFile.PIPELINE) {
                return scope.pipelineComponentCtrl.getComponent(
                    accessor
                        ? 'parameters.FRAME.value.' + accessor
                        : 'parameters.FRAME.value'
                );
            }

            return scope.widgetCtrl.getFrame(accessor);
        }

        /**
         * @name setFrame
         * @returns {void}
         */
        function setFrame() {
            if (!getFrame('name')) {
                closeExport();
                return;
            }
        }

        /**
         * @name closeExport
         * @desc close the exportFile when the pipeline is closed
         * @returns {void}
         */
        function closeExport() {
            if (scope.exportFile.PIPELINE) {
                scope.pipelineComponentCtrl.closeComponent();
            }
        }

        /**
         * @name runExport
         * @desc export to the selected file type
         * @returns {void}
         */
        function runExport() {
            var active = scope.widgetCtrl.getWidget('active'),
                panelId = scope.widgetCtrl.getWidget('panelId'),
                layout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.' + layout
                ),
                parameters,
                pixel = '';

            if (
                scope.exportFile.types.selected === 'ToTxt' &&
                scope.exportFile.delimiter.length === 0
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Deliminiter is not defined. Please enter a delimiter for the file.'
                );
                return;
            }

            if (panelId) {
                scope.exportFile.panelId = panelId;
            }

            parameters = buildParameters();

            if (scope.exportFile.PIPELINE) {
                scope.pipelineComponentCtrl.executeComponent(parameters, {
                    name: 'Export File',
                });
                return;
            }

            if (keys && keys.length > 0) {
                let layerIndex = 0,
                    sortOptions = scope.widgetCtrl.getWidget(
                        'view.' + active + '.tasks.' + layerIndex + '.sortInfo'
                    ),
                    selectComponent = [],
                    groupComponent = [];

                for (
                    let keyIdx = 0, keyLen = keys.length;
                    keyIdx < keyLen;
                    keyIdx++
                ) {
                    if (keys[keyIdx].math) {
                        // add in the group component
                        if (groupComponent.length === 0) {
                            groupComponent = keys[keyIdx].groupBy;
                        }
                    }

                    // add in the select component
                    if (keys[keyIdx].calculatedBy) {
                        selectComponent.push({
                            calculatedBy: keys[keyIdx].calculatedBy,
                            math: keys[keyIdx].math,
                            alias: keys[keyIdx].alias,
                        });
                    } else {
                        selectComponent.push({
                            alias: keys[keyIdx].alias,
                            selector: keys[keyIdx].header,
                        });
                    }
                }

                pixel = `Frame( frame = [ ${parameters.FRAME.name} ] ) | `;
                pixel += semossCoreService.pixel.build([
                    {
                        type: 'select2',
                        components: [selectComponent],
                    },
                    {
                        type: 'group',
                        components: [groupComponent],
                    },
                    {
                        type: 'sortOptions',
                        components: [sortOptions],
                    },
                ]);

                pixel = pixel.substring(0, pixel.length - 1); // remove last semi-colon since we're not done building pixel yet.
            } else {
                pixel = `Frame( frame = [ ${parameters.FRAME.name} ] ) | QueryAll () | `;
            }
            pixel += ` With(Panel(${scope.widgetCtrl.panelId})) | `;
            pixel += `${parameters.OPERATION};`;

            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [pixel],
                    meta: true,
                    terminal: true,
                },
            ]);
        }

        /**
         * @name buildParameters
         * @desc build the parameters for the current module
         * @returns {object} - map of the paramters to value
         */
        function buildParameters() {
            var selectedType = scope.exportFile.types.selected + '()';
            if (scope.exportFile.types.selected === 'ToTxt') {
                selectedType = `ToTxt(delimiter=["${scope.exportFile.delimiter}"] )`;
            }

            if (
                scope.exportFile.types.selected === 'ToExcel' &&
                scope.exportFile.panelId
            ) {
                selectedType = `ToExcel(panel=[Panel(${scope.exportFile.panelId})])`;
            }

            return {
                FRAME: getFrame(),
                OPERATION: selectedType,
            };
        }

        /**
         * @name setPipelineState
         * @desc set the initial state if from pipeline
         * @returns {void}
         */
        function setPipelineState() {
            let operation = scope.pipelineComponentCtrl.getComponent(
                'parameters.OPERATION.value'
            );

            if (operation) {
                scope.exportFile.types.selected = operation
                    .replace(/\(.*\)/g, '')
                    .trim();
                // ToTxt has a delimiter so we're going to parse that information out via regex...
                // TODO ideally we should be adjusting for it to pass it in as a proper input into the pixel instead of doing <OPERATION>
                if (scope.exportFile.types.selected === 'ToTxt') {
                    let delimiterInput = operation.match(
                            /delimiter\s*=\s*\[\s*"\s*.+\s*"\s*\]/g
                        ),
                        delimiter = '';
                    if (delimiterInput && delimiterInput[0]) {
                        delimiter = delimiterInput[0]
                            .replace(/delimiter\s*=\s*\[\s*"\s*/g, '')
                            .replace(/"\s*\]/g, '')
                            .trim();
                    }
                    // need to extract the delimiter out...
                    scope.exportFile.delimiter = delimiter;
                }
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            setFrame();
            if (scope.exportFile.PIPELINE) {
                setPipelineState();
            }
        }

        initialize();
    }
}
