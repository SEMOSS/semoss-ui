'use strict';

export default angular
    .module('app.import-file.directive', [])
    .directive('importFile', importFileDirective);

import './import-file.scss';

importFileDirective.$inject = [
    '$timeout',
    '$q',
    'monolithService',
    'semossCoreService',
    'CONFIG',
];

function importFileDirective(
    $timeout,
    $q,
    monolithService,
    semossCoreService,
    CONFIG
) {
    importFileCtrl.$inject = [];
    importFileLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^import'],
        scope: {},
        bindToController: {
            fileType: '=',
            sentFileData: '=?',
        },
        controllerAs: 'importFile',
        controller: importFileCtrl,
        link: importFileLink,
        template: require('./import-file.directive.html'),
    };

    function importFileCtrl() {}

    function importFileLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];

        scope.importFile.step = 'initial'; // step of data
        scope.importFile.databaseType = {
            // database type to upload
            options: [],
            selected: '',
            specific: {},
        };
        scope.importFile.metamodelType = {
            // metamodel type to upload
            options: [],
            selected: '',
        };
        scope.importFile.propFiles = {};
        scope.importFile.parsedFiles = [];

        scope.importFile.setFile = setFile;
        scope.importFile.checkFile = checkFile;
        scope.importFile.checkFileExtension = checkFileExtension;
        scope.importFile.checkFileSize = checkFileSize;
        scope.importFile.validateFiles = validateFiles;
        scope.importFile.cancelFiles = cancelFiles;
        scope.importFile.validatePropFile = validatePropFile;
        scope.importFile.onDatabaseChange = onDatabaseChange;
        scope.importFile.validateUpload = validateUpload;
        scope.importFile.uploadFile = uploadFile;
        scope.importFile.getParsedTypeInformation = getParsedTypeInformation;
        scope.importFile.checkDisabled = checkDisabled;

        /** * Part 1 ***/
        /** * File ***/
        /**
         * @name setFile
         * @desc goes to the first step
         * @return {void}
         */
        function setFile() {
            scope.importFile.step = 'initial';
        }

        /**
         * @name checkFile
         * @param {object} file the file to check
         * @desc check the file for validity
         * @returns {void}
         */
        function checkFile(file) {
            if (
                scope.importFile.databaseType.selected === 'R' &&
                scope.importFile.rawFiles.files.length > 0
            ) {
                scope.importCtrl.alert(
                    'error',
                    'R upload will only accept one file.'
                );
                return false;
            }
            var validFile = false;

            validFile = checkFileExtension(file);

            if (validFile) {
                validFile = checkFileSize(file);
            }

            // set app name to the file name if it's not already populated.
            if (!scope.importCtrl.replace) {
                if (validFile && !scope.importCtrl.name.value) {
                    scope.importCtrl.name.value = file.name.replace(
                        file.name.substr(file.name.lastIndexOf('.')),
                        ''
                    );
                    scope.importCtrl.validateName();
                }
            }

            return validFile;
        }

        /**
         * @name checkFileExtension
         * @param {file} file - flow file
         * @desc checks file extension (must be csv) and makes sure there is only one file added
         * @returns {boolean} - checks wether it is an acceptable file
         */
        function checkFileExtension(file) {
            var fileExtension = getFileExtension(file);

            if (fileExtension) {
                return true;
            }

            scope.importCtrl.alert(
                'error',
                'File must be excel (.xls, .xlsx, or .xlsm), .csv, or .tsv'
            );
            return false;
        }

        /**
         * @name checkFileSize
         * @param {file} file - flow file
         * @desc checks file extension (must be csv) and makes sure there is only one file added
         * @returns {boolean} - checks wether it is an acceptable file
         */
        function checkFileSize(file) {
            if (
                !CONFIG['file-limit'] ||
                file.size / 1024 / 1024 <= CONFIG['file-limit']
            ) {
                return true;
            }

            scope.importCtrl.alert(
                'error',
                'File must be under ' + CONFIG['file-limit'] + 'MB.'
            );
            return false;
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
            } else {
                fileExtension = file.getExtension();
            }

            if (fileExtension === 'csv') {
                return 'CSV';
            } else if (
                fileExtension === 'xlsx' ||
                fileExtension === 'xlsm' ||
                fileExtension === 'xls'
            ) {
                return 'EXCEL';
            } else if (fileExtension === 'tsv') {
                return 'TSV';
            } else if (fileExtension === 'prop') {
                return 'PROP';
            } else if (fileExtension === 'json') {
                return 'JSON';
            } else if (fileExtension === 'parquet') {
                return 'PARQUET';
            }

            return false;
        }

        /**
         * @name validateFiles
         * @desc makes sure all files in flow are of the same type and of allowable types (csv and excel formats)
         * @return {void}
         */
        function validateFiles() {
            var i, old;

            if (scope.importFile.rawFiles.files.length === 0) {
                // how did we reach here?
                return;
            }

            old = scope.importFile.fileType;
            scope.importFile.fileType = getFileExtension(
                scope.importFile.rawFiles.files[0]
            );

            // validate the rest of the files match this fileType. We will remove and warn the user if the file type doesn't match
            for (i = scope.importFile.rawFiles.files.length - 1; i > 0; i--) {
                if (
                    getFileExtension(scope.importFile.rawFiles.files[i]) !==
                    scope.importFile.fileType
                ) {
                    scope.importCtrl.alert(
                        'error',
                        'Files must be of the same type. ' +
                            scope.importFile.rawFiles.files[i].name +
                            ' is not a ' +
                            scope.importFile.fileType
                    );
                    scope.importFile.rawFiles.files.splice(i, 1);
                    return;
                }
            }

            // has the fileType changed? (if so we will force the reset)
            onFileChange(old !== scope.importFile.fileType);
        }

        /**
         * @name cancelFiles
         * @param {file} file - flow file
         * @desc cancel the files
         * @returns {void}
         */
        function cancelFiles(file) {
            if (file) {
                file.cancel();
            }

            if (scope.importFile.metamodelType.selected === 'From Prop File') {
                removePropFile(file.name);
            }
        }

        /**
         * @name validatePropFile
         * @desc make sure the propfile is correct
         * @param {string} fileName - changed fileName
         * @return {void}
         */
        function validatePropFile(fileName) {
            var flow = scope.importFile.propFiles[fileName],
                extension;

            if (flow) {
                extension = getFileExtension(flow.files[0]);
            }

            if (extension !== 'PROP' && extension !== 'JSON') {
                if (flow) {
                    flow.files = [];
                }
                scope.importCtrl.alert(
                    'error',
                    'File must have a .prop or .json extension'
                );
            }
        }

        /**
         * @name removePropFile
         * @desc make sure the propfile is correct
         * @param {string} fileName - changed fileName
         * @return {void}
         */
        function removePropFile(fileName) {
            if (scope.importFile.propFiles.hasOwnProperty(fileName)) {
                delete scope.importFile.propFiles[fileName];
            }
        }

        /**
         * @name setFileType
         * @desc maps the data type
         * @return {void}
         */
        function setFileType() {
            var oldExtension;

            // set to step 1
            if (scope.importFile.step !== 'initial') {
                setFile();
            }

            // clear out old if it doesn't match
            if (
                scope.importFile.rawFiles &&
                scope.importFile.rawFiles.files.length > 0
            ) {
                oldExtension = getFileExtension(
                    scope.importFile.rawFiles.files[0]
                );
                if (
                    !oldExtension ||
                    oldExtension !== scope.importFile.fileType
                ) {
                    scope.importFile.rawFiles.files.length = 0;
                }
            }

            // set the delimiter
            if (scope.importFile.fileType === 'CSV') {
                scope.importFile.delimiter = ',';
            } else if (scope.importFile.fileType === 'TSV') {
                scope.importFile.delimiter = '\t';
            }
        }

        /** Data */
        /**
         * @name onFileChange
         * @desc set correct database type based on the file
         * @param {boolean} reset - force reset?
         * @return {void}
         */
        function onFileChange(reset) {
            var old;

            if (scope.importFile.fileType === 'EXCEL') {
                scope.importFile.databaseType.options = ['H2', 'RDF'];
            } else if (
                scope.importFile.fileType === 'CSV' ||
                scope.importFile.fileType === 'TSV'
            ) {
                scope.importFile.databaseType.options = [
                    'H2',
                    'RDF',
                    'Tinker',
                    'R',
                ];
            } else {
                scope.importFile.databaseType.options = [];
            }

            // keep track of the old one
            old = scope.importFile.databaseType.selected;
            if (scope.importCtrl.replace) {
                // set the file
                if (scope.importCtrl.replace.app_type === 'H2_DB') {
                    scope.importFile.databaseType.selected = 'H2';
                } else {
                    scope.importFile.databaseType.selected =
                        scope.importCtrl.replace.app_type;
                }

                // throw an alert if the selected one isn't valid
                if (
                    scope.importFile.databaseType.options.indexOf(
                        scope.importFile.databaseType.selected
                    ) === -1
                ) {
                    scope.importCtrl.alert(
                        'warn',
                        'Uploaded file is not valid to replace this database.'
                    );
                }
            } else {
                // set the first one if it the selected one isn't there
                if (
                    scope.importFile.databaseType.options.indexOf(
                        scope.importFile.databaseType.selected
                    ) === -1
                ) {
                    scope.importFile.databaseType.selected =
                        scope.importFile.databaseType.options[0];
                }
            }

            if (reset || old !== scope.importFile.databaseType.selected) {
                onDatabaseChange();
            }

            // reset the delimiter
            if (reset) {
                if (scope.importFile.fileType === 'CSV') {
                    scope.importFile.delimiter = ',';
                } else if (scope.importFile.fileType === 'TSV') {
                    scope.importFile.delimiter = '\t';
                }
            }
        }
        /**
         * @name onDatabaseChange
         * @desc set correct options when the database changes
         * @return {void}
         */
        function onDatabaseChange() {
            // update the options
            if (scope.importFile.databaseType.selected === 'RDF') {
                scope.importFile.databaseType.specific = {
                    custom: false,
                    uri: 'http://semoss.org/ontologies',
                };
            } else if (scope.importFile.databaseType.selected === 'Tinker') {
                scope.importFile.databaseType.specific = {
                    selected: 'TG',
                    options: ['TG', 'Neo4j', 'XML', 'JSON'],
                };
            } else {
                scope.importFile.databaseType.specific = {};
            }

            // update the metamodel type
            if (scope.importFile.fileType === 'EXCEL') {
                if (scope.importFile.databaseType.selected === 'RDF') {
                    scope.importFile.metamodelType.options = [
                        'Excel Loader Sheet Format',
                    ];
                } else if (scope.importFile.databaseType.selected === 'H2') {
                    scope.importFile.metamodelType.options = [
                        'As Flat Table',
                        'Excel Loader Sheet Format',
                    ];
                } else if (
                    scope.importFile.databaseType.selected === 'Tinker'
                ) {
                    // noop
                }
            } else if (
                scope.importFile.fileType === 'CSV' ||
                scope.importFile.fileType === 'TSV'
            ) {
                if (scope.importFile.databaseType.selected === 'RDF') {
                    scope.importFile.metamodelType.options = [
                        'As Suggested Metamodel',
                        'From Scratch',
                        'From Prop File',
                    ];
                } else if (scope.importFile.databaseType.selected === 'H2') {
                    scope.importFile.metamodelType.options = [
                        'As Flat Table',
                        'As Suggested Metamodel',
                        'From Scratch',
                        'From Prop File',
                    ];
                } else if (scope.importFile.databaseType.selected === 'R') {
                    scope.importFile.metamodelType.options = ['As Flat Table'];
                    if (scope.importFile.rawFiles.files.length > 1) {
                        for (
                            let i = scope.importFile.rawFiles.files.length - 1;
                            i > 0;
                            i--
                        ) {
                            cancelFiles(scope.importFile.rawFiles.files[i]);
                        }
                        scope.importCtrl.alert(
                            'warn',
                            'R only accepts one file. Extra files have been removed.'
                        );
                    }
                } else if (
                    scope.importFile.databaseType.selected === 'Tinker'
                ) {
                    scope.importFile.metamodelType.options = [
                        'As Suggested Metamodel',
                        'From Scratch',
                        'From Prop File',
                    ];
                }
            } else {
                scope.importFile.metamodelType.options = [];
            }

            // only set if there is a change
            if (
                scope.importFile.metamodelType.options.indexOf(
                    scope.importFile.metamodelType.selected
                ) === -1
            ) {
                scope.importFile.metamodelType.selected =
                    scope.importFile.metamodelType.options[0];
            }
        }

        /**
         * @name validateUpload
         * @desc can we load the files?
         * @returns {boolean} - true or false if the load is valid or not
         */
        function validateUpload() {
            var file, count;

            if (scope.importFile.rawFiles.files.length === 0) {
                return false;
            }

            if (scope.importFile.metamodelType.selected === 'From Prop File') {
                count = 0;

                for (file in scope.importFile.propFiles) {
                    if (scope.importFile.propFiles.hasOwnProperty(file)) {
                        if (
                            scope.importFile.propFiles[file] &&
                            scope.importFile.propFiles[file].files.length > 0
                        ) {
                            count++;
                        }
                    }
                }

                if (count !== scope.importFile.rawFiles.files.length) {
                    return false;
                }
            }
            return true;
        }

        /**
         * @name uploadFile
         * @desc set correct options when the database changes
         * @return {void}
         */
        function uploadFile() {
            // using the jobid to be the same as the insight id
            var jobId = semossCoreService.get('queryInsightID');
            scope.importFile.loadedFiles = [];

            semossCoreService.emit('start-polling', {
                id: jobId,
                listeners: [jobId],
            });

            monolithService
                .uploadFile(scope.importFile.rawFiles.files, jobId)
                .then(
                    function (data) {
                        try {
                            var fileIdx, fileLen;

                            if (data.length === 0) {
                                scope.importCtrl.alert(
                                    'error',
                                    'No File Found'
                                );
                                return;
                            }

                            for (
                                fileIdx = 0, fileLen = data.length;
                                fileIdx < fileLen;
                                fileIdx++
                            ) {
                                scope.importFile.loadedFiles.push({
                                    fileName: data[fileIdx].fileName,
                                    fileLocation: data[fileIdx].fileLocation,
                                });
                            }

                            // update the delimiter
                            if (!scope.importFile.delimiter) {
                                scope.importFile.delimiter = ',';
                            } else if (scope.importFile.delimiter === '\\t') {
                                scope.importFile.delimiter = '\t';
                            }

                            // check if it is excel
                            if (scope.importFile.fileType === 'EXCEL') {
                                if (
                                    scope.importFile.metamodelType.selected ===
                                    'As Flat Table'
                                ) {
                                    setFlat();
                                } else if (
                                    scope.importFile.metamodelType.selected ===
                                    'As Suggested Metamodel'
                                ) {
                                    // noop
                                    // should never get here
                                } else if (
                                    scope.importFile.metamodelType.selected ===
                                    'From Scratch'
                                ) {
                                    // noop
                                    // should never get here
                                } else if (
                                    scope.importFile.metamodelType.selected ===
                                    'From Prop File'
                                ) {
                                    // noop
                                    // should never get here
                                } else if (
                                    scope.importFile.metamodelType.selected ===
                                    'Excel Loader Sheet Format'
                                ) {
                                    setLoader();
                                }
                            } else if (
                                scope.importFile.fileType === 'CSV' ||
                                scope.importFile.fileType === 'TSV'
                            ) {
                                if (
                                    scope.importFile.metamodelType.selected ===
                                    'As Flat Table'
                                ) {
                                    setFlat();
                                } else if (
                                    scope.importFile.metamodelType.selected ===
                                    'As Suggested Metamodel'
                                ) {
                                    setMetamodel();
                                } else if (
                                    scope.importFile.metamodelType.selected ===
                                    'From Scratch'
                                ) {
                                    setMetamodel();
                                } else if (
                                    scope.importFile.metamodelType.selected ===
                                    'From Prop File'
                                ) {
                                    setMetamodel();
                                } else if (
                                    scope.importFile.metamodelType.selected ===
                                    'Excel Loader Sheet Format'
                                ) {
                                    // noop
                                    // should never get here
                                }
                            }
                        } finally {
                            semossCoreService.emit('stop-polling', {
                                id: jobId,
                                listeners: [jobId],
                            });
                        }
                    },
                    function () {
                        // if call errors out, stop the polling
                        semossCoreService.emit('stop-polling', {
                            id: jobId,
                            listeners: [jobId],
                        });
                    }
                );
        }

        /** Step 2 */
        /** Metamodel */
        /**
         * @name setMetamodel
         * @desc set the metamodel step
         * @returns {void}
         */
        function setMetamodel() {
            $q.when(getParsedFiles()).then(function (parsedInformation) {
                scope.importFile.parsedFiles = formatParsedFilesMetamodel(
                    scope.importFile.loadedFiles,
                    parsedInformation
                );

                scope.importFile.step = 'metamodel';
            });
        }

        /** Flat */
        /**
         * @name setFlat
         * @desc set the flat step
         * @returns {void}
         */
        function setFlat() {
            $q.when(getParsedFiles()).then(function (parsedInformation) {
                scope.importFile.parsedFiles = formatParsedFilesFlat(
                    scope.importFile.loadedFiles,
                    parsedInformation
                );

                scope.importFile.step = 'flat';
            });
        }

        /** Database */
        // /**
        //  * @name setDatabase
        //  * @desc set the database step
        //  * @returns {void}
        //  */
        // function setDatabase() {
        //     $q.when(getDatabaseFiles()).then(function (parsedInformation) {
        //         scope.importFile.parsedFiles = formatParsedFilesDatabase(scope.importFile.loadedFiles, parsedInformation);

        //         scope.importFile.step = 'database';
        //     });
        // }

        /** Loader */
        /**
         * @name setLoader
         * @desc set the loader step
         * @returns {void}
         */
        function setLoader() {
            var pixel = '',
                component,
                callback,
                i,
                len,
                first = false;

            if (scope.importFile.fileType === 'EXCEL') {
                for (
                    i = 0, len = scope.importFile.loadedFiles.length;
                    i < len;
                    i++
                ) {
                    if (!first) {
                        pixel += 'databaseVar = ';
                    }

                    if (scope.importFile.databaseType.selected === 'RDF') {
                        component = {
                            type: scope.importCtrl.replace
                                ? 'rdfReplaceDatabaseLoaderSheetUpload'
                                : 'rdfLoaderSheetUpload',
                            components: [
                                scope.importCtrl.replace
                                    ? scope.importCtrl.replace.app_id
                                    : scope.importCtrl.name.value,
                                scope.importFile.loadedFiles[i].fileLocation,
                                scope.importFile.databaseType.specific.uri,
                                first,
                                first ? 'databaseVar' : '',
                            ],
                            terminal: true,
                        };
                    } else {
                        component = {
                            type: scope.importCtrl.replace
                                ? 'rdbmsReplaceDatabaseLoaderSheetUpload'
                                : 'rdbmsLoaderSheetUpload',
                            components: [
                                scope.importCtrl.replace
                                    ? scope.importCtrl.replace.app_id
                                    : scope.importCtrl.name.value,
                                scope.importFile.loadedFiles[i].fileLocation,
                                first,
                                first ? 'databaseVar' : '',
                            ],
                            terminal: true,
                        };
                    }

                    pixel += semossCoreService.pixel.build([component]);

                    first = true;
                }
            }

            if (pixel.length === 0) {
                scope.importCtrl.alert(
                    'warn',
                    'Nothing to upload. Please select atleast one header.'
                );
                return;
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    scope.importCtrl.alert('error', output);
                    return;
                }

                scope.importCtrl.query(
                    [
                        {
                            type: 'extractDatabaseMeta',
                            components: ['', false, 'databaseVar'],
                            terminal: true,
                        },
                    ],
                    false,
                    []
                );

                scope.importCtrl.alert('success', 'Success');
                if (!scope.importCtrl.replace) {
                    scope.importCtrl.exit(output);
                }
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Helpers */
        /**
         * @name getParsedFiles
         * @desc get parsed file information
         * @returns {*} promise
         */
        function getParsedFiles() {
            var deferred = $q.defer(),
                pixelComponents = [],
                callback,
                fileIdx,
                fileLen,
                propFiles,
                jobId;
            if (scope.importFile.metamodelType.selected === 'As Flat Table') {
                if (scope.importFile.fileType === 'EXCEL') {
                    for (
                        fileIdx = 0,
                            fileLen = scope.importFile.loadedFiles.length;
                        fileIdx < fileLen;
                        fileIdx++
                    ) {
                        pixelComponents.push({
                            type: 'predictExcelDataTypes',
                            components: [
                                scope.importFile.loadedFiles[fileIdx]
                                    .fileLocation,
                            ],
                            terminal: true,
                        });
                    }
                } else if (
                    scope.importFile.fileType === 'CSV' ||
                    scope.importFile.fileType === 'TSV'
                ) {
                    for (
                        fileIdx = 0,
                            fileLen = scope.importFile.loadedFiles.length;
                        fileIdx < fileLen;
                        fileIdx++
                    ) {
                        pixelComponents.push({
                            type: 'predictDataTypes',
                            components: [
                                scope.importFile.loadedFiles[fileIdx]
                                    .fileLocation,
                                scope.importFile.delimiter,
                                false,
                            ],
                            terminal: true,
                        });
                    }
                }

                if (pixelComponents.length === 0) {
                    scope.importCtrl.alert('warn', 'Nothing to predict.');
                    return undefined;
                }

                callback = function (response) {
                    var outputIdx,
                        outputLen,
                        parsedInformation = [],
                        fileHolder = [];

                    if (scope.importFile.fileType === 'EXCEL') {
                        for (
                            outputIdx = 0,
                                outputLen = response.pixelReturn.length;
                            outputIdx < outputLen;
                            outputIdx++
                        ) {
                            if (
                                response.pixelReturn[
                                    outputIdx
                                ].operationType.indexOf('ERROR') > -1 ||
                                response.pixelReturn[
                                    outputIdx
                                ].operationType.indexOf('INVALID_SYNTAX') > -1
                            ) {
                                return;
                            }

                            parsedInformation.push(
                                response.pixelReturn[outputIdx].output
                            );
                        }
                    } else if (
                        scope.importFile.fileType === 'CSV' ||
                        scope.importFile.fileType === 'TSV'
                    ) {
                        for (
                            outputIdx = 0,
                                outputLen = response.pixelReturn.length;
                            outputIdx < outputLen;
                            outputIdx++
                        ) {
                            if (
                                response.pixelReturn[
                                    outputIdx
                                ].operationType.indexOf('ERROR') > -1 ||
                                response.pixelReturn[
                                    outputIdx
                                ].operationType.indexOf('INVALID_SYNTAX') > -1
                            ) {
                                return;
                            }

                            fileHolder = {};
                            fileHolder[
                                scope.importFile.loadedFiles[outputIdx].fileName
                            ] = {};
                            fileHolder[
                                scope.importFile.loadedFiles[outputIdx].fileName
                            ][
                                scope.importFile.loadedFiles[outputIdx].fileName
                            ] = response.pixelReturn[outputIdx].output;

                            parsedInformation.push(fileHolder);
                        }
                    }

                    deferred.resolve(parsedInformation);
                };

                scope.importCtrl.query(pixelComponents, callback);

                return deferred.promise;
            } else if (
                scope.importFile.metamodelType.selected ===
                'As Suggested Metamodel'
            ) {
                for (
                    fileIdx = 0, fileLen = scope.importFile.loadedFiles.length;
                    fileIdx < fileLen;
                    fileIdx++
                ) {
                    pixelComponents.push({
                        type: 'predictMetamodel',
                        components: [
                            scope.importFile.loadedFiles[fileIdx].fileLocation,
                            scope.importFile.delimiter,
                            false,
                        ],
                        terminal: true,
                    });
                }

                if (pixelComponents.length === 0) {
                    scope.importCtrl.alert('warn', 'Nothing to predict.');
                    return undefined;
                }

                callback = function (response) {
                    var outputIdx,
                        outputLen,
                        parsedInformation = [];

                    for (
                        outputIdx = 0, outputLen = response.pixelReturn.length;
                        outputIdx < outputLen;
                        outputIdx++
                    ) {
                        if (
                            response.pixelReturn[
                                outputIdx
                            ].operationType.indexOf('ERROR') > -1 ||
                            response.pixelReturn[
                                outputIdx
                            ].operationType.indexOf('INVALID_SYNTAX') > -1
                        ) {
                            return;
                        }

                        parsedInformation.push(
                            response.pixelReturn[outputIdx].output
                        );
                    }

                    deferred.resolve(parsedInformation);
                };

                scope.importCtrl.query(pixelComponents, callback);

                return deferred.promise;
            } else if (
                scope.importFile.metamodelType.selected === 'From Scratch'
            ) {
                for (
                    fileIdx = 0, fileLen = scope.importFile.loadedFiles.length;
                    fileIdx < fileLen;
                    fileIdx++
                ) {
                    pixelComponents.push({
                        type: 'predictDataTypes',
                        components: [
                            scope.importFile.loadedFiles[fileIdx].fileLocation,
                            scope.importFile.delimiter,
                            false,
                        ],
                        terminal: true,
                    });
                }

                if (pixelComponents.length === 0) {
                    scope.importCtrl.alert('warn', 'Nothing to predict.');
                    return undefined;
                }

                callback = function (response) {
                    var outputIdx,
                        outputLen,
                        parsedInformation = [];

                    for (
                        outputIdx = 0, outputLen = response.pixelReturn.length;
                        outputIdx < outputLen;
                        outputIdx++
                    ) {
                        if (
                            response.pixelReturn[
                                outputIdx
                            ].operationType.indexOf('ERROR') > -1 ||
                            response.pixelReturn[
                                outputIdx
                            ].operationType.indexOf('INVALID_SYNTAX') > -1
                        ) {
                            return;
                        }

                        parsedInformation.push(
                            response.pixelReturn[outputIdx].output
                        );
                    }

                    deferred.resolve(parsedInformation);
                };

                scope.importCtrl.query(pixelComponents, callback);

                return deferred.promise;
            } else if (
                scope.importFile.metamodelType.selected === 'From Prop File'
            ) {
                jobId = semossCoreService.get('queryInsightID');
                propFiles = [];

                for (
                    fileIdx = 0, fileLen = scope.importFile.loadedFiles.length;
                    fileIdx < fileLen;
                    fileIdx++
                ) {
                    if (
                        scope.importFile.propFiles.hasOwnProperty(
                            scope.importFile.loadedFiles[fileIdx].fileName
                        )
                    ) {
                        propFiles.push(
                            scope.importFile.propFiles[
                                scope.importFile.loadedFiles[fileIdx].fileName
                            ].files[0]
                        );
                    }
                }

                if (propFiles.length === 0) {
                    scope.importCtrl.alert(
                        'warn',
                        'Nothing to upload. Please add a valid propFile.'
                    );
                    return undefined;
                }

                semossCoreService.emit('start-loading', {
                    id: jobId,
                    message: 'Uploading Files',
                });

                monolithService
                    .uploadFile(propFiles, jobId)
                    .then(function (data) {
                        var loadedPropFiles = [];

                        // assume the index matches
                        for (
                            fileIdx = 0, fileLen = data.length;
                            fileIdx < fileLen;
                            fileIdx++
                        ) {
                            loadedPropFiles.push({
                                fileName: data[fileIdx].fileName,
                                fileLocation: data[fileIdx].fileLocation,
                            });

                            pixelComponents.push({
                                type: 'parseMetamodel',
                                components: [
                                    scope.importFile.loadedFiles[fileIdx]
                                        .fileLocation,
                                    scope.importFile.delimiter,
                                    false,
                                    data[fileIdx].fileLocation,
                                ],
                                terminal: true,
                            });
                        }

                        if (pixelComponents.length === 0) {
                            scope.importCtrl.alert(
                                'warn',
                                'Cannot find Prop Files to parse.'
                            );
                            return undefined;
                        }

                        callback = function (response) {
                            var outputIdx,
                                outputLen,
                                parsedInformation = [];

                            for (
                                outputIdx = 0,
                                    outputLen = response.pixelReturn.length;
                                outputIdx < outputLen;
                                outputIdx++
                            ) {
                                if (
                                    response.pixelReturn[
                                        outputIdx
                                    ].operationType.indexOf('ERROR') > -1 ||
                                    response.pixelReturn[
                                        outputIdx
                                    ].operationType.indexOf('INVALID_SYNTAX') >
                                        -1
                                ) {
                                    return;
                                }

                                parsedInformation.push(
                                    response.pixelReturn[outputIdx].output
                                );
                            }

                            deferred.resolve(parsedInformation);
                        };

                        scope.importCtrl.query(pixelComponents, callback);

                        semossCoreService.emit('stop-loading', {
                            id: jobId,
                        });

                        return data;
                    });

                return deferred.promise;
            }

            return undefined;
        }

        /**
         * @name formatParsedFilesMetamodel
         * @param {array} files - loaded files
         * @param {array} parsedInformation - parsed information
         * @returns {array} parsedFiles
         */
        function formatParsedFilesMetamodel(files, parsedInformation) {
            var parsedFiles = [],
                parsedFileHolder = {},
                relationshipIdx,
                relationshipLen,
                table,
                typeInformation,
                columnIdx,
                columnLen,
                fileIdx,
                fileLen;

            for (
                fileIdx = 0, fileLen = files.length;
                fileIdx < fileLen;
                fileIdx++
            ) {
                parsedFileHolder = {
                    fileName: files[fileIdx].fileName,
                    fileLocation: files[fileIdx].fileLocation,
                    metamodel: {
                        // containers rendered information
                        tables: {},
                        relationships: [],
                    },
                    allTables: {},
                };

                // add the rendered information
                // add the relationships
                if (
                    parsedInformation[fileIdx] &&
                    parsedInformation[fileIdx].hasOwnProperty('relation')
                ) {
                    for (
                        relationshipIdx = 0,
                            relationshipLen =
                                parsedInformation[fileIdx].relation.length;
                        relationshipIdx < relationshipLen;
                        relationshipIdx++
                    ) {
                        // add the tables
                        if (
                            !parsedFileHolder.metamodel.tables.hasOwnProperty(
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable
                            )
                        ) {
                            parsedFileHolder.metamodel.tables[
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable
                            ] = {
                                alias: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable,
                                table: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable,
                                position:
                                    parsedInformation[fileIdx].positions &&
                                    parsedInformation[fileIdx].positions[
                                        parsedInformation[fileIdx].relation[
                                            relationshipIdx
                                        ].toTable
                                    ]
                                        ? parsedInformation[fileIdx].positions[
                                              parsedInformation[fileIdx]
                                                  .relation[relationshipIdx]
                                                  .toTable
                                          ]
                                        : {
                                              top: 0,
                                              left: 0,
                                          },
                                columns: {},
                            };

                            typeInformation = getParsedTypeInformation(
                                parsedInformation[fileIdx].dataTypes[
                                    parsedInformation[fileIdx].relation[
                                        relationshipIdx
                                    ].toTable
                                ],
                                parsedInformation[fileIdx].additionalDataTypes[
                                    parsedInformation[fileIdx].relation[
                                        relationshipIdx
                                    ].toTable
                                ]
                            );

                            parsedFileHolder.metamodel.tables[
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable
                            ].columns[
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable
                            ] = {
                                alias: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable,
                                column: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable,
                                table: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable,
                                isPrimKey: true,
                                type: typeInformation.type,
                                typeFormat: typeInformation.typeFormat,
                                description: '',
                                logical: [],
                            };
                        }

                        if (
                            !parsedFileHolder.metamodel.tables.hasOwnProperty(
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable
                            )
                        ) {
                            parsedFileHolder.metamodel.tables[
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable
                            ] = {
                                alias: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable,
                                table: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable,
                                position:
                                    parsedInformation[fileIdx].positions &&
                                    parsedInformation[fileIdx].positions[
                                        parsedInformation[fileIdx].relation[
                                            relationshipIdx
                                        ].fromTable
                                    ]
                                        ? parsedInformation[fileIdx].positions[
                                              parsedInformation[fileIdx]
                                                  .relation[relationshipIdx]
                                                  .fromTable
                                          ]
                                        : {
                                              top: 0,
                                              left: 0,
                                          },
                                columns: {},
                            };

                            typeInformation = getParsedTypeInformation(
                                parsedInformation[fileIdx].dataTypes[
                                    parsedInformation[fileIdx].relation[
                                        relationshipIdx
                                    ].fromTable
                                ],
                                parsedInformation[fileIdx].additionalDataTypes[
                                    parsedInformation[fileIdx].relation[
                                        relationshipIdx
                                    ].fromTable
                                ]
                            );

                            parsedFileHolder.metamodel.tables[
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable
                            ].columns[
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable
                            ] = {
                                alias: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable,
                                column: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable,
                                table: parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable,
                                isPrimKey: true,
                                type: typeInformation.type,
                                typeFormat: typeInformation.typeFormat,
                                description: '',
                                logical: [],
                            };
                        }

                        parsedFileHolder.metamodel.relationships.push({
                            fromTable:
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].fromTable,
                            fromColumn: '',
                            toTable:
                                parsedInformation[fileIdx].relation[
                                    relationshipIdx
                                ].toTable,
                            toColumn: '',
                            alias: parsedInformation[fileIdx].relation[
                                relationshipIdx
                            ].relName,
                        });
                    }
                }

                // add the props
                if (
                    parsedInformation[fileIdx] &&
                    parsedInformation[fileIdx].hasOwnProperty('nodeProp')
                ) {
                    for (table in parsedInformation[fileIdx].nodeProp) {
                        if (
                            parsedInformation[fileIdx].nodeProp.hasOwnProperty(
                                table
                            )
                        ) {
                            if (
                                !parsedFileHolder.metamodel.tables.hasOwnProperty(
                                    table
                                )
                            ) {
                                parsedFileHolder.metamodel.tables[table] = {
                                    alias: table,
                                    table: table,
                                    position:
                                        parsedInformation[fileIdx].positions &&
                                        parsedInformation[fileIdx].positions[
                                            table
                                        ]
                                            ? parsedInformation[fileIdx]
                                                  .positions[table]
                                            : {
                                                  top: 0,
                                                  left: 0,
                                              },
                                    columns: {},
                                };

                                typeInformation = getParsedTypeInformation(
                                    parsedInformation[fileIdx].dataTypes[table],
                                    parsedInformation[fileIdx]
                                        .additionalDataTypes[table]
                                );

                                parsedFileHolder.metamodel.tables[
                                    table
                                ].columns[table] = {
                                    alias: table,
                                    column: table,
                                    table: table,
                                    isPrimKey: true,
                                    type: typeInformation.type,
                                    typeFormat: typeInformation.typeFormat,
                                    description: '',
                                    logical: [],
                                };
                            }

                            for (
                                columnIdx = 0,
                                    columnLen =
                                        parsedInformation[fileIdx].nodeProp[
                                            table
                                        ].length;
                                columnIdx < columnLen;
                                columnIdx++
                            ) {
                                typeInformation = getParsedTypeInformation(
                                    parsedInformation[fileIdx].dataTypes[
                                        parsedInformation[fileIdx].nodeProp[
                                            table
                                        ][columnIdx]
                                    ],
                                    parsedInformation[fileIdx]
                                        .additionalDataTypes[
                                        parsedInformation[fileIdx].nodeProp[
                                            table
                                        ][columnIdx]
                                    ]
                                );

                                parsedFileHolder.metamodel.tables[
                                    table
                                ].columns[
                                    parsedInformation[fileIdx].nodeProp[table][
                                        columnIdx
                                    ]
                                ] = {
                                    alias: parsedInformation[fileIdx].nodeProp[
                                        table
                                    ][columnIdx],
                                    column: parsedInformation[fileIdx].nodeProp[
                                        table
                                    ][columnIdx],
                                    table: table,
                                    isPrimKey: false,
                                    type: typeInformation.type,
                                    typeFormat: typeInformation.typeFormat,
                                    description: '',
                                    logical: [],
                                };
                            }
                        }
                    }
                }

                // add the concept information
                for (table in parsedInformation[fileIdx].dataTypes) {
                    if (
                        parsedInformation[fileIdx].dataTypes.hasOwnProperty(
                            table
                        )
                    ) {
                        parsedFileHolder.allTables[table] = {
                            alias: table,
                            table: table,
                            position: {
                                top: 0,
                                left: 0,
                            },
                            columns: {},
                        };

                        typeInformation = getParsedTypeInformation(
                            parsedInformation[fileIdx].dataTypes[table],
                            parsedInformation[fileIdx].additionalDataTypes[
                                table
                            ]
                        );

                        parsedFileHolder.allTables[table].columns[table] = {
                            alias: table,
                            column: table,
                            table: table,
                            isPrimKey: true,
                            type: typeInformation.type,
                            typeFormat: typeInformation.typeFormat,
                            description: '',
                            logical: [],
                        };
                    }
                }

                parsedFiles.push(parsedFileHolder);
            }

            return parsedFiles;
        }

        /**
         * @name formatParsedFilesFlat
         * @param {array} files - loaded files
         * @param {array} parsedInformation - parsed information
         * @returns {array} parsedFiles
         */
        function formatParsedFilesFlat(files, parsedInformation) {
            var parsedFiles = [],
                parsedFileHolder = {},
                sheet,
                table,
                column,
                typeInformation,
                fileIdx,
                fileLen;

            for (
                fileIdx = 0, fileLen = files.length;
                fileIdx < fileLen;
                fileIdx++
            ) {
                parsedFileHolder = {
                    fileName: files[fileIdx].fileName,
                    fileLocation: files[fileIdx].fileLocation,
                    sheets: {},
                };

                // add the concept information
                for (sheet in parsedInformation[fileIdx]) {
                    if (parsedInformation[fileIdx].hasOwnProperty(sheet)) {
                        parsedFileHolder.sheets[sheet] = {
                            alias: sheet,
                            sheet: sheet,
                            tables: {},
                        };

                        for (table in parsedInformation[fileIdx][sheet]) {
                            if (
                                parsedInformation[fileIdx][
                                    sheet
                                ].hasOwnProperty(table)
                            ) {
                                parsedFileHolder.sheets[sheet].tables[table] = {
                                    alias: table,
                                    table: table,
                                    columns: {},
                                };

                                for (column in parsedInformation[fileIdx][
                                    sheet
                                ][table].dataTypes) {
                                    if (
                                        parsedInformation[fileIdx][sheet][
                                            table
                                        ].dataTypes.hasOwnProperty(column)
                                    ) {
                                        typeInformation =
                                            getParsedTypeInformation(
                                                parsedInformation[fileIdx][
                                                    sheet
                                                ][table].dataTypes[column],
                                                parsedInformation[fileIdx][
                                                    sheet
                                                ][table].additionalDataTypes[
                                                    column
                                                ]
                                            );

                                        parsedFileHolder.sheets[sheet].tables[
                                            table
                                        ].columns[column] = {
                                            alias: column,
                                            column: column,
                                            table: table,
                                            type: typeInformation.type,
                                            typeFormat:
                                                typeInformation.typeFormat,
                                            description: '',
                                            logical: [],
                                        };
                                    }
                                }
                            }
                        }
                    }
                }

                parsedFiles.push(parsedFileHolder);
            }

            return parsedFiles;
        }

        /**
         * @name getParsedTypeInformation
         * @param {string} type - data type to set
         * @param {string} typeFormat - typeFormat
         * @returns {object} map - containing the type information
         */
        function getParsedTypeInformation(type, typeFormat) {
            // var newType = type,
            //     newTypeFormat = typeFormat;

            // if (newType === 'INT' || newType === 'DOUBLE') {
            //     // ui considers int and double a type format for number,
            //     newTypeFormat = type;
            //     newType = 'NUMBER';
            // }

            // if ((newType === 'DATE' || newType === 'TIMESTAMP') && !typeFormat) {
            //     // needs type format, must tell user
            // }

            // if (!newType) {
            //     newType = 'STRING';
            //     newTypeFormat = '';
            // }

            return {
                type: type,
                typeFormat: typeFormat,
            };
        }

        /**
         * @name checkDisabled
         * @desc check to see if Next should be disabled
         * @returns {boolean} boolean for disabled
         */
        function checkDisabled() {
            var disabled = false;

            disabled = !scope.importFile.validateUpload();

            if (!scope.importCtrl.replace) {
                if (!disabled) {
                    disabled =
                        !scope.importCtrl.name.value ||
                        !scope.importCtrl.name.valid;
                }
            }

            return disabled;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.$watch('importFile.fileType', function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue)) {
                    setFileType();
                    onDatabaseChange();
                }
            });

            setFileType();
            if (
                scope.importFile.sentFileData &&
                scope.importFile.sentFileData.file
            ) {
                $timeout(function () {
                    scope.importFile.rawFiles.addFile(
                        scope.importFile.sentFileData.file
                    );
                });
            }
        }

        initialize();
    }
}
