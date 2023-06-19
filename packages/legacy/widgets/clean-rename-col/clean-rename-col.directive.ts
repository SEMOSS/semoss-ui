'use strict';

import angular from 'angular';

import './clean-rename-col.scss';

export default angular
    .module('app.clean-rename-col.directive', [])
    .directive('cleanRenameCol', cleanRenameCol);

cleanRenameCol.$inject = [];

interface FrameHeader {
    name: string;
    value: string;
}

function cleanRenameCol() {
    renameColLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    renameColCtrl.$inject = [];

    return {
        restrict: 'E',
        template: require('./clean-rename-col.directive.html'),
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        bindToController: {},
        controllerAs: 'renameCol',
        controller: renameColCtrl,
        link: renameColLink,
    };

    function renameColCtrl() {}

    function renameColLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.renameCol.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.renameCol.frameHeaders = [];
        scope.renameCol.selectedCol = '';
        scope.renameCol.generateName = false;
        scope.renameCol.generatedNames = [];
        scope.renameCol.newCol = '';
        scope.renameCol.setNew = setNew;
        scope.renameCol.runQuery = runQuery;
        scope.renameCol.cancel = cancel;
        scope.renameCol.loadPreview = loadPreview;

        /**
         * @name updateFrame
         * @description Set selection to selected column or the first column's alias
         */
        function updateFrame(): void {
            // set the frame headers
            scope.renameCol.frameHeaders = getFrameHeaders();

            // get the col info
            const col = getCol();

            if (col.selectedCol) {
                const isAliasMatch = scope.renameCol.frameHeaders.some(
                    (header) => header.value === col.selectedCol
                );

                if (isAliasMatch) {
                    scope.renameCol.selectedCol = col.selectedCol;
                    scope.renameCol.newCol = col.newCol;
                }
            }
        }

        /**
         * @name getFrameHeaders
         * @desc gets the frame headers
         * @returns {FrameHeader[]}
         */
        function getFrameHeaders(): any {
            let headers = scope.widgetCtrl.getFrame('headers') || [];

            if (scope.renameCol.PIPELINE) {
                // make sure to grab the right headers for this frame
                const srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (srcComponent.headers && srcComponent.headers.length > 0) {
                    headers = srcComponent.headers;
                }
            }

            return headers.map((header) => {
                return {
                    name: String(header.displayName).replace(/_/g, ' '),
                    value: header.alias,
                };
            });
        }

        /**
         * @name getCol
         * @description Get selected column's alias if defined
         * @return {string|boolean} Selected column's alias or false
         */
        function getCol(): { selectedCol: string; newCol: string } {
            // try the pipeline first
            if (scope.renameCol.PIPELINE) {
                const renameColValue = scope.pipelineComponentCtrl.getComponent(
                    'parameters.RENAME_COLUMN.value'
                );
                if (renameColValue) {
                    return {
                        selectedCol: renameColValue.selected,
                        newCol: renameColValue.new,
                    };
                }
            }

            // if its selected get that value
            const selected = scope.widgetCtrl.getSelected('selected');
            if (Array.isArray(selected) && selected[0]) {
                return {
                    selectedCol: selected[0].alias,
                    newCol: selected[0].alias,
                };
            }

            const frameHeader = scope.renameCol.frameHeaders[0];
            if (frameHeader) {
                return {
                    selectedCol: frameHeader.value,
                    newCol: frameHeader.value,
                };
            }

            return {
                selectedCol: '',
                newCol: '',
            };
        }

        /**
         * @name setSelection
         * @desc set the selected column
         * @param alias - alias of the selected value
         */
        function setSelection(alias: string | boolean): void {
            const isAliasMatch = scope.renameCol.frameHeaders.some(
                (header) => header.value === alias
            );

            if (isAliasMatch) {
                scope.renameCol.selectedCol = alias;
                setNew(true);
            }
        }

        /**
         * @name setNew
         * @desc set the new column
         * @param reset - reset the name?
         */
        function setNew(reset: boolean): void {
            if (reset) {
                scope.renameCol.newCol = scope.renameCol.selectedCol;
            }

            if (scope.renameCol.generateName) {
                generateColumnName();
            }
        }

        /**
         * @name getFrame
         * @param  accessor - how do we want to access the frame?
         * @returns frame options
         */
        function getFrame(accessor: string): any {
            if (scope.renameCol.PIPELINE) {
                return scope.pipelineComponentCtrl.getComponent(
                    accessor
                        ? 'parameters.SOURCE.value.' + accessor
                        : 'parameters.SOURCE.value'
                );
            }

            return scope.widgetCtrl.getFrame(accessor);
        }

        /**
         * @name generateColumnName
         * @desc generate the column name from the data
         */
        function generateColumnName(): void {
            scope.renameCol.generatedNames = [];

            if (!scope.renameCol.selectedCol) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please select a column to modify'
                );
                return;
            }

            const frame = getFrame('name');

            scope.renameCol.loading = true;

            // register message to come back to
            const callback = function (response: PixelReturnPayload) {
                let output = response.pixelReturn[0].output,
                    keepSelected = false;

                scope.renameCol.loading = false;

                scope.renameCol.generatedNames = [];
                if (output && output.data && output.data.length > 0) {
                    for (let i = 0, len = output.data.length; i < len; i++) {
                        scope.renameCol.generatedNames.push(output.data[i][0]);

                        if (output.data[i][0] === scope.renameCol.newCol) {
                            keepSelected = true;
                        }
                    }

                    if (!keepSelected) {
                        scope.renameCol.newCol = output.data[0][0];
                    }
                } else {
                    scope.renameCol.newCol = scope.renameCol.selectedCol;
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [
                            frame +
                                ' | SemanticBlending(columns = ["' +
                                scope.renameCol.selectedCol +
                                '"], display = [10], randomVals = [20], genFrame = [false])',
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                callback,
                []
            );
        }

        /**
         * @name buildParams
         * @desc builds params for pipeline
         * @return the params and their values
         */
        function buildParams(): {
            SOURCE: { name: string };
            RENAME_COLUMN?: { selected: string; new: string };
        } {
            const params: any = {
                SOURCE: {
                    name: scope.pipelineComponentCtrl.getComponent(
                        'parameters.SOURCE.value.name'
                    ),
                },
            };

            if (scope.renameCol.selectedCol && scope.renameCol.newCol) {
                params.RENAME_COLUMN = {
                    selected: scope.renameCol.selectedCol,
                    new: scope.renameCol.newCol,
                };
            }

            return params;
        }

        /**
         * @name runQuery
         * @desc actually rename the column
         */
        function runQuery(): void {
            if (!scope.renameCol.selectedCol) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please select a column to modify'
                );
                return;
            }

            if (!scope.renameCol.newCol) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please enter a new column name'
                );
                return;
            }

            if (scope.renameCol.PIPELINE) {
                const components = buildParams();
                scope.pipelineComponentCtrl.executeComponent(components, {});
            } else {
                scope.widgetCtrl.emit('change-selected', {
                    selected: [
                        {
                            alias: scope.renameCol.newCol,
                        },
                    ],
                });

                scope.widgetCtrl.execute([
                    {
                        type: 'variable',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'RenameColumn(column=[' +
                                scope.renameCol.selectedCol +
                                '], newCol=["' +
                                scope.renameCol.newCol +
                                '"])',
                        ],
                        terminal: true,
                    },
                    {
                        type: 'frame',
                        components: [scope.widgetCtrl.getFrame('name')],
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
            }
        }

        /**
         * @name cancel
         * @desc closes pipeline component
         * @return {void}
         */
        function cancel() {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name loadPreview
         * @desc loads preview
         * @return {void}
         */
        function loadPreview() {
            const pixel = buildParams();
            scope.pipelineComponentCtrl.previewComponent(pixel);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            let selectedDataListener: () => {}, updateFrameListener: () => {};

            if (scope.renameCol.PIPELINE) {
                const srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (!srcComponent) {
                    scope.pipelineComponentCtrl.closeComponent();
                    return;
                }

                loadPreview();
            }

            selectedDataListener = scope.widgetCtrl.on(
                'update-selected',
                function () {
                    const selected = scope.widgetCtrl.getSelected('selected');
                    if (selected && selected.length > 0) {
                        setSelection(selected[0].alias);
                    }
                }
            );

            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                updateFrame
            );

            // clean up
            scope.$on('$destroy', function () {
                selectedDataListener();
                updateFrameListener();
            });

            updateFrame();
            // if (scope.renameCol.PIPELINE) {
            //     setPipelineState();
            // }
        }

        initialize();
    }
}
