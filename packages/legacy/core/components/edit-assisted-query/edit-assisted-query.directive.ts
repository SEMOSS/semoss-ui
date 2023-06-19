'use strict';

import angular from 'angular';

import './edit-assisted-query.scss';
import Utility from '../../utility/utility';
import PixelASTLeaf from '../../../widgets/pipeline/PixelASTLeaf';

import Pixel from '../../store/pixel/pixel';

export default angular
    .module('app.edit-assisted-query.directive', [])
    .directive('editAssistedQuery', editAssistedQueryDirective);

editAssistedQueryDirective.$inject = [
    'CONFIG',
    'messageService',
    'storeService',
    'workbookService',
    'appService',
    'monolithService',
    '$q',
];

function editAssistedQueryDirective(
    CONFIG,
    messageService,
    storeService,
    workbookService,
    appService,
    monolithService,
    $q
) {
    editAssistedQueryCtrl.$inject = [];
    editAssistedQueryLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./edit-assisted-query.directive.html'),
        scope: {},
        controllerAs: 'editAssistedQuery',
        bindToController: {
            insightId: '=',
            payload: '=',
            close: '&?',
        },
        controller: editAssistedQueryCtrl,
        link: editAssistedQueryLink,
    };

    function editAssistedQueryCtrl() {}

    function editAssistedQueryLink(scope) {
        // set it
        scope.editAssistedQuery.open = true;
        scope.editAssistedQuery.disableClick = true;
        scope.editAssistedQuery.newInsight = !scope.editAssistedQuery.insightId;

        // operation type
        scope.editAssistedQuery.saveType = 'new';

        // selected frame details
        scope.editAssistedQuery.options = [];
        scope.editAssistedQuery.selected = '';
        scope.editAssistedQuery.selectedFrame = '';
        scope.editAssistedQuery.seletedImg = '';
        scope.editAssistedQuery.seletedDB = '';
        scope.editAssistedQuery.displayText = '';

        // new frame details
        const defaultNewFrameName = 'External_FRAME' + Utility.random();
        scope.editAssistedQuery.newFrameName = { name: defaultNewFrameName };
        scope.editAssistedQuery.duplicateFrameName = false;
        scope.editAssistedQuery.incorrectName = false;

        // update frame details
        scope.editAssistedQuery.isFrameSelected = true;

        // functions
        scope.editAssistedQuery.onSelectType = onSelectType;
        scope.editAssistedQuery.onNewType = onNewType;
        scope.editAssistedQuery.onFrameNameSelect = onFrameNameSelect;
        scope.editAssistedQuery.confirm = confirm;

        /**
         * reset error messages on chnage of type
         */
        function onSelectType() {
            scope.editAssistedQuery.duplicateFrameName = false;
            scope.editAssistedQuery.incorrectName = false;
            scope.editAssistedQuery.isFrameSelected = true;
        }

        /**
         * saves entered frame name
         * @param event entered frame details
         */
        function onNewType(event) {
            scope.editAssistedQuery.newFrameName.name = getCleanName(
                event.name
            );
            scope.editAssistedQuery.duplicateFrameName = false;
            scope.editAssistedQuery.incorrectName = false;
        }

        /**
         * removes unnecessary characters from frame name
         * @param frameName entered frame name
         * @returns updated frame name
         */
        function getCleanName(frameName) {
            frameName = frameName.replace(/  +/g, ' ');
            frameName = frameName.replace(/ _/g, '_');
            frameName = frameName.replace(/_ /g, '_');
            frameName = frameName.replace(/__+/g, '_');
            return frameName.replace(new RegExp('[^a-zA-Z0-9_ ]', 'g'), '');
        }

        /**
         * saves the update frame selection
         * @param event selected frame details
         */
        function onFrameNameSelect(event) {
            scope.editAssistedQuery.selectedFrame = event.frameName;
            scope.editAssistedQuery.seletedImg = event.databaseImg;
            scope.editAssistedQuery.seletedDB = event.databaseName;
            scope.editAssistedQuery.displayText =
                event.databaseName + ' > ' + event.frameName;
            scope.editAssistedQuery.isFrameSelected = true;
        }

        /**
         * @description validates the selections and returns to external service
         * @returns returns the selection details
         */
        function confirm() {
            // calling getFrames again to get the updated frame list before creating/updating frame
            getFrames((frameDetailsList) => {
                scope.editAssistedQuery.options = frameDetailsList;
                let selectedFrame = '';
                if (scope.editAssistedQuery.saveType == 'new') {
                    selectedFrame = scope.editAssistedQuery.newFrameName.name;
                } else if (scope.editAssistedQuery.saveType == 'edit') {
                    selectedFrame = scope.editAssistedQuery.selectedFrame;
                }

                scope.editAssistedQuery.duplicateFrameName = false;
                scope.editAssistedQuery.incorrectName = false;
                scope.editAssistedQuery.isFrameSelected = false;

                selectedFrame = selectedFrame
                    .replaceAll('_', ' ')
                    .trim()
                    .replaceAll(' ', '_');

                scope.editAssistedQuery.options.forEach((frameDetails) => {
                    const frameName = String(frameDetails.frameName)
                        .replaceAll('_', ' ')
                        .trim()
                        .replaceAll(' ', '_');
                    if (selectedFrame == frameName) {
                        scope.editAssistedQuery.duplicateFrameName = true;
                        scope.editAssistedQuery.isFrameSelected = true;
                    }
                });

                // check if first character is an alphabet
                if (
                    !selectedFrame.match(/^[A-Z]/i) &&
                    scope.editAssistedQuery.saveType == 'new'
                ) {
                    scope.editAssistedQuery.incorrectName = true;
                }

                if (
                    (scope.editAssistedQuery.duplicateFrameName ||
                        scope.editAssistedQuery.incorrectName) &&
                    scope.editAssistedQuery.saveType == 'new'
                ) {
                    return;
                }

                if (
                    !scope.editAssistedQuery.isFrameSelected &&
                    scope.editAssistedQuery.saveType == 'edit'
                ) {
                    return;
                }

                getPixelId(
                    selectedFrame,
                    scope.editAssistedQuery.saveType
                ).then((pixelId) => {
                    // if external frame exists then append to the existing insight
                    if (!scope.editAssistedQuery.newInsight) {
                        executeAppendSql(selectedFrame, pixelId);
                    } else {
                        executeSql(selectedFrame);
                    }

                    // TODO: Wait to close?
                    scope.editAssistedQuery.close();
                });
            });
        }

        /**
         * @name executeAppendSql
         * @param payload the app id and the sql to run
         * @desc this will execute pixels to append the insight, run the sql on the specified app id, then add to the resulting pipeline
         * @returns {void}
         */
        function executeAppendSql(selectedFrame, pixelId): void {
            const components: any = [];

            let frameName;
            if (selectedFrame) {
                frameName = selectedFrame;
            } else {
                frameName = 'External_FRAME' + Utility.random();
            }

            let createFramePixel = Pixel.build([
                {
                    type: 'CREATE_FRAME',
                    components: [
                        {
                            name: frameName,
                            type: CONFIG.defaultFrameType,
                            override: true,
                        },
                    ],
                    terminal: true,
                },
            ]);

            let finalRecipe = '',
                insightId = scope.editAssistedQuery.insightId,
                workbook: any = workbookService.getWorkbook(insightId),
                worksheet: any = workbookService.getWorksheet(
                    insightId,
                    workbook.worksheet
                ),
                panelId: string = worksheet.selected.panel,
                widgetId = '',
                widget: any = {};

            if (typeof panelId !== 'undefined') {
                widgetId = worksheet.panels[panelId].widgetId;
                widget = storeService.getWidget(widgetId);
            } else {
                executeSql(frameName);
                // no panel...so we will just open a new insight instead
                return;
            }

            // trim the last character
            createFramePixel = createFramePixel.trim().slice(0, -1); // -1 --> negative means remove from the end

            finalRecipe += Pixel.build([
                // append on the pixel to run and then import the sql data
                {
                    type: 'database',
                    components: [scope.editAssistedQuery.payload.appId],
                },
                {
                    type: 'query',
                    components: [scope.editAssistedQuery.payload.sql],
                },
                {
                    type: 'import',
                    components: [createFramePixel],
                    terminal: true,
                },
            ]);

            if (scope.editAssistedQuery.saveType == 'edit') {
                if (pixelId) {
                    const query = Pixel.build([
                        {
                            type: 'editInsightRecipeStep',
                            components: [pixelId, finalRecipe],
                            terminal: true,
                            meta: true,
                        },
                    ]);

                    components.push({
                        type: 'Pixel',
                        components: [query],
                        terminal: true,
                    });
                } else {
                    console.warn('Pixel ID not found');
                }
            } else {
                components.push({
                    type: 'Pixel',
                    components: [finalRecipe],
                    terminal: true,
                });
            }

            if (widget.active !== 'pipeline') {
                components.push(
                    {
                        type: 'panel',
                        components: [panelId],
                    },
                    {
                        type: 'setPanelView', // default view to pipeline when appending an insight
                        components: ['pipeline'],
                        terminal: true,
                    }
                );
            }
            if (scope.editAssistedQuery.payload.exportVariables) {
                components.push({
                    type: 'addPreDefinedParam',
                    components: [
                        scope.editAssistedQuery.payload.exportVariables,
                        scope.editAssistedQuery.payload.appId,
                    ],
                    terminal: true,
                });
            }

            // TODO need to rearrange the pipeline components to auto arrange the blocks??? or maybe pipeline will take care of it itself when no position given
            // if active view is not pipeline, we will switch to pipeline view
            messageService.emit('execute-pixel', {
                insightID: insightId,
                commandList: components,
            });
        }

        /**
         * @name executeSql
         * @param payload the app id and the sql to run
         * @desc this will execute pixels to open a new insight, run the sql on the specified app id, then paint the resulting grid
         * @returns {void}
         */
        function executeSql(frameName): void {
            let components: any = [],
                finalRecipe =
                    'AddPanel(panel=[0] , sheet=["0"]);Panel(0)|AddPanelConfig(config=[{"type":"golden"}]);Panel(0)|AddPanelEvents({"onSingleClick":{"Unfilter":[{"panel":"","query":"<encode>(<Frame> | UnfilterFrame(<SelectedColumn>));</encode>","options":{},"refresh":false,"default":true,"disabledVisuals":["Grid","Sunburst"],"disabled":false}]},"onBrush":{"Filter":[{"panel":"","query":"<encode>if((IsEmpty(<SelectedValues>)),(<Frame> | UnfilterFrame(<SelectedColumn>)), (<Frame> | SetFrameFilter(<SelectedColumn>==<SelectedValues>)));</encode>","options":{},"refresh":false,"default":true,"disabled":false}]}});Panel(0)|RetrievePanelEvents();Panel(0)|SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>");',
                createFramePixel = Pixel.build([
                    {
                        type: 'CREATE_FRAME',
                        components: [
                            {
                                name: frameName,
                                type: CONFIG.defaultFrameType,
                                override: true,
                            },
                        ],
                        terminal: true,
                    },
                ]),
                insightId = storeService.get('queryInsightID');

            // trim the last character
            createFramePixel = createFramePixel.trim().slice(0, -1); // -1 --> negative means remove from the end

            finalRecipe += Pixel.build([
                // append on the pixel to run and then import the sql data
                {
                    type: 'database',
                    components: [scope.editAssistedQuery.payload.appId],
                },
                {
                    type: 'query',
                    components: [scope.editAssistedQuery.payload.sql],
                },
                {
                    type: 'import',
                    components: [createFramePixel],
                    terminal: true,
                },
                // then QueryAll the frame and auto visualize grid
                {
                    type: 'frame',
                    components: [frameName],
                },
                {
                    type: 'queryAll',
                    components: [],
                },
                {
                    type: 'autoTaskOptions',
                    components: [0, 'Grid'],
                },
                {
                    type: 'collect',
                    components: [2000],
                    terminal: true,
                },
                {
                    type: 'addPreDefinedParam',
                    components: [
                        scope.editAssistedQuery.payload.exportVariables,
                        scope.editAssistedQuery.payload.appId,
                    ],
                    terminal: true,
                },
            ]);
            // we need to open a new insight, run the sql on the app in the new insight, run the task to paint the grid.
            components.push({
                meta: true,
                type: 'openEmptyInsight',
                components: [finalRecipe],
                terminal: true,
            });
            messageService.emit('execute-pixel', {
                insightID: insightId,
                commandList: components,
            });
        }

        /**
         * @description returns the frame details of all the frames in the insight
         * @param callback callback function
         */
        function getFrames(callback): any {
            getDatabase((databaseList) => {
                const details = storeService.get('shared'),
                    framesNames: any = [];

                if (
                    scope.editAssistedQuery.insightId &&
                    details[scope.editAssistedQuery.insightId]
                ) {
                    const frames =
                        details[scope.editAssistedQuery.insightId].frames;
                    for (const frame in frames) {
                        if (frames.hasOwnProperty(frame)) {
                            let appID = '';
                            headerLoop: for (const header in frames[frame][
                                'headers'
                            ]) {
                                for (const qs in frames[frame]['headers'][
                                    header
                                ]['qsName']) {
                                    // Searching for valid app id
                                    if (databaseList[qs]) {
                                        appID = qs;
                                        break headerLoop;
                                    }
                                }
                            }

                            // checking if app id is valid(if a database exist with respective app id)
                            if (appID && databaseList[appID]) {
                                framesNames.push({
                                    frameName: frames[frame]['name'],
                                    databaseName: databaseList[appID].name,
                                    databaseImg: databaseList[appID].img,
                                });
                            }
                        }
                    }
                }

                callback(framesNames);
            });
        }

        /**
         * @description returns the list of existing databases and their app ids
         * @param callback callback function
         */
        function getDatabase(callback): any {
            const message = Utility.random('message');

            messageService.once(message, (response: PixelReturnPayload) => {
                const output: any = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    callback([]);
                    return;
                }

                const databaseList = {};
                for (const database in output) {
                    databaseList[output[database].app_id] = {
                        name: output[database].app_name,
                        img: appService.generateDatabaseImageURL(
                            output[database].app_id
                        ),
                    };
                }

                callback(databaseList);
            });

            messageService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'getDatabaseList',
                        components: [],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @description return the pixel id of the selected frame if exists
         * @param frameName Name of the frame for which the pixel ID is required
         * @param saveType variable to save operation type(create frame or update frame)
         * @returns pixel of the frame
         */
        function getPixelId(frameName, saveType) {
            const deferred = $q.defer();

            let pixelId = '';
            if (!scope.editAssistedQuery.insightId || saveType == 'new') {
                deferred.resolve(pixelId);
            } else {
                monolithService
                    .getPipeline(scope.editAssistedQuery.insightId)
                    .then((response) => {
                        const start = 0;
                        const nodes: PixelASTLeaf[][] = response.pixelParsing;
                        const idMapping = response.idMapping;

                        nodeLoop: for (
                            let nodeIdx = start, nodeLen = nodes.length;
                            nodeIdx < nodeLen;
                            nodeIdx++
                        ) {
                            const node = nodes[nodeIdx];

                            for (
                                let childIndex = 0;
                                childIndex < node.length;
                                childIndex++
                            ) {
                                if (
                                    node[childIndex] &&
                                    node[childIndex].opName == 'Import' &&
                                    node[childIndex].nounInputs &&
                                    node[childIndex].opString.includes(
                                        'CreateFrame'
                                    )
                                ) {
                                    const nounInputs =
                                        node[childIndex].nounInputs;
                                    const frameDetails = nounInputs.frame;
                                    if (
                                        frameDetails &&
                                        frameDetails[0].value.alias ===
                                            frameName
                                    ) {
                                        pixelId = idMapping[nodeIdx].id;
                                        break nodeLoop;
                                    }
                                }
                            }
                        }

                        deferred.resolve(pixelId);
                    });
            }

            return deferred.promise;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            getFrames((frameDetails) => {
                scope.editAssistedQuery.options = frameDetails;
            });
        }
        initialize();
    }
}
