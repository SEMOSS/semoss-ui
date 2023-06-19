'use strict';

import { FILES, PREVIEW_LIMIT } from '@/core/constants.js';

import '@/widget-resources/css/dropzone.css';

import './pipeline-file.scss';

export default angular
    .module('app.pipeline.pipeline-file', [])
    .directive('pipelineFile', pipelineFileDirective);

pipelineFileDirective.$inject = [
    '$timeout',
    'monolithService',
    'semossCoreService',
    'CONFIG',
];

function pipelineFileDirective(
    $timeout,
    monolithService,
    semossCoreService,
    CONFIG
) {
    pipelineFileCtrl.$inject = [];
    pipelineFileLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline-file.directive.html'),
        scope: {},
        require: ['^widget', '^pipelineComponent'],
        controller: pipelineFileCtrl,
        controllerAs: 'pipelineFile',
        bindToController: {
            fileType: '@',
        },
        link: pipelineFileLink,
    };

    function pipelineFileCtrl() {}

    function pipelineFileLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.widgetCtrl = ctrl[0];
        scope.pipelineFile.qsComponent;

        scope.pipelineFile.foundInRange = false;
        scope.pipelineFile.cleanHeaders = true;

        scope.pipelineFile.fileTypes = [];
        scope.pipelineFile.customFrameName = {
            name: '',
            valid: true,
            message: '',
        };

        scope.pipelineFile.step = 1; // step of data
        scope.pipelineFile.pasteData = ''; // pasted in data
        scope.pipelineFile.dataLoaded = false;
        scope.pipelineFile.isFormattingTypes = false;
        scope.pipelineFile.missingFormats = []; // error handling for missing formatting
        scope.pipelineFile.customFormat = '';
        scope.pipelineFile.headerData = [];
        scope.pipelineFile.uniqueFileKey = {};
        scope.pipelineFile.allHeaders = [];
        scope.pipelineFile.parsedFiles = [];
        scope.pipelineFile.headerBeingFormatted = {};
        scope.pipelineFile.sheetBeingFormatted = {};
        scope.pipelineFile.types =
            semossCoreService.visualization.getDefaultOptions();
        scope.pipelineFile.formatOptions = {
            dimension: '',
            dimensionType: '',
            model: '',
            type: 'Default',
            delimiter: 'Default',
            prepend: '',
            append: '',
            round: '',
            appliedString: '',
            layout: '',
            date: 'Default',
        };
        scope.pipelineFile.customOptions =
            semossCoreService.visualization.getCustomOptions();
        scope.pipelineFile.locations = [
            {
                display: 'Computer',
                value: 'COMPUTER',
            },
            {
                display: 'SEMOSS Assets',
                value: 'SEMOSS',
            },
        ];
        scope.pipelineFile.locationType = 'COMPUTER';
        scope.pipelineFile.assetFile = null;

        scope.pipelineFile.updateFrame = updateFrame;
        scope.pipelineFile.checkFileExtension = checkFileExtension;
        scope.pipelineFile.checkFileSize = checkFileSize;
        scope.pipelineFile.parseData = parseData;
        scope.pipelineFile.cancel = cancel;
        scope.pipelineFile.changeHeader = changeHeader;
        scope.pipelineFile.load = load;
        scope.pipelineFile.checkPreview = checkPreview;
        scope.pipelineFile.updateSelectedSheet = updateSelectedSheet;
        scope.pipelineFile.updateFileType = updateFileType;
        scope.pipelineFile.formatHeaderType = formatHeaderType;
        scope.pipelineFile.updateCustom = updateCustom;
        scope.pipelineFile.applyTypeChange = applyTypeChange;
        scope.pipelineFile.selectRange = selectRange;
        scope.pipelineFile.previewCustomRange = previewCustomRange;
        scope.pipelineFile.setFile = setFile;
        scope.pipelineFile.validateFrameName = validateFrameName;
        scope.pipelineFile.onFileAdd = onFileAdd;
        scope.pipelineFile.removeFile = removeFile;
        scope.pipelineFile.removeQsFile = removeQsFile;

        /** * Part 1 ***/
        /**
         * @name setFile
         * @desc Sets the file choosen from the asset browser
         * @param {*} file - file object from asset browser
         * @return {void}
         */
        function setFile(file) {
            // TO DO: will eventually have to change the file path for User and App spaces
            scope.pipelineFile.assetFile = {
                path: 'INSIGHT_FOLDER\\' + file.path,
                name: file.name,
            };
        }
        /**
         * @name setFrameData
         * @desc set the frame type
         * @return {void}
         */
        function setFrameData() {
            scope.pipelineFile.frameType =
                scope.widgetCtrl.getOptions('initialFrameType');
            if (CONFIG.defaultFrameType === 'NATIVE') {
                // auto switch them to Grid because NATIVE frame does not work with files
                scope.pipelineFile.frameType = 'GRID';
            }
        }

        /**
         * @name updateFrame
         * @param {string} type - type
         * @desc update the frame type
         * @return {void}
         */
        function updateFrame(type) {
            scope.widgetCtrl.setOptions('initialFrameType', type);
        }

        /** * Paste ***/
        /** * File ***/
        /**
         * @name checkFileExtension
         * @param {file} file - flow file
         * @desc checks file extension (must be csv) and makes sure there is only one file added
         * @returns {boolean} - checks wether it is an  file
         */
        function checkFileExtension(file) {
            var fileExtension = getFileExtension(file);

            if (fileExtension) {
                scope.pipelineFile.fileType = fileExtension;
                return true;
            }

            scope.widgetCtrl.alert(
                'error',
                'File must be excel (.xls, .xlsx, or .xlsm), .csv, .tsv, or .txt'
            );
            return false;
        }

        /**
         * @name checkFileSize
         * @param {file} file - flow file
         * @desc checks file size and makes sure it doesn't exceed the limit
         * @returns {boolean} - checks wether it is an  file
         */
        function checkFileSize(file) {
            if (
                !CONFIG['file-limit'] ||
                file.size / 1024 / 1024 <= CONFIG['file-limit']
            ) {
                return true;
            }

            scope.widgetCtrl.alert(
                'error',
                'File must be under ' + CONFIG['file-limit'] + 'MB.'
            );
            return false;
        }

        /**
         * @name removeQsFile
         * @desc when editing existing pipeline-file and replacing with new file, we need to remove qsComponent file
         * @returns {void}
         */
        function removeQsFile() {
            if (
                scope.pipelineFile.fileData.files[0] &&
                scope.pipelineFile.qsComponent
            ) {
                scope.pipelineFile.fileData.files = [];
                scope.pipelineFile.qsComponent = false;
            }
        }

        /**
         * @name onFileAdd
         * @desc called when a file is drag and dropped
         * @returns {void}
         */
        function onFileAdd() {
            if (scope.pipelineFile.fileData.files[0]) {
                scope.pipelineFile.customFrameName.name =
                    scope.pipelineComponentCtrl.createFrameName(
                        scope.pipelineFile.fileData.files[0].name
                    );
                validateFrameName();
            }
        }

        /**
         * @name getFileExtension
         * @param {file|string} file - flow file
         * @desc gets the file extension type
         * @returns {*} - gets the file type from the extension
         */
        function getFileExtension(file) {
            var fileExtension;

            if (!file) {
                return 'not a file';
            }
            if (typeof file === 'string') {
                fileExtension = file.substr(file.lastIndexOf('.') + 1);
            } else if (file.hasOwnProperty('placeholder') && file.placeholder) {
                fileExtension = file.name.substr(
                    file.name.lastIndexOf('.') + 1
                );
            } else {
                fileExtension = file.getExtension();
            }

            if (fileExtension) {
                fileExtension = fileExtension.toLowerCase();
            }

            if (fileExtension === 'csv') {
                return 'csv';
            } else if (
                fileExtension === 'xlsx' ||
                fileExtension === 'xlsm' ||
                fileExtension === 'xls'
            ) {
                return 'excel';
            } else if (fileExtension === 'tsv') {
                return 'tsv';
            } else if (fileExtension === 'txt') {
                return 'txt';
            }

            return false;
        }

        /**
         * @name parseFile
         * @desc calls function to get header information from BE
         * @param {string} type the file type
         * @param {string} delim delimiter
         * @returns {void}
         */
        function parseFile(type, delim) {
            var pixelComponents,
                parsedFiles = [],
                newFile = {},
                validQsComponent = false,
                callback;

            // when initially uploaded a file then switching selection to an asset file that is different,
            // the qsComponent will be for the originally uploaded file not the asset file
            if (scope.pipelineFile.qsComponent) {
                if (
                    !scope.pipelineFile.assetFile ||
                    (scope.pipelineFile.assetFile &&
                        scope.pipelineFile.qsComponent.fileName ===
                            scope.pipelineFile.assetFile.name)
                ) {
                    validQsComponent = true;
                } else {
                    validQsComponent = false;
                }
            }
            // build parsed file from the qs returned by the BE if the file has already been uploaded
            if (validQsComponent) {
                const qs = scope.pipelineFile.qsComponent;
                if (type === 'csv' || type === 'txt' || type === 'tsv') {
                    newFile = {
                        additionalDataTypes: qs.additionalTypes,
                        name: qs.fileName,
                        fileLocation: qs.filePath,
                        headerDataTypes: qs.columnTypes,
                        headerModifications: {},
                        userHeaderModifications: qs.newHeaderNames,
                        headers: Object.keys(qs.columnTypes),
                    };

                    scope.pipelineFile.parsedFiles.push(newFile);
                } else if (type === 'excel') {
                    newFile = {
                        additionalDataTypes: qs.additionalTypes,
                        fileLocation: qs.filePath,
                        headerModifications: {},
                        userHeaderModifications: qs.newHeaderNames,
                        name: qs.fileName,
                        sheets: {},
                    };
                    newFile.sheets[qs.sheetName] = {};
                    newFile.sheets[qs.sheetName][qs.sheetRange] = {};
                    newFile.sheets[qs.sheetName][qs.sheetRange] = {
                        additionalDataTypes: qs.additionalTypes,
                        cleanHeaders: Object.keys(qs.columnTypes),
                        dataTypes: qs.columnTypes,
                        headers: Object.keys(qs.columnTypes),
                    };

                    scope.pipelineFile.parsedFiles.push(newFile);
                }
            }

            callback = function (response) {
                var returnId,
                    idx,
                    j,
                    sheet,
                    range,
                    cleanHeader,
                    originalHeader,
                    qsNewHeaders = [],
                    originalHeaders = [],
                    newHeaders = [],
                    originalSheet,
                    newSheet,
                    originalSheetRange;

                for (
                    returnId = 0;
                    returnId < response.pixelReturn.length;
                    returnId++
                ) {
                    if (type === 'csv' || type === 'tsv' || type === 'txt') {
                        if (!validQsComponent) {
                            parsedFiles[returnId].headers = Object.keys(
                                response.pixelReturn[returnId].output.dataTypes
                            );
                            parsedFiles[returnId].headerDataTypes =
                                response.pixelReturn[returnId].output.dataTypes;
                            parsedFiles[returnId].additionalDataTypes =
                                response.pixelReturn[
                                    returnId
                                ].output.additionalDataTypes;
                        } else {
                            // if file already uploaded we need to compare original headers from output to new qs headers to find any removed
                            originalHeaders =
                                response.pixelReturn[returnId].output
                                    .cleanHeaders;
                            newHeaders = parsedFiles[returnId].headers;
                        }
                        parsedFiles[returnId].headerModifications = {};
                        // check to see if headers have been modified and store the mapping if true
                        for (
                            idx = 0;
                            idx <
                            response.pixelReturn[returnId].output.cleanHeaders
                                .length;
                            idx++
                        ) {
                            if (
                                response.pixelReturn[returnId].output
                                    .cleanHeaders[idx] !==
                                response.pixelReturn[returnId].output.headers[
                                    idx
                                ]
                            ) {
                                parsedFiles[returnId].headerModifications[
                                    response.pixelReturn[
                                        returnId
                                    ].output.cleanHeaders[idx]
                                ] =
                                    response.pixelReturn[
                                        returnId
                                    ].output.headers[idx];
                            }
                        }
                    } else if (type === 'excel') {
                        if (!validQsComponent) {
                            parsedFiles[returnId].sheets = {};
                            parsedFiles[returnId].additionalDataTypes =
                                response.pixelReturn[
                                    returnId
                                ].output.additionalDataTypes;
                        }
                        parsedFiles[returnId].headerModifications = {};
                        for (sheet in response.pixelReturn[returnId].output) {
                            if (
                                response.pixelReturn[
                                    returnId
                                ].output.hasOwnProperty(sheet)
                            ) {
                                // for rebuilding from qs, need to add sheets that weren't selected to parsedFiles so user can switch sheets
                                if (
                                    !parsedFiles[
                                        returnId
                                    ].sheets.hasOwnProperty(sheet)
                                ) {
                                    parsedFiles[returnId].sheets[sheet] =
                                        response.pixelReturn[returnId].output[
                                            sheet
                                        ];
                                } else {
                                    // if file already uploaded we need to compare original headers from output to new qs headers to find any removed
                                    newSheet =
                                        parsedFiles[returnId].sheets[sheet];
                                    originalSheet =
                                        response.pixelReturn[returnId].output[
                                            sheet
                                        ];
                                }
                                // find out if there have been any changes in headers
                                for (range in response.pixelReturn[returnId]
                                    .output[sheet]) {
                                    if (
                                        response.pixelReturn[returnId].output[
                                            sheet
                                        ].hasOwnProperty(range)
                                    ) {
                                        // if sheet already exists we need to check for previously removed headers
                                        if (
                                            newSheet &&
                                            newSheet.hasOwnProperty(range)
                                        ) {
                                            originalHeaders =
                                                originalSheet[range]
                                                    .cleanHeaders;
                                            newHeaders =
                                                newSheet[range].cleanHeaders;
                                            originalSheetRange = range;
                                        }
                                        for (
                                            j = 0;
                                            j <
                                            response.pixelReturn[returnId]
                                                .output[sheet][range].headers
                                                .length;
                                            j++
                                        ) {
                                            cleanHeader =
                                                response.pixelReturn[returnId]
                                                    .output[sheet][range]
                                                    .cleanHeaders[j];
                                            originalHeader =
                                                response.pixelReturn[returnId]
                                                    .output[sheet][range]
                                                    .headers[j];
                                            if (
                                                cleanHeader !== originalHeader
                                            ) {
                                                if (
                                                    !parsedFiles[returnId]
                                                        .headerModifications[
                                                        sheet
                                                    ]
                                                ) {
                                                    parsedFiles[
                                                        returnId
                                                    ].headerModifications[
                                                        sheet
                                                    ] = {};
                                                }
                                                if (
                                                    !parsedFiles[returnId]
                                                        .headerModifications[
                                                        sheet
                                                    ][range]
                                                ) {
                                                    parsedFiles[
                                                        returnId
                                                    ].headerModifications[
                                                        sheet
                                                    ][range] = {};
                                                }

                                                parsedFiles[
                                                    returnId
                                                ].headerModifications[sheet][
                                                    range
                                                ][cleanHeader] = originalHeader;
                                                // Original Header Value = ' +
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // only check for removed columns if previously uploaded file
                    if (validQsComponent) {
                        const qs = scope.pipelineFile.qsComponent;
                        let output = response.pixelReturn[returnId].output,
                            parsedFile = parsedFiles[returnId];

                        // get array of original header names for any columns whose header name has changed from the old uploaded file
                        for (let newHeaderName in qs.newHeaderNames) {
                            if (
                                qs.newHeaderNames.hasOwnProperty(newHeaderName)
                            ) {
                                qsNewHeaders.push(
                                    qs.newHeaderNames[newHeaderName]
                                );
                            }
                        }

                        // new headers will be all the current headers + any old headers whose name has changed
                        // need to add old headers so we can identify only those headers that have been 'removed'
                        newHeaders = newHeaders.concat(qsNewHeaders);

                        for (
                            let oldIdx = 0;
                            oldIdx < originalHeaders.length;
                            oldIdx++
                        ) {
                            const oldHeader = originalHeaders[oldIdx];
                            // check if header has been removed from current file
                            let existingHeader = newHeaders.find(function (
                                option
                            ) {
                                return option === oldHeader;
                            });
                            // if column has been removed we still need to add it to the parsed file info but we'll indicate it has been removed
                            if (!existingHeader) {
                                if (
                                    type === 'csv' ||
                                    type === 'tsv' ||
                                    type === 'txt'
                                ) {
                                    parsedFile.headerDataTypes[oldHeader] =
                                        output.dataTypes[oldHeader];
                                    parsedFile.headers.push(oldHeader);
                                    if (
                                        output.additionalDataTypes.hasOwnProperty(
                                            oldHeader
                                        )
                                    ) {
                                        parsedFile.additionalDataTypes[
                                            oldHeader
                                        ] =
                                            output.additionalDataTypes[
                                                oldHeader
                                            ];
                                    }
                                } else if (type === 'excel') {
                                    newSheet[originalSheetRange].dataTypes[
                                        oldHeader
                                    ] =
                                        originalSheet[
                                            originalSheetRange
                                        ].dataTypes[oldHeader];
                                    newSheet[originalSheetRange].headers.push(
                                        oldHeader
                                    );
                                    newSheet[
                                        originalSheetRange
                                    ].cleanHeaders.push(oldHeader);
                                    if (
                                        originalSheet[
                                            originalSheetRange
                                        ].additionalDataTypes.hasOwnProperty(
                                            oldHeader
                                        )
                                    ) {
                                        newSheet[
                                            originalSheetRange
                                        ].additionalDataTypes[oldHeader] =
                                            originalSheet[
                                                originalSheetRange
                                            ].additionalDataTypes[oldHeader];
                                    }
                                }
                                parsedFile.removedColumns = {};
                                parsedFile.removedColumns[oldHeader] = true;
                            }
                        }
                    }
                }

                scope.pipelineFile.parsedFiles = parsedFiles;
                if (scope.pipelineFile.customFrameName.name.length === 0) {
                    scope.pipelineFile.customFrameName.name =
                        scope.pipelineComponentCtrl.createFrameName(
                            scope.pipelineFile.parsedFiles[0].name
                        );
                    validateFrameName();
                }
                addParsedFilesToHeaderData();
                checkPreview(false);
                semossCoreService.emit('stop-polling', {
                    id: scope.widgetCtrl.insightID,
                    listeners: [scope.widgetCtrl.insightID],
                });
            };
            if (
                scope.pipelineFile.fileData.files.length > 0 &&
                !scope.pipelineFile.qsComponent
            ) {
                semossCoreService.emit('start-polling', {
                    id: scope.widgetCtrl.insightID,
                    listeners: [scope.widgetCtrl.insightID],
                });

                monolithService
                    .uploadFile(
                        scope.pipelineFile.fileData.files,
                        scope.widgetCtrl.insightID
                    )
                    .then(
                        function (data) {
                            var i,
                                len = data.length;
                            pixelComponents = [];

                            if (
                                type === 'csv' ||
                                type === 'tsv' ||
                                type === 'txt'
                            ) {
                                scope.pipelineFile.fileName = '';
                                scope.pipelineFile.dataLoaded = true;
                                if (data.length === 0) {
                                    scope.widgetCtrl.alert(
                                        'error',
                                        'No File Found'
                                    );
                                    return;
                                }

                                for (i = 0; i < len; i++) {
                                    scope.pipelineFile.fileName +=
                                        data[i].fileName;
                                    if (i + 1 < len) {
                                        scope.pipelineFile.fileName += ' & ';
                                    }

                                    parsedFiles.push({
                                        name: data[i].fileName,
                                        fileLocation: data[i].fileLocation,
                                    });

                                    pixelComponents.push({
                                        meta: true,
                                        type: 'predictDataTypes',
                                        components: [
                                            data[i].fileLocation,
                                            delim,
                                            false,
                                        ],
                                        terminal: true,
                                    });
                                }
                            } else if (type === 'excel') {
                                scope.pipelineFile.dataLoaded = true;
                                if (data.length === 0) {
                                    scope.widgetCtrl.alert(
                                        'error',
                                        'No File Found'
                                    );
                                    return;
                                }

                                for (i = 0; i < len; i++) {
                                    parsedFiles.push({
                                        name: data[i].fileName,
                                        fileLocation: data[i].fileLocation,
                                    });

                                    pixelComponents.push({
                                        type: 'predictExcelDataTypes',
                                        components: [data[i].fileLocation],
                                        terminal: true,
                                    });
                                }
                            }

                            scope.widgetCtrl.meta(pixelComponents, callback);
                        },
                        function () {
                            // if call errors, stop the polling
                            semossCoreService.emit('stop-polling', {
                                id: scope.widgetCtrl.insightID,
                                listeners: [scope.widgetCtrl.insightID],
                            });
                        }
                    );
            } else if (validQsComponent) {
                scope.pipelineFile.dataLoaded = true;
                parsedFiles = scope.pipelineFile.parsedFiles;
                semossCoreService.emit('start-polling', {
                    id: scope.widgetCtrl.insightID,
                    listeners: [scope.widgetCtrl.insightID],
                });
                if (type === 'excel') {
                    pixelComponents = [
                        {
                            meta: true,
                            type: 'predictExcelDataTypes',
                            components: [
                                scope.pipelineFile.qsComponent.filePath,
                            ],
                            terminal: true,
                        },
                    ];
                } else if (type === 'csv' || type === 'tsv' || type === 'txt') {
                    pixelComponents = [
                        {
                            meta: true,
                            type: 'predictDataTypes',
                            components: [
                                scope.pipelineFile.qsComponent.filePath,
                                delim,
                                false,
                            ],
                            terminal: true,
                        },
                    ];
                }
                scope.widgetCtrl.meta(pixelComponents, callback);
            } else if (scope.pipelineFile.assetFile) {
                scope.pipelineFile.dataLoaded = true;
                parsedFiles = [
                    {
                        name: scope.pipelineFile.assetFile.name,
                        fileLocation: scope.pipelineFile.assetFile.path,
                    },
                ];
                if (type === 'excel') {
                    pixelComponents = [
                        {
                            meta: true,
                            type: 'predictExcelDataTypes',
                            components: [scope.pipelineFile.assetFile.path],
                            terminal: true,
                        },
                    ];
                } else if (type === 'csv' || type === 'tsv' || type === 'txt') {
                    pixelComponents = [
                        {
                            meta: true,
                            type: 'predictDataTypes',
                            components: [
                                scope.pipelineFile.assetFile.path,
                                delim,
                                false,
                            ],
                            terminal: true,
                        },
                    ];
                }
                scope.widgetCtrl.meta(pixelComponents, callback);
            }
        }

        /** * General ***/
        /**
         * @name parseData
         * @desc calls function to get header information from BE
         * @returns {void}
         */
        function parseData() {
            if (
                scope.pipelineFile.assetFile &&
                !checkFileExtension(scope.pipelineFile.assetFile.name)
            ) {
                scope.pipelineFile.assetFile = null;
                return;
            }
            // check file location and clear either asset file or computer files AFTER user selects "next"
            // this prevents previously uploaded files from disappearing on step 1 if user changes file location but then changes back
            if (scope.pipelineFile.locationType === 'COMPUTER') {
                scope.pipelineFile.assetFile = null;
            } else if (scope.pipelineFile.locationType === 'SEMOSS') {
                scope.pipelineFile.fileData.files.length = 0;
            }
            var tempDelim = '';
            scope.pipelineFile.uniqueFileKey = {};
            scope.pipelineFile.headerData = [];
            scope.pipelineFile.allHeaders = [];
            scope.pipelineFile.step = 2;
            scope.pipelineFile.headerDataKeys = [];
            if (scope.pipelineFile.pasteData) {
                if (!scope.pipelineFile.delimiterValue) {
                    scope.pipelineFile.delimiterValue = ',';
                }

                scope.widgetCtrl.emit('start-loading', {
                    id: scope.widgetCtrl.widgetId,
                    message: 'Parsing Data and Determining Data Types',
                });

                if (scope.pipelineFile.delimiterValue === '\\t') {
                    tempDelim = '\t';
                } else {
                    tempDelim = scope.pipelineFile.delimiterValue;
                }
                monolithService
                    .uploadFile(
                        scope.pipelineFile.pasteData,
                        scope.widgetCtrl.insightID
                    )
                    .then(
                        function (response) {
                            var pixelComponents = [];
                            pixelComponents.push({
                                meta: true,
                                type: 'predictDataTypes',
                                components: [
                                    response[0].fileLocation,
                                    tempDelim,
                                    false,
                                ],
                                terminal: true,
                            });

                            scope.widgetCtrl.meta(
                                pixelComponents,
                                function (response2) {
                                    var output =
                                            response2.pixelReturn[0].output,
                                        parsedFiles = [],
                                        idx;
                                    scope.pipelineFile.uniqueFileKey[
                                        'Text Data'
                                    ] = response[0].fileLocation;

                                    scope.widgetCtrl.emit('stop-loading', {
                                        id: scope.widgetCtrl.widgetId,
                                    });

                                    parsedFiles.push({
                                        name: response[0].fileName,
                                        fileLocation: response[0].fileLocation,
                                    });
                                    if (
                                        scope.pipelineFile.customFrameName.name
                                            .length === 0
                                    ) {
                                        scope.pipelineFile.customFrameName.name =
                                            scope.pipelineComponentCtrl.createFrameName(
                                                response[0].fileName
                                            );
                                        validateFrameName();
                                    }

                                    scope.pipelineFile.dataLoaded = true;
                                    parsedFiles[0].headers = Object.keys(
                                        output.dataTypes
                                    );
                                    parsedFiles[0].headerDataTypes =
                                        output.dataTypes;
                                    parsedFiles[0].additionalDataTypes =
                                        output.additionalDataTypes;
                                    parsedFiles[0].headerModifications = {};
                                    // check to see if headers have been modified and store the mapping if true
                                    for (
                                        idx = 0;
                                        idx < output.cleanHeaders.length;
                                        idx++
                                    ) {
                                        if (
                                            output.cleanHeaders[idx] !==
                                            output.headers[idx]
                                        ) {
                                            parsedFiles[0].headerModifications[
                                                output.cleanHeaders[idx]
                                            ] = output.headers[idx];
                                        }
                                    }

                                    scope.pipelineFile.parsedFiles =
                                        parsedFiles;
                                    addParsedFilesToHeaderData();
                                    checkPreview();
                                }
                            );
                        },
                        function (error) {
                            scope.widgetCtrl.emit('stop-loading', {
                                id: scope.widgetCtrl.widgetId,
                            });
                            scope.widgetCtrl.alert('error', error);
                        }
                    );
            } else if (
                (scope.pipelineFile.fileData &&
                    scope.pipelineFile.fileData.files.length > 0) ||
                scope.pipelineFile.assetFile
            ) {
                // var dataTypeCalls = [], fileNames = [];
                if (!scope.pipelineFile.delimiterValue) {
                    scope.pipelineFile.delimiterValue = ',';
                }

                if (scope.pipelineFile.delimiterValue === '\\t') {
                    tempDelim = '\t';
                } else {
                    tempDelim = scope.pipelineFile.delimiterValue;
                }
                // todo for performance add below plus a catch if the user changes the file when going back a step and forward again
                if (
                    scope.pipelineFile.fileType === 'csv' ||
                    scope.pipelineFile.fileType === 'tsv' ||
                    scope.pipelineFile.fileType === 'txt'
                ) {
                    parseFile(scope.pipelineFile.fileType, tempDelim);
                } else if (scope.pipelineFile.fileType === 'excel') {
                    parseFile(scope.pipelineFile.fileType);
                }
            } else {
                scope.widgetCtrl.alert('warn', 'No Text or File Found');
            }
        }

        function addParsedFilesToHeaderData() {
            var i, len, modifiedHeader, j, len2;
            // game plan is to take the binded data in parsedFiles and plug it in the right place to skip making a duplicate
            for (
                i = 0, len = scope.pipelineFile.parsedFiles.length;
                i < len;
                i++
            ) {
                formatHeaderData(scope.pipelineFile.parsedFiles[i]);

                if (!scope.pipelineFile.parsedFiles[i].sheets) {
                    // csv get modified headers
                    if (scope.pipelineFile.parsedFiles[i].headerModifications) {
                        for (modifiedHeader in scope.pipelineFile.parsedFiles[i]
                            .headerModifications) {
                            if (
                                scope.pipelineFile.parsedFiles[
                                    i
                                ].headerModifications.hasOwnProperty(
                                    modifiedHeader
                                )
                            ) {
                                for (
                                    j = 0,
                                        len2 =
                                            scope.pipelineFile.headerData[i]
                                                .headers.length;
                                    j < len2;
                                    j++
                                ) {
                                    if (
                                        scope.pipelineFile.headerData[i]
                                            .headers[j].title === modifiedHeader
                                    ) {
                                        scope.pipelineFile.headerData[
                                            i
                                        ].headers[j].modifiedHeader =
                                            scope.pipelineFile.parsedFiles[
                                                i
                                            ].headerModifications[
                                                modifiedHeader
                                            ];
                                    }
                                }
                            }
                        }
                    }
                } else if (
                    scope.pipelineFile.parsedFiles[i].headerModifications
                ) {
                    // excel get modified headers
                    for (let sheet in scope.pipelineFile.parsedFiles[i]
                        .headerModifications) {
                        if (
                            scope.pipelineFile.parsedFiles[
                                i
                            ].headerModifications.hasOwnProperty(sheet)
                        ) {
                            for (let range in scope.pipelineFile.parsedFiles[i]
                                .headerModifications[sheet]) {
                                if (
                                    scope.pipelineFile.parsedFiles[
                                        i
                                    ].headerModifications[sheet].hasOwnProperty(
                                        range
                                    )
                                ) {
                                    for (modifiedHeader in scope.pipelineFile
                                        .parsedFiles[i].headerModifications[
                                        sheet
                                    ][range]) {
                                        if (
                                            scope.pipelineFile.parsedFiles[
                                                i
                                            ].headerModifications[sheet][
                                                range
                                            ].hasOwnProperty(modifiedHeader)
                                        ) {
                                            for (
                                                let k = 0;
                                                k <
                                                scope.pipelineFile.headerData
                                                    .length;
                                                k++
                                            ) {
                                                for (
                                                    let l = 0;
                                                    l <
                                                    scope.pipelineFile
                                                        .headerData[k].ranges
                                                        .length;
                                                    l++
                                                ) {
                                                    for (
                                                        j = 0,
                                                            len2 =
                                                                scope
                                                                    .pipelineFile
                                                                    .headerData[
                                                                    k
                                                                ].ranges[l]
                                                                    .headers
                                                                    .length;
                                                        j < len2;
                                                        j++
                                                    ) {
                                                        if (
                                                            scope.pipelineFile
                                                                .headerData[k]
                                                                .ranges[l]
                                                                .headers[j]
                                                                .title ===
                                                            modifiedHeader
                                                        ) {
                                                            scope.pipelineFile.headerData[
                                                                k
                                                            ].ranges[l].headers[
                                                                j
                                                            ].modifiedHeader =
                                                                scope.pipelineFile.parsedFiles[
                                                                    i
                                                                ].headerModifications[
                                                                    sheet
                                                                ][range][
                                                                    modifiedHeader
                                                                ];
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // turn off loading
            // scope.widgetCtrl.emit('stop-loading', {
            //     id: scope.widgetCtrl.widgetId
            // });
        }

        /** * Part 2 ***/
        /** * Data ***/
        /**
         * @name formatHeaderData
         * @param {object} fileData - file being formatted
         * @desc draws the Headers of the Parsed File
         * @returns {void}
         */
        function formatHeaderData(fileData) {
            var headerData;

            // excel
            if (fileData.sheets) {
                headerData = fileData.sheets;
            } else if (fileData.uniqueFileKey) {
                // paste data
                headerData = {};
                headerData.csv = fileData.CSV.dataTypes;
            } else {
                headerData = {};
                headerData[fileData.name] = fileData.headerDataTypes;
            }

            if (getFileExtension(fileData.fileLocation) === 'excel') {
                _formatExcelHeaderData(headerData, fileData);
            } else {
                _formatRegularHeaderData(headerData, fileData);
            }

            if (scope.pipelineFile.headerData.length > 0) {
                scope.pipelineFile.selected =
                    scope.pipelineFile.headerDataKeys[0];
                scope.pipelineFile.selectedHeaderData =
                    scope.pipelineFile.headerData[0];
                if (scope.pipelineFile.selectedHeaderData.ranges) {
                    scope.pipelineFile.selectedRange =
                        scope.pipelineFile.selectedHeaderData.ranges[0];
                    scope.pipelineFile.selectedHeaderData.headers =
                        semossCoreService.utility.freeze(
                            scope.pipelineFile.selectedHeaderData.ranges[0]
                                .headers
                        );
                }
            }
        }

        /**
         * @name _formatExcelHeaderData
         * @param {object} headerData - headers and their metadata
         * @param {object} fileData - file data
         * @desc looks at returned header data and formats it to conform to the view, establishing
         * the range, data type, and object for user to create a custom range
         * @return {void}
         */
        function _formatExcelHeaderData(headerData, fileData) {
            var sheet,
                sheetHolder,
                header,
                range,
                originalHeaderName = '',
                rangeHolder,
                headerObj,
                additionalDataTypes,
                fileName = '',
                removedColumns;

            if (fileData.name) {
                fileName = fileData.name;
            }

            // check if any columns previously removed
            if (fileData.hasOwnProperty('removedColumns')) {
                removedColumns = fileData.removedColumns;
            }

            for (sheet in headerData) {
                if (headerData.hasOwnProperty(sheet)) {
                    sheetHolder = {
                        title: sheet,
                        open: true,
                        mainColumn: null,
                        ranges: [],
                        fileName: fileName,
                    };

                    for (range in headerData[sheet]) {
                        if (headerData[sheet].hasOwnProperty(range)) {
                            rangeHolder = {
                                display: range,
                                fullRange: range.toUpperCase(),
                                start: range.split(':')[0],
                                end: range.split(':')[1],
                                headers: [],
                            };
                            for (header in headerData[sheet][range].dataTypes) {
                                if (
                                    headerData[sheet][
                                        range
                                    ].dataTypes.hasOwnProperty(header)
                                ) {
                                    originalHeaderName = '';
                                    // store original header name needed if multiple changes made to same column
                                    if (
                                        (scope.pipelineFile.qsComponent &&
                                            !scope.pipelineFile.assetFile) ||
                                        (scope.pipelineFile.qsComponent &&
                                            scope.pipelineFile.assetFile &&
                                            scope.pipelineFile.qsComponent
                                                .fileName ===
                                                scope.pipelineFile.assetFile
                                                    .name)
                                    ) {
                                        if (
                                            fileData.userHeaderModifications.hasOwnProperty(
                                                header
                                            )
                                        ) {
                                            originalHeaderName =
                                                fileData
                                                    .userHeaderModifications[
                                                    header
                                                ];
                                        }
                                    }
                                    additionalDataTypes =
                                        headerData[sheet][range]
                                            .additionalDataTypes;
                                    headerObj = _makeHeaderObj(
                                        headerData[sheet][range].dataTypes[
                                            header
                                        ],
                                        sheet,
                                        header,
                                        fileName,
                                        additionalDataTypes,
                                        originalHeaderName
                                    );
                                    // column previously removed
                                    if (
                                        removedColumns &&
                                        removedColumns.hasOwnProperty(header)
                                    ) {
                                        headerObj.selected = false;
                                    }

                                    rangeHolder.headers.push(headerObj);
                                    scope.pipelineFile.allHeaders.push(
                                        headerObj
                                    );
                                }
                            }
                        }
                        sheetHolder.ranges.push(rangeHolder);
                    }

                    sheetHolder.ranges.push({
                        display: 'Custom Range',
                        fullRange: '',
                        start: '',
                        end: '',
                        headers: [],
                    });

                    scope.pipelineFile.headerData.push(sheetHolder);
                    scope.pipelineFile.headerDataKeys.push(sheetHolder.title);
                }
            }
        }

        /**
         * @name _formatRegularHeaderData
         * @param {object} headerData - header metadata
         * @param {object} fileData - file meta data
         * @return {void}
         */
        function _formatRegularHeaderData(headerData, fileData) {
            var sheet,
                sheetHolder,
                header,
                fileName = fileData.name,
                headerObj,
                originalHeaderName = '',
                additionalDataTypes = fileData.additionalDataTypes,
                removedColumns;

            // check if any columns previously removed
            if (fileData.hasOwnProperty('removedColumns')) {
                removedColumns = fileData.removedColumns;
            }

            if (fileData.uniqueFileKey) {
                additionalDataTypes = fileData.CSV.additionalDataTypes;
            }

            for (sheet in headerData) {
                if (headerData.hasOwnProperty(sheet)) {
                    sheetHolder = {
                        title: sheet,
                        open: true,
                        mainColumn: null,
                        headers: [],
                        fileName: fileName ? fileName : false,
                    };
                    for (header in headerData[sheet]) {
                        if (headerData[sheet].hasOwnProperty(header)) {
                            originalHeaderName = '';
                            // store original header name needed if multiple changes made to same column
                            if (
                                (scope.pipelineFile.qsComponent &&
                                    !scope.pipelineFile.assetFile) ||
                                (scope.pipelineFile.qsComponent &&
                                    scope.pipelineFile.assetFile &&
                                    scope.pipelineFile.qsComponent.fileName ===
                                        scope.pipelineFile.assetFile.name)
                            ) {
                                if (
                                    fileData.userHeaderModifications.hasOwnProperty(
                                        header
                                    )
                                ) {
                                    originalHeaderName =
                                        fileData.userHeaderModifications[
                                            header
                                        ];
                                }
                            }
                            headerObj = _makeHeaderObj(
                                headerData[sheet][header],
                                sheet,
                                header,
                                fileName,
                                additionalDataTypes,
                                originalHeaderName
                            );
                            // column previously removed
                            if (
                                removedColumns &&
                                removedColumns.hasOwnProperty(header)
                            ) {
                                headerObj.selected = false;
                            }
                            sheetHolder.headers.push(headerObj);
                            scope.pipelineFile.allHeaders.push(headerObj);
                        }
                    }

                    scope.pipelineFile.headerData.push(sheetHolder);
                    scope.pipelineFile.headerDataKeys.push(sheetHolder.title);
                }
            }
        }

        function _makeHeaderObj(
            type,
            sheet,
            header,
            fileName,
            additionalDataTypes,
            originalHeaderName
        ) {
            var headerName = '',
                typeFormat,
                newType = type;
            if (fileName) {
                headerName = fileName + ': ' + header;
            } else {
                headerName = header;
            }

            typeFormat = additionalDataTypes[header];

            if (newType === 'INT' || newType === 'DOUBLE') {
                if (!typeFormat) {
                    if (newType === 'INT') {
                        typeFormat = 'int_default';
                    } else {
                        typeFormat = 'double_round2';
                    }
                }
            }

            if (
                (newType === 'DATE' || newType === 'TIMESTAMP') &&
                !typeFormat
            ) {
                // needs type format, must tell user
                scope.pipelineFile.missingFormats.push(header);
            }

            return {
                selected: true,
                title: header,
                originalTitle: originalHeaderName ? originalHeaderName : header,
                type: newType,
                name: headerName,
                fileName: fileName,
                invalidHeader: false,
                modifiedHeader: false,
                typeFormat: typeFormat,
            };
        }

        /**
         * @name updateSelectedSheet
         * @desc sets the new selected header
         * @returns {void}
         */
        function updateSelectedSheet() {
            scope.pipelineFile.selectedHeaderData =
                scope.pipelineFile.headerData[
                    scope.pipelineFile.headerDataKeys.indexOf(
                        scope.pipelineFile.selected
                    )
                ];
            if (scope.pipelineFile.selectedHeaderData.ranges) {
                scope.pipelineFile.selectedRange =
                    scope.pipelineFile.selectedHeaderData.ranges[0];
            }
            if (scope.pipelineFile.fileType !== 'paste') {
                checkPreview();
            }
        }

        /**
         * @name getSelectedHeaders
         * @desc gets a list of the selected headers
         * @param {array} headersArray - all of the headers
         * @returns {array} selected headers
         */
        function getSelectedHeaders(headersArray) {
            var selectedHeaders = [],
                headerIndex,
                headerLen;
            for (
                headerIndex = 0, headerLen = headersArray.length;
                headerIndex < headerLen;
                headerIndex++
            ) {
                if (headersArray[headerIndex].selected) {
                    selectedHeaders.push(headersArray[headerIndex].title);
                }
            }
            return selectedHeaders;
        }

        /**
         * @name selectRange
         * @desc select the range
         * @returns {void}
         */
        function selectRange() {
            if (scope.pipelineFile.selectedRange.display === 'Custom Range') {
                scope.pipelineFile.selectedRange = {
                    display: 'Custom Range',
                    fullRange: '',
                    start: '',
                    end: '',
                    headers: [],
                };
            } else {
                // preview the selected block
                checkPreview(false);
            }
        }

        /**
         * @name previewCustomRange
         * @desc preview the custom range in the excel file
         * @returns {void}
         */
        function previewCustomRange() {
            var callback;

            callback = function (response) {
                var header,
                    additionalDataTypes,
                    headerObj = {},
                    output = response.pixelReturn[0].output;
                scope.pipelineFile.selectedRange.headers = [];
                for (header in output.cleanHeaders) {
                    if (output.cleanHeaders.hasOwnProperty(header)) {
                        additionalDataTypes = output.additionalDataTypes;
                        headerObj = _makeHeaderObj(
                            output.dataTypes[output.cleanHeaders[header]],
                            scope.pipelineFile.selected,
                            output.cleanHeaders[header],
                            scope.pipelineFile.selectedHeaderData.fileName,
                            additionalDataTypes,
                            ''
                        );

                        scope.pipelineFile.selectedRange.headers.push(
                            headerObj
                        );
                    }
                }
                checkPreview(false);
            };

            scope.widgetCtrl.query(
                [
                    {
                        meta: true,
                        type: 'predictExcelRangeMetadata',
                        components: [
                            scope.pipelineFile.parsedFiles[0].fileLocation,
                            scope.pipelineFile.selected,
                            scope.pipelineFile.selectedRange.fullRange.toUpperCase(),
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name checkHeaders
         * @desc checks headers for validity
         * @param {string} fileName - filename to check
         * @returns {boolean} - is the new header valid
         */
        function checkHeaders(fileName) {
            // this function only runs when user changed the headers
            // need to send to backend to make sure that they are still okay to be used
            scope.pipelineFile.cleanHeaders = true;
            var userHeaders,
                data = {},
                idx,
                fileLen,
                sheetIdx,
                sheetLen,
                sheetData;

            if (
                scope.pipelineFile.assetFile ||
                scope.pipelineFile.fileType === 'paste'
            ) {
                _getUserHeaders(0);
            } else {
                for (
                    idx = 0, fileLen = scope.pipelineFile.fileData.files.length;
                    idx < fileLen;
                    idx++
                ) {
                    _getUserHeaders(idx);
                }
            }

            function _getUserHeaders(fileIdx) {
                if (
                    scope.pipelineFile.fileType === 'csv' ||
                    scope.pipelineFile.fileType === 'tsv' ||
                    scope.pipelineFile.fileType === 'txt' ||
                    scope.pipelineFile.fileType === 'paste'
                ) {
                    if (!userHeaders) {
                        userHeaders = {};
                    }
                    userHeaders[fileName] = getSelectedHeaders(
                        scope.pipelineFile.headerData[fileIdx].headers
                    );
                } else {
                    if (!userHeaders) {
                        userHeaders = [];
                    }
                    // excel logic
                    // complicated ish - sets up the headers in an order for the backend
                    sheetData = {};
                    for (
                        sheetIdx = 0,
                            sheetLen = scope.pipelineFile.headerData.length;
                        sheetIdx < sheetLen;
                        sheetIdx++
                    ) {
                        if (
                            scope.pipelineFile.parsedFiles[fileIdx].name ===
                            scope.pipelineFile.headerData[sheetIdx].fileName
                        ) {
                            if (
                                !sheetData[
                                    scope.pipelineFile.headerData[sheetIdx]
                                        .title
                                ]
                            ) {
                                if (
                                    scope.pipelineFile.headerData[sheetIdx]
                                        .ranges
                                ) {
                                    sheetData[
                                        scope.pipelineFile.headerData[
                                            sheetIdx
                                        ].title
                                    ] = getSelectedHeaders(
                                        scope.pipelineFile.selectedRange.headers
                                    );
                                } else {
                                    sheetData[
                                        scope.pipelineFile.headerData[
                                            sheetIdx
                                        ].title
                                    ] = getSelectedHeaders(
                                        scope.pipelineFile.headerData[sheetIdx]
                                            .headers
                                    );
                                }
                            }
                        }
                    }
                    userHeaders.push(sheetData);
                }
            }

            data.userHeaders = userHeaders;
            data.uploadType = scope.pipelineFile.fileType;

            return monolithService.checkHeaders(data).then(
                function (response) {
                    if (scope.pipelineFile.assetFile) {
                        _getHeaderData(0, scope.pipelineFile.assetFile.name);
                    } else if (scope.pipelineFile.fileType === 'paste') {
                        for (
                            idx = 0,
                                fileLen = scope.pipelineFile.parsedFiles.length;
                            idx < fileLen;
                            idx++
                        ) {
                            _getHeaderData(
                                idx,
                                scope.pipelineFile.parsedFiles[idx].name
                            );
                        }
                    } else {
                        for (
                            idx = 0,
                                fileLen =
                                    scope.pipelineFile.fileData.files.length;
                            idx < fileLen;
                            idx++
                        ) {
                            _getHeaderData(
                                idx,
                                scope.pipelineFile.fileData.files[idx].name
                            );
                        }
                    }

                    function _getHeaderData(fileIdx, name) {
                        var headerIdx, headerLen;
                        if (
                            scope.pipelineFile.fileType === 'csv' ||
                            scope.pipelineFile.fileType === 'tsv' ||
                            scope.pipelineFile.fileType === 'txt' ||
                            scope.pipelineFile.fileType === 'paste'
                        ) {
                            for (
                                headerIdx = 0,
                                    headerLen =
                                        scope.pipelineFile.headerData[fileIdx]
                                            .headers.length;
                                headerIdx < headerLen;
                                headerIdx++
                            ) {
                                if (
                                    response &&
                                    response[name] &&
                                    response[name][
                                        scope.pipelineFile.headerData[fileIdx]
                                            .headers[headerIdx].title
                                    ]
                                ) {
                                    scope.pipelineFile.cleanHeaders = false;
                                    scope.pipelineFile.headerData[
                                        fileIdx
                                    ].headers[headerIdx].invalidHeader =
                                        response[name][
                                            scope.pipelineFile.headerData[
                                                fileIdx
                                            ].headers[headerIdx].title
                                        ];
                                } else {
                                    scope.pipelineFile.headerData[
                                        fileIdx
                                    ].headers[headerIdx].invalidHeader = false;
                                }
                            }
                        } else if (scope.pipelineFile.fileType === 'excel') {
                            for (
                                sheetIdx = 0,
                                    sheetLen =
                                        scope.pipelineFile.headerData.length;
                                sheetIdx < scope.pipelineFile.headerData.length;
                                sheetIdx++
                            ) {
                                if (
                                    scope.pipelineFile.parsedFiles[fileIdx]
                                        .name ===
                                    scope.pipelineFile.headerData[sheetIdx]
                                        .fileName
                                ) {
                                    if (
                                        scope.pipelineFile.selectedRange.headers
                                    ) {
                                        headerLen =
                                            scope.pipelineFile.selectedRange
                                                .headers.length;
                                    } else {
                                        headerLen = 0;
                                    }
                                    for (
                                        headerIdx = 0;
                                        headerIdx < headerLen;
                                        headerIdx++
                                    ) {
                                        if (
                                            response &&
                                            response[fileIdx] &&
                                            response[fileIdx][
                                                scope.pipelineFile.headerData[
                                                    sheetIdx
                                                ].title
                                            ] &&
                                            response[fileIdx][
                                                scope.pipelineFile.headerData[
                                                    sheetIdx
                                                ].title
                                            ][
                                                scope.pipelineFile.selectedRange
                                                    .headers[headerIdx].title
                                            ]
                                        ) {
                                            scope.pipelineFile.cleanHeaders = false;
                                            scope.pipelineFile.selectedRange.headers[
                                                headerIdx
                                            ].invalidHeader =
                                                response[fileIdx][
                                                    scope.pipelineFile.headerData[
                                                        sheetIdx
                                                    ].title
                                                ][
                                                    scope.pipelineFile.selectedRange.headers[
                                                        headerIdx
                                                    ].title
                                                ];
                                        } else {
                                            scope.pipelineFile.selectedRange.headers[
                                                headerIdx
                                            ].invalidHeader = false;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (scope.pipelineFile.cleanHeaders) {
                        return true;
                    }

                    return false;
                },
                function (error) {
                    console.warn(error);
                    return false;
                }
            );
        }

        /**
         * @name cancel
         * @desc goes to step 1
         * @return {void}
         */
        function cancel() {
            scope.pipelineFile.step = 1;
            scope.pipelineFile.parsedFiles = [];
            scope.pipelineFile.dataLoaded = false;
            loadPreview(false);
        }

        /**
         * @name changeHeader
         * @desc change the header name
         * @return {void}
         */
        function changeHeader() {
            scope.pipelineFile.changedHeaderName = true;
            checkPreview();
        }

        /**
         * @name load
         * @param {boolean} visualize - if true visualize data
         * @desc checks whether the headers are valid before submitting data to the backend
         * @return {void}
         */
        function load(visualize) {
            var fileName = '';
            // determine file type
            if (
                !scope.pipelineFile.pasteData &&
                scope.pipelineFile.fileData.files.length > 0
            ) {
                // using first file to determine file type for now...
                fileName = scope.pipelineFile.fileData.files[0].name;
            }
            // load if the user hasnt changed headers or if the headers are valid
            if (
                !scope.pipelineFile.changedHeaderName ||
                scope.pipelineFile.fileType === 'paste'
            ) {
                createInMemoryTable(visualize);
            } else {
                checkHeaders(fileName).then(function (headersPassed) {
                    if (headersPassed) {
                        createInMemoryTable(visualize);
                    }
                });
            }
        }

        /**
         * @name checkPreview
         * @desc checks whether the headers are valid before submitting data to the backend
         * @param {boolean} alert - alert the user?
         * @return {void}
         */
        function checkPreview(alert) {
            var fileName = '';

            if (scope.pipelineFile.fileData.files.length > 0) {
                // using first file to determine file type for now...
                fileName = scope.pipelineFile.fileData.files[0].name;
            } else if (scope.pipelineFile.assetFile) {
                fileName = scope.pipelineFile.assetFile.name;
            } else if (
                scope.pipelineFile.pasteData &&
                scope.pipelineFile.parsedFiles.length > 0
            ) {
                fileName = scope.pipelineFile.parsedFiles[0].name;
            }

            // load if the user hasnt changed headers or if the headers are valid
            if (!scope.pipelineFile.changedHeaderName) {
                loadPreview(alert);
            } else {
                checkHeaders(fileName).then(function () {
                    loadPreview(alert);
                });
            }
        }

        /**
         * @name loadPreview
         * @desc preview the data
         * @param {boolean} alert - alert the user?
         * @returns {void}
         */
        function loadPreview(alert) {
            var parameters = {},
                valid = true;

            if (scope.pipelineFile.step === 1) {
                if (alert) {
                    scope.widgetCtrl.alert('warn', 'Please upload a file.');
                }
                valid = false;
            }

            if (!scope.pipelineFile.cleanHeaders) {
                if (alert) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Errors in the column names. See below for more details.'
                    );
                }
                valid = false;
            }

            if (valid) {
                parameters = buildParameters(true);
                scope.pipelineComponentCtrl.previewComponent(parameters);
            }
        }

        /**
         * @name createInMemoryTable
         * @param {boolean} visualize - if true visualize frame
         * @desc uploads the data, creates, frame
         * @return {void}
         */
        function createInMemoryTable(visualize) {
            let parameters, options, callback;

            if (scope.pipelineFile.step === 1) {
                scope.widgetCtrl.alert('warn', 'Please upload a file.');
                return;
            }

            if (!scope.pipelineFile.cleanHeaders) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Errors in the column names. See below for more details.'
                );
                return;
            }

            parameters = buildParameters();

            options = {};

            // check if it is paste data or not
            if (scope.pipelineFile.fileType === 'paste') {
                // noop
            } else if (
                scope.pipelineFile.fileType === 'csv' ||
                scope.pipelineFile.fileType === 'tsv' ||
                scope.pipelineFile.fileType === 'txt'
            ) {
                options.name = scope.pipelineFile.parsedFiles[0].name;
            } else if (scope.pipelineFile.fileType === 'excel') {
                options.name = scope.pipelineFile.parsedFiles[0].name;
            }

            if (visualize) {
                callback = scope.pipelineComponentCtrl.visualizeComponent;
            }

            scope.pipelineComponentCtrl.executeComponent(
                parameters,
                options,
                callback
            );
        }

        /**
         * @name getDataTypeMap
         * @param {object} headerData - all te file information
         * @desc maps the data type
         * @return {object} headerDataTypes - mapped data types
         */
        function getDataTypeMap(headerData) {
            var headerDataTypes = {},
                key;

            headerDataTypes.selectors = [];
            headerDataTypes.types = {};
            headerDataTypes.newHeaders = {};
            headerDataTypes.newTypes = {};
            headerDataTypes.newNewHeaders = {};

            // create header object with each sheet and headers with types
            // grab first sheet or csv for now
            if (headerData.ranges) {
                _setHeaderDataTypes(
                    scope.pipelineFile.selectedRange,
                    headerDataTypes
                );
            } else {
                _setHeaderDataTypes(headerData, headerDataTypes);
            }

            for (key in headerDataTypes.types) {
                if (
                    headerDataTypes.types.hasOwnProperty(key) &&
                    !headerDataTypes.newHeaders[key]
                ) {
                    headerDataTypes.newTypes[key] = headerDataTypes.types[key];
                }
            }

            if (Object.keys(headerDataTypes.newHeaders).length > 0) {
                for (key in headerDataTypes.newHeaders) {
                    if (headerDataTypes.newHeaders.hasOwnProperty(key)) {
                        headerDataTypes.newTypes[
                            headerDataTypes.newHeaders[key]
                        ] = headerDataTypes.types[key];
                        headerDataTypes.newNewHeaders[
                            headerDataTypes.newHeaders[key]
                        ] = key;
                    }
                }
            }

            return headerDataTypes;
        }

        function _setHeaderDataTypes(headerData, headerDataTypes) {
            var headerIdx, headerLen, header;

            for (
                headerIdx = 0, headerLen = headerData.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                header = headerData.headers[headerIdx];
                // only add headers selected by the user
                if (header.selected) {
                    headerDataTypes.selectors.push(header.title);
                    if (header.type === 'NUMBER') {
                        if (header.typeFormat) {
                            headerDataTypes.types[header.originalTitle] =
                                header.typeFormat;
                        } else {
                            headerDataTypes.types[header.originalTitle] =
                                'DOUBLE';
                        }
                    } else {
                        headerDataTypes.types[header.originalTitle] =
                            header.type;
                    }
                    if (header.title !== header.originalTitle) {
                        headerDataTypes.newHeaders[header.originalTitle] =
                            header.title;
                    }
                }
            }
        }

        /**
         * @name removeFile
         * @desc set the fileType data
         * @param {any} file the file to remove
         * @return {void}
         */
        function removeFile(file) {
            if (file.hasOwnProperty('placeholder')) {
                scope.pipelineFile.fileData.files = [];
                scope.pipelineFile.qsComponent = false;
            } else {
                file.cancel();
            }
        }

        /**
         * @name mapFileType
         * @desc map the fileType based on qsType if filetype is missing from qs return
         * @param {string} qsType the qsType
         * @return {string} the file type
         */
        function mapFileType(qsType) {
            switch (qsType) {
                case 'CSV_FILE':
                    return 'csv';
                case 'EXCEL_FILE':
                    return 'excel';
                default:
                    return '';
            }
        }
        /**
         * @name setFileType
         * @desc set the fileType data
         * @return {void}
         */
        function setFileType() {
            var file, frame, qs;

            // rebuild from qs if file has already been uploaded
            qs = scope.pipelineComponentCtrl.getComponent(
                'parameters.QUERY_STRUCT.value'
            );
            frame = scope.pipelineComponentCtrl.getComponent(
                'parameters.IMPORT_FRAME.value'
            );
            if (qs) {
                // after visualizing then returning to pipeline qs is missing fileType so pull from qsType
                if (!qs.hasOwnProperty('fileType')) {
                    qs.fileType = mapFileType(qs.qsType);
                }
                // after visualizing then returning to pipeline qs is missing fileName so pull from filePath
                if (!qs.hasOwnProperty('fileName')) {
                    qs.fileName = qs.filePath.substr(
                        qs.filePath.lastIndexOf('\\') + 1
                    );
                }
                // if filepath is for insight folder pre populate the widget with asset file
                if (
                    qs.filePath.substr(0, qs.filePath.indexOf('\\')) ===
                    'INSIGHT_FOLDER'
                ) {
                    scope.pipelineFile.assetFile = {
                        path: qs.filePath,
                        name: qs.fileName,
                    };
                }
                // add file to display component box with filename
                let newFile = {
                    name: qs.fileName,
                    placeholder: true,
                };
                // save file properties on scope for parsing file
                scope.pipelineFile.delimiterValue = qs.delimiter;
                scope.pipelineFile.fileType = qs.fileType;
                scope.pipelineFile.fileData.files[0] = newFile;
                scope.pipelineFile.qsComponent = qs;
            }
            // update frame name / type if previously selected
            if (frame) {
                scope.pipelineFile.customFrameName.name = frame.name;
                scope.pipelineFile.frameType = frame.type;
            }

            // all of the options
            scope.pipelineFile.fileTypes = [];
            for (file in FILES) {
                if (FILES.hasOwnProperty(file)) {
                    scope.pipelineFile.fileTypes.push({
                        display: String(FILES[file].name).replace(/_/g, ' '),
                        value: FILES[file].fileType,
                        image: FILES[file].image,
                    });
                }
            }

            // set to step 1
            if (scope.pipelineFile.step !== 1) {
                cancel();
            }

            // check if it exists
            if (scope.pipelineFile.fileType) {
                if (!FILES.hasOwnProperty(scope.pipelineFile.fileType)) {
                    scope.pipelineFile.fileType = false;
                }
            }

            if (!scope.pipelineFile.fileType) {
                scope.pipelineFile.fileType =
                    scope.pipelineFile.fileTypes[0].value;
            }

            updateFileType();
        }

        /**
         * @name updateFileType
         * @desc update the fileType data
         * @return {void}
         */
        function updateFileType() {
            var oldExtension;

            if (scope.pipelineFile.fileType === 'paste') {
                scope.pipelineFile.delimiterValue = ',';

                // clear out all of the files
                scope.pipelineFile.fileData.files.length = 0;
                scope.pipelineFile.assetFile = null;
            } else {
                if (scope.pipelineFile.fileType === 'csv') {
                    scope.pipelineFile.delimiterValue = ',';
                } else if (scope.pipelineFile.fileType === 'tsv') {
                    scope.pipelineFile.delimiterValue = '\t';
                } else if (scope.pipelineFile.fileType === 'txt') {
                    scope.pipelineFile.delimiterValue = ',';
                }

                // clear out the pasted data
                scope.pipelineFile.pasteData = '';

                // clear out old if it doesn't match
                if (
                    scope.pipelineFile.fileData &&
                    scope.pipelineFile.fileData.files.length > 0
                ) {
                    oldExtension = getFileExtension(
                        scope.pipelineFile.fileData.files[0]
                    );
                    if (
                        !oldExtension ||
                        oldExtension !== scope.pipelineFile.fileType
                    ) {
                        if (
                            oldExtension === 'txt' &&
                            scope.pipelineFile.fileType === 'csv'
                        ) {
                            // noop txt files are uploaded as csv qsType so file is still valid / should not remove
                        } else {
                            scope.pipelineFile.fileData.files.length = 0;
                        }
                    }
                }
            }
        }

        /**
         * @name formatHeaderType
         * @param {object} header header to be formatted
         * @param {object} sheet specific sheet to be formatted
         * @desc sets the header to be formatted
         * @return {void}
         */
        function formatHeaderType(header, sheet) {
            // TODO excel uploads typeformat is returned as m/d/yy which is incorrect
            if (header.type === 'DATE' && header.typeFormat === 'm/d/yy') {
                header.typeFormat = 'M/d/yyyy';
            }
            if (
                typeof header.typeFormat === 'string' &&
                semossCoreService.visualization.isJson(header.typeFormat)
            ) {
                scope.pipelineFile.formatOptions = JSON.parse(
                    header.typeFormat
                );
                header.typeFormat = 'Custom';
            }
            scope.pipelineFile.headerBeingFormatted = JSON.parse(
                JSON.stringify(header)
            );
            scope.pipelineFile.isFormattingTypes = true;
            scope.pipelineFile.sheetBeingFormatted = sheet;
        }

        /**
         * @name updateCustom
         * @param {object} type the type selected
         * @desc updates type and custom formatting
         * @return {void}
         */
        function updateCustom(type) {
            scope.pipelineFile.headerBeingFormatted.type = type.value;
            scope.pipelineFile.customFormat = '';
        }

        /**
         * @name applyTypeChange
         * @desc updates header to changes user has made
         * @return {void}
         */
        function applyTypeChange() {
            var i, currentSheet;

            currentSheet = scope.pipelineFile.sheetBeingFormatted;
            if (currentSheet.ranges) {
                for (i = 0; i < currentSheet.ranges.length; i++) {
                    _iterateOverTypeChangeHeaders(
                        currentSheet.ranges[i].headers
                    );

                    if (scope.pipelineFile.foundInRange) {
                        scope.pipelineFile.foundInRange = false;
                        break;
                    }
                }
            } else {
                _iterateOverTypeChangeHeaders(currentSheet.headers);
            }

            checkPreview(false);
        }

        function _iterateOverTypeChangeHeaders(headers) {
            var i, currentHeader;
            for (i = 0; i < headers.length; i++) {
                currentHeader = headers[i];

                if (
                    currentHeader.title ===
                    scope.pipelineFile.headerBeingFormatted.title
                ) {
                    // change type so dont save format
                    if (
                        currentHeader.type !==
                            scope.pipelineFile.headerBeingFormatted.type &&
                        scope.pipelineFile.headerBeingFormatted.typeFormat ===
                            ''
                    ) {
                        scope.pipelineFile.headerBeingFormatted.typeFormat = '';
                    }
                    if (scope.pipelineFile.customFormat) {
                        // store custom date and time notation
                        scope.pipelineFile.headerBeingFormatted.typeFormat =
                            scope.pipelineFile.customFormat;
                        scope.pipelineFile.customFormat = '';
                    } else if (
                        scope.pipelineFile.headerBeingFormatted.typeFormat ===
                        'Custom'
                    ) {
                        // scope.pipelineFile.headerBeingFormatted.typeFormat = '\'' + JSON.stringify(scope.pipelineFile.formatOptions) + '\'';
                        scope.pipelineFile.formatOptions.dimension =
                            scope.pipelineFile.headerBeingFormatted.title;
                        scope.pipelineFile.formatOptions.dimensionType =
                            scope.pipelineFile.headerBeingFormatted.type;
                        scope.pipelineFile.headerBeingFormatted.typeFormat =
                            JSON.stringify(scope.pipelineFile.formatOptions);
                    } else if (
                        (scope.pipelineFile.headerBeingFormatted.type ===
                            'DATE' ||
                            scope.pipelineFile.headerBeingFormatted.type ===
                                'NUMBER') &&
                        !scope.pipelineFile.headerBeingFormatted.typeFormat
                    ) {
                        if (
                            scope.pipelineFile.headerBeingFormatted.type ===
                            'DATE'
                        ) {
                            scope.pipelineFile.headerBeingFormatted.typeFormat =
                                'yyyy-MM-dd';
                        } else {
                            scope.pipelineFile.headerBeingFormatted.typeFormat =
                                'DOUBLE';
                        }
                    }

                    headers[i] = scope.pipelineFile.headerBeingFormatted;

                    if (
                        scope.pipelineFile.missingFormats.indexOf(
                            currentHeader.title
                        ) > -1
                    ) {
                        scope.pipelineFile.missingFormats.splice(
                            scope.pipelineFile.missingFormats.indexOf(
                                currentHeader.title
                            ),
                            1
                        );
                    }
                    scope.pipelineFile.headerBeingFormatted = {};
                    scope.pipelineFile.isFormattingTypes = false;
                    scope.pipelineFile.foundInRange = true;
                    break;
                }
            }
        }

        function getAdditionalDataTypes(headers) {
            var additionalDataTypes = {};
            if (headers.ranges) {
                headers.ranges.forEach(function (range) {
                    range.headers.forEach(function (header) {
                        if (header.typeFormat) {
                            additionalDataTypes[header.title] =
                                header.typeFormat;
                        }
                    });
                });
            } else {
                headers.headers.forEach(function (header) {
                    if (header.typeFormat) {
                        additionalDataTypes[header.title] = header.typeFormat;
                    }
                });
            }

            return additionalDataTypes;
        }

        /**
         * @name buildParameters
         * @param {boolean} preview - true if coming from preview
         * @desc build the parameters for the current module
         * @returns {object} - map of the paramters to value
         */
        function buildParameters(preview) {
            var uploadType,
                filePath = '',
                fileName = '',
                delimiter,
                dataTypeMap,
                additionalTypes,
                selectors = [],
                selectorIdx,
                selectorLen,
                sheetName,
                sheetRange;

            dataTypeMap = getDataTypeMap(scope.pipelineFile.selectedHeaderData);
            additionalTypes = getAdditionalDataTypes(
                scope.pipelineFile.selectedHeaderData
            );

            // check if it is paste data or not
            if (scope.pipelineFile.fileType === 'paste') {
                uploadType = 'CSV_FILE';
                filePath = scope.pipelineFile.uniqueFileKey['Text Data'];
                fileName = '';
            } else {
                if (
                    scope.pipelineFile.fileType === 'csv' ||
                    scope.pipelineFile.fileType === 'tsv' ||
                    scope.pipelineFile.fileType === 'txt'
                ) {
                    uploadType = 'CSV_FILE';
                } else if (scope.pipelineFile.fileType === 'excel') {
                    uploadType = 'EXCEL_FILE';
                }

                filePath = scope.pipelineFile.parsedFiles[0].fileLocation;
                fileName = scope.pipelineFile.parsedFiles[0].name;
            }

            if (uploadType === 'CSV_FILE') {
                sheetName = '';
                sheetRange = '';
            } else if (uploadType === 'EXCEL_FILE') {
                sheetName = scope.pipelineFile.selectedHeaderData.title;
                if (scope.pipelineFile.selectedRange) {
                    sheetRange =
                        scope.pipelineFile.selectedRange.fullRange.toUpperCase();
                }
            }

            if (scope.pipelineFile.delimiterValue === '\\t') {
                delimiter = '\t';
            } else {
                delimiter = scope.pipelineFile.delimiterValue;
            }

            for (
                selectorIdx = 0, selectorLen = dataTypeMap.selectors.length;
                selectorIdx < selectorLen;
                selectorIdx++
            ) {
                selectors.push({
                    type: 'COLUMN',
                    content: {
                        table: 'DND',
                        column: dataTypeMap.selectors[selectorIdx],
                        alias: dataTypeMap.selectors[selectorIdx],
                    },
                });
            }

            return {
                IMPORT_FRAME: {
                    name:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.name'
                        ) || scope.pipelineFile.customFrameName.name,
                    type:
                        scope.pipelineFile.frameType ||
                        scope.widgetCtrl.getOptions('initialFrameType'),
                    override: true,
                },
                QUERY_STRUCT: {
                    qsType: uploadType,
                    fileName: fileName,
                    filePath: filePath,
                    fileType: scope.pipelineFile.fileType,
                    delimiter: delimiter,
                    newHeaderNames: dataTypeMap.newNewHeaders,
                    columnTypes: dataTypeMap.newTypes,
                    additionalTypes: additionalTypes,
                    selectors: selectors,
                    sheetName: sheetName,
                    sheetRange: sheetRange,
                    limit: preview ? PREVIEW_LIMIT : -1,
                    preview: preview,
                },
            };
        }

        /**
         * @name validateFrameName
         * @desc checks if the frame name entered by the user is valid
         * @returns {void}
         */
        function validateFrameName() {
            let results = scope.pipelineComponentCtrl.validateFrameName(
                scope.pipelineFile.customFrameName.name
            );
            scope.pipelineFile.customFrameName.valid = results.valid;
            scope.pipelineFile.customFrameName.message = results.message;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.pipelineFile.fileData.files = [scope.widgetCtrl.file];
            scope.widgetCtrl.file = undefined;
            setFrameData();
            setFileType();
        }

        initialize();
    }
}
