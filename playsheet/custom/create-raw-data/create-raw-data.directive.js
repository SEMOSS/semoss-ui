(function () {
    'use strict';

    angular.module("app.create-raw-data.directive", [])
        .directive("createRawData", createRawData);

    createRawData.$inject = ['$rootScope', '$timeout', 'alertService', 'monolithService', 'pkqlService', '$q', 'dataService'];

    function createRawData($rootScope, $timeout, alertService, monolithService, pkqlService, $q, dataService) {
        createRawDataLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        createRawDataCtrl.$inject = ["$scope"];

        return {
            restrict: 'E',
            templateUrl: 'custom/create-raw-data/create-raw-data.directive.html',
            scope: {},
            bindToController: {
                frameType: "<",
                insightId: "=",
                widgetData: "=",
                fileDataFromCreate: "=",
                addedNodes: "=",
                createHideFreeText: "&",
                createMetamodel: "&",
                runDataFrameQuery: "&",
                setDataFrame: "&",
                importType: "=",
                dbName: "=?",
                showUpload: "=?",
                parsedFiles: "=?",
                uploadOptions: '=?'
            },
            controllerAs: 'createRawData',
            controller: createRawDataCtrl,
            link: createRawDataLink
        };

        function createRawDataCtrl($scope) {
            var createRawData = this;

            createRawData.step = 1; //step of data
            createRawData.pasteData = ""; //pasted in data
            createRawData.connectionFrom = '';//from column (from MM)
            createRawData.connectionTo = ''; // to column (from Paste/File Data)

            createRawData.checkFileExtension = checkFileExtension;
            createRawData.parseData = parseData;
            createRawData.loadData = loadData;
            createRawData.checkHeaders = checkHeaders;
            createRawData.navigateToFirstStep = navigateToFirstStep;
            createRawData.hideFreeText = hideFreeText;
            createRawData.isEmpty = isEmpty;
            createRawData.addTableJoin = addTableJoin;
            createRawData.removeTableJoin = removeTableJoin;
            createRawData.tableJoins = [];
            createRawData.headerData = [];
            createRawData.uniqueFileKey = {};
            createRawData.allHeaders = [];
            createRawData.checkValidJoins = checkValidJoins;
            createRawData.updateValidDB = updateValidDB;

            monolithService.getAllEngines().then(function (data) {
                createRawData.allDbs = [];
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        createRawData.allDbs.push(data[key].name);
                    }
                }

            });


            /*** Part 1 ***/
            /*** Paste ***/
            /*** File ***/
            /**
             * @name checkFileExtension
             * @param file flow file
             * @desc checks file extension (must be csv) and makes sure there is only one file added
             */
            function checkFileExtension(file) {
                /*if (createRawData.fileData.files.length > 0) {
                 alertService('Only Allowed to Load One File', 'File Type Error', 'toast-error', 3000);
                 return false
                 }*/
                
                var fileExtension = file.getExtension();
                //TODO enable xlsx and xlsm when they are done in the BE
                if (fileExtension === 'csv') {
                    if (createRawData.uploadType === 'excel') {
                        alertService('File types do not match.', 'File Type Error', 'toast-error', 3000);
                        return false;
                    }

                    createRawData.uploadType = 'csv';
                    return true;
                } else if (fileExtension === 'xlsx' || fileExtension === 'xlsm') {
                    if (createRawData.uploadType === 'csv') {
                        alertService('File types do not match.', 'File Type Error', 'toast-error', 3000);
                        return false;
                    }
                    createRawData.uploadType = 'excel';
                    return true;
                }

                alertService('Incorrect file type.', 'File Type Error', 'toast-error', 3000);
                return false
            }


            /*** General ***/
            /**
             * @name addTableJoin
             * @desc add a new table join
             */
            function addTableJoin(fileName) {
                var newTableJoin = {
                    newConcept: {
                        headers: createRawData.tableJoins[fileName][0].newConcept.headers,
                        selected: ""
                    },
                    existingConcept: {
                        headers: createRawData.tableJoins[fileName][0].existingConcept.headers,
                        selected: ""
                    },
                    joinType: {
                        options: [
                            {display: 'Inner Join', value: 'inner.join'},
                            {display: 'Partial Outer', value: 'left.outer.join'},
                            {display: 'Full Outer', value: 'outer.join'}
                        ],
                        selected: ""
                    }
                };

                createRawData.tableJoins[fileName].push(newTableJoin);
            }

            /**
             * @name removeTableJoin
             * @desc remove a new table join
             */
            function removeTableJoin(fileName, index) {
                createRawData.tableJoins[fileName].splice(index, 1);
            }

            /**
             * @name parseData
             * @desc calls function to get header information from BE
             */
            function parseData() {


                var newTableJoin = {}, existingHeaders = [];

                createRawData.uniqueFileKey = {};
                createRawData.headerData = [];
                createRawData.allHeaders = [];
                createRawData.tableJoins = {};
                createRawData.step = 2;

                for (var node in createRawData.addedNodes) { //setup existing headers to be merged later to allHeaders when doing multi file
                    existingHeaders.push({
                        name: node,
                        title: createRawData.addedNodes[node].physicalName
                    });
                }

                if (createRawData.pasteData) {
                    createRawData.loadScreen = true;
                    if (!createRawData.delimiter) {
                        createRawData.delimiter = "\t";
                    }

                    if (!_.isEmpty(createRawData.addedNodes)) { //if joining to existing table
                        newTableJoin = {
                            newConcept: {
                                headers: createRawData.allHeaders,
                                selected: ""
                            },
                            existingConcept: {
                                headers: existingHeaders,
                                selected: ""
                            },
                            joinType: {
                                options: [
                                    {display: 'Inner Join', value: 'inner.join'},
                                    {display: 'Partial Outer', value: 'left.outer.join'},
                                    {display: 'Full Outer', value: 'outer.join'}
                                ],
                                selected: ""
                            }
                        };
                        if (createRawData.tableJoins["Text"]) {
                            createRawData.tableJoins["Text"].push(newTableJoin);
                        } else {
                            createRawData.tableJoins["Text"] = [newTableJoin];
                        }
                    }

                    if (createRawData.importType === "files") {
                        monolithService.determineDataTypesForFile(createRawData.pasteData, createRawData.delimiter).then(function (response) {
                            createRawData.loadScreen = false;
                            createRawData.uniqueFileKey["Text Data"] = response.uniqueFileKey;
                            //createRawData.headerData = response.data
                            formatHeaderData(response.headerData);
                        }, function (error) {
                            createRawData.loadScreen = false;
                            console.log(error)
                        });
                    }
                } else if (createRawData.fileData && createRawData.fileData.files.length > 0) {
                    // var dataTypeCalls = [], fileNames = [];

                    createRawData.loadScreen = true;
                    if (!createRawData.delimiter) {
                        createRawData.delimiter = ",";
                    }

                    if (!createRawData.parsedFiles) {
                        if (createRawData.uploadType === 'csv') {
                            monolithService.csvFileUpload(createRawData.fileData.files, [], {}, 'table', createRawData.delimiter).then(function (data) {
                                var parsedFiles = [];

                                if (data.messages) {
                                    for (var i = 0; i < data.messages.length; i++) {
                                        if (data.messages[i].type === 'alert') {
                                            alertService(data.messages[0].text, 'Upload Warning', 'toast-warning');
                                        }
                                        if (data.messages[i].type === 'success') {
                                            alertService(data.messages[0].text, 'Upload Success', 'toast-success');
                                        }
                                        if (data.messages[i].type === 'error') {
                                            alertService(data.messages[0].text, 'Upload Error', 'toast-error');
                                        }
                                    }
                                }


                                for (var i = 0; i < data.metaModelData.length; i++) {
                                    var currentFile = data.metaModelData[i];
                                    //select the last header
                                    var selectedDataTypes = [];
                                    for (var j in data.metaModelData[i].dataTypes) {
                                        selectedDataTypes[j] = data.metaModelData[i].dataTypes[j];
                                    }
                                    parsedFiles[i] = {
                                        name: data.metaModelData[i].fileName,
                                        fileLocation: data.metaModelData[i].fileLocation,
                                        propFileDisplayNames: [],
                                        propFileNodeProp: data.metaModelData[i].propFileNodeProp || [],
                                        propFileRel: data.metaModelData[i].propFileRel || [],
                                        propDataTypes: [],// data.metaModelData[i].allowable,
                                        headers: _.keys(data.metaModelData[i].dataTypes) || [],
                                        minRowCount: data.metaModelData[i].startCount,
                                        maxRowCount: data.metaModelData[i].endCount,
                                        readRange: [data.metaModelData[i].startCount, data.metaModelData[i].endCount],
                                        headerDataTypes: data.metaModelData[i].dataTypes ? selectedDataTypes : currentFile.dataTypes
                                    };
                                    if (currentFile.headerModifications) {
                                        parsedFiles[i].headerModifications = currentFile.headerModifications;
                                    }
                                }
                                createRawData.parsedFiles = parsedFiles;
                                addParsedFilesToHeaderData();
                            });
                        } else {
                            //parse excel
                            monolithService.excelFileUpload(createRawData.fileData.files, 'table').then(function (data) {
                                var parsedFiles = [];
                                for (var i = 0; i < data.metaModelData.length; i++) {
                                    var currentFile = data.metaModelData[i];

                                    parsedFiles[i] = {
                                        name: data.metaModelData[i].fileName,
                                        fileLocation: data.metaModelData[i].fileLocation,
                                        sheets: data.metaModelData[i].dataTypes
                                    };

                                    if (currentFile.headerModifications) {
                                        parsedFiles[i].headerModifications = currentFile.headerModifications;
                                    }
                                }
                                createRawData.parsedFiles = parsedFiles;
                                addParsedFilesToHeaderData();
                            });
                        }
                    } else {
                        addParsedFilesToHeaderData();
                    }

                    // for (var i = 0; i < createRawData.fileData.files.length; i++) {
                    //     dataTypeCalls.push(monolithService.determineDataTypesForFile(createRawData.fileData.files[i].file, createRawData.delimiter));
                    //     fileNames.push(createRawData.fileData.files[i].file.name);
                    //     //console.log(createRawData.fileData.files[i].file);
                    //     /*monolithService.determineDataTypesForFile(createRawData.fileData.files[i].file, createRawData.delimiter)
                    //      .then(function (response) {
                    //      createRawData.loadScreen = false;
                    //      createRawData.uniqueFileKey = response.uniqueFileKey;
                    //      //createRawData.headerData = response.data
                    //      formatHeaderData(response.headerData, createRawData.fileData.files[i].file.name);
                    //      }, function (error) {
                    //      createRawData.loadScreen = false;
                    //      console.log(error)
                    //      });*/
                    // }
                    // }

                    //
                    // $q.all(dataTypeCalls).then(function (response) {
                    //     createRawData.loadScreen = false;
                    //     var tempAllHeaders = angular.copy(existingHeaders);
                    //
                    //     for (var i = 0; i < response.length; i++) {
                    //         createRawData.uniqueFileKey[fileNames[i]] = response[i].uniqueFileKey;
                    //         var currentHeaders = formatHeaderData(response[i].headerData, fileNames[i]);
                    //         if (i !== 0 || createRawData.insightId !== "new") {
                    //             newTableJoin = {
                    //                 newConcept: {
                    //                     headers: currentHeaders,
                    //                     selected: ""
                    //                 },
                    //                 existingConcept: {
                    //                     headers: tempAllHeaders,
                    //                     selected: ""
                    //                 },
                    //                 joinType: {
                    //                     options: [
                    //                         {display: 'Inner Join', value: 'inner.join'},
                    //                         {display: 'Partial Outer', value: 'left.outer.join'},
                    //                         {display: 'Full Outer', value: 'outer.join'}
                    //                     ],
                    //                     selected: ""
                    //                 },
                    //                 newFile: fileNames[i]
                    //             };
                    //             if (createRawData.tableJoins[fileNames[i]]) {
                    //                 createRawData.tableJoins[fileNames[i]].push(newTableJoin);
                    //             } else {
                    //                 createRawData.tableJoins[fileNames[i]] = [newTableJoin];
                    //             }
                    //         }
                    //         tempAllHeaders = existingHeaders.concat(angular.copy(createRawData.allHeaders));
                    //     }
                    //
                    //     //createRawData.headerData = response.data
                    // }, function (error) {
                    //     createRawData.loadScreen = false;
                    //     console.log(error)
                    // });
                }
                else {
                    alertService('No Text or File Found', 'Warning', 'toast-warning', 3000);
                }
            }

            function addParsedFilesToHeaderData() {
                //game plan is to take the binded data in parsedFiles and plug it in the right place to skip making a duplicate
                //but slightly different backend call below

                //must be refactored because this whole directive isn't good - Jon
                var files = createRawData.parsedFiles;
                createRawData.loadScreen = false;

                for (var i = 0; i < files.length; i++) {
                    if (files[i].sheets) {
                        formatHeaderData(files[i].sheets, files[i].name);
                    } else {
                        var dataHeaders = {};
                        dataHeaders[files[i].name] = files[i].headerDataTypes;
                        formatHeaderData(dataHeaders, files[i].name);
                        if (files[i].headerModifications) {
                            for (var modifiedHeader in files[i].headerModifications) {
                                for (var j = 0; j < createRawData.headerData[i].headers.length; j++) {
                                    var header = createRawData.headerData[i].headers[j];
                                    if (header.title === modifiedHeader) {
                                        header.modifiedHeader = files[i].headerModifications[modifiedHeader];
                                    }
                                }
                            }
                        }
                    }
                }
            }


            /*** Part 2 ***/
            /*** Data ***/
            /**
             * @name formatHeaderData
             * @param headerData header data of each file/pasted data
             * @param fileName name of the file if loading files
             * @desc draws the Headers of the Parsed File
             */
            function formatHeaderData(headerData, fileName) {
                for (var sheet in headerData) {
                    var sheetHolder = {
                        title: sheet,
                        open: true,
                        mainColumn: null,
                        headers: [],
                        fileName: fileName ? fileName : false
                    };

                    for (var header in headerData[sheet]) {
                        var headerName = "";
                        if (fileName) {
                            headerName = fileName + ": " + header;
                        } else {
                            headerName = header;
                        }

                        var headerObj = {
                            selected: true,
                            title: header,
                            originalTitle: header,
                            type: headerData[sheet][header],
                            name: headerName,
                            fileName: fileName,
                            invalidHeader: false,
                            modifiedHeader: false
                        };

                        sheetHolder.headers.push(headerObj);
                        createRawData.allHeaders.push(headerObj);
                    }

                    createRawData.headerData.push(sheetHolder);
                }
                return sheetHolder.headers;
            }

            function calculateHeaderData() {
                var headersToSend = [];

                if (createRawData.uploadType === 'csv') {
                    for (var i = 0; i < createRawData.headerData.length; i++) {
                        headersToSend[i] = {};
                        headersToSend[i].headers = [];
                        headersToSend[i].dataTypes = [];
                        for (var k = 0; k < createRawData.headerData[i].headers.length; k++) {
                            if (createRawData.headerData[i].headers[k].selected) {
                                headersToSend[i].headers.push(createRawData.headerData[i].headers[k].title);
                                headersToSend[i].dataTypes.push(createRawData.headerData[i].headers[k].type);
                            }
                        }
                        if (headersToSend[i].headers.length === 0) {
                            return false;
                        }
                    }
                } else {
                    //type is excel
                    //have to use parsed files here because the name of the parsed files doesnt contain the extension
                    for (var i = 0; i < createRawData.parsedFiles.length; i++) {
                        headersToSend[i] = {};
                        var currentFileName = createRawData.parsedFiles[i].name;
                        for (var sheetIndex = 0; sheetIndex < createRawData.headerData.length; sheetIndex++) {
                            var sheet = createRawData.headerData[sheetIndex];
                            if (currentFileName === sheet.fileName) {
                                if (!headersToSend[i][sheet.title]) {
                                    headersToSend[i][sheet.title] = {};
                                    headersToSend[i][sheet.title].headers = [];
                                    headersToSend[i][sheet.title].dataTypes = [];
                                }
                                for (var headerIndex = 0; headerIndex < sheet.headers.length; headerIndex++) {
                                    if (sheet.headers[headerIndex].selected) {
                                        headersToSend[i][sheet.title].headers.push(sheet.headers[headerIndex].title);
                                        headersToSend[i][sheet.title].dataTypes.push(sheet.headers[headerIndex].type);
                                    }
                                }
                                if (headersToSend[i][sheet.title].headers.length === 0) {
                                    return false;
                                }
                            }
                        }
                    }
                }

                return headersToSend;

            }

            function calculateUpdatedHeaders() {
                var userHeaders;
                if (createRawData.parsedFiles) {
                    if (createRawData.uploadType === 'csv') {
                        userHeaders = {};
                        for (var i = 0; i < createRawData.fileData.files.length; i++) {
                            // var fileName = createRawData.fileData.files[i].name;
                            var fileLocation = createRawData.parsedFiles[i].fileLocation;
                            for (var headerIndex = 0; headerIndex < createRawData.headerData[i].headers.length; headerIndex++) {
                                var header = createRawData.headerData[i].headers[headerIndex];
                                if (header.title !== header.originalTitle && header.selected) {
                                    if (!userHeaders[fileLocation]) {
                                        userHeaders[fileLocation] = {};
                                    }
                                    userHeaders[fileLocation][header.originalTitle] = header.title;
                                }
                            }
                        }
                    } else {
                        userHeaders = [];
                        for (var i = 0; i < createRawData.parsedFiles.length; i++) {
                            userHeaders[i] = {};
                            var currentFileName = createRawData.parsedFiles[i].name;
                            for (var sheetIndex = 0; sheetIndex < createRawData.headerData.length; sheetIndex++) {
                                var sheet = createRawData.headerData[sheetIndex];
                                if (currentFileName === sheet.fileName) {
                                    for (var headerIndex = 0; headerIndex < sheet.headers.length; headerIndex++) {
                                        var header = sheet.headers[headerIndex];
                                        if (header.title !== header.originalTitle && header.selected) {
                                            if (!userHeaders[i][sheet.title]) {
                                                userHeaders[i][sheet.title] = {};
                                            }
                                            userHeaders[i][sheet.title][header.originalTitle] = header.title;
                                        }
                                    }
                                }
                            }

                        }
                    }
                }
                return userHeaders;

            }

            function checkHeaders() {
                if (createRawData.fileData.files.length > 0) {
                    var fileName = createRawData.fileData.files[0].name;
                    var extension = fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
                    if (extension === 'csv') {
                        createRawData.uploadType = 'csv';
                    } else if (extension === 'xls' || extension === 'xlsx' || extension === 'xlsm') {
                        createRawData.uploadType = 'excel';
                    } else {
                        createRawData.uploadType = '';
                    }
                }
                if (createRawData.changedHeaderName) {
                    createRawData.cleanHeaders = true;
                    //user changed the headers, so need to send to backend to make sure that they are still okay to be used
                    var userHeaders;
                    var data = {};
                    for (var i = 0; i < createRawData.fileData.files.length; i++) {

                        if (createRawData.uploadType === 'csv') {
                            if (!userHeaders) {
                                userHeaders = {};
                            }
                            userHeaders[fileName] = [];
                            for (var headerIndex = 0; headerIndex < createRawData.headerData[i].headers.length; headerIndex++) {
                                var header = createRawData.headerData[i].headers[headerIndex];
                                if (header.selected) {
                                    userHeaders[fileName].push(header.title);
                                }
                            }
                        } else {
                            //excel logic
                            //complicated ish - sets up the headers in an order for the backend
                            var currentFileName = createRawData.parsedFiles[i].name;
                            if (!userHeaders) {
                                userHeaders = [];
                            }
                            var sheetData = {};
                            for (var sheetIndex = 0; sheetIndex < createRawData.headerData.length; sheetIndex++) {
                                var sheet = createRawData.headerData[sheetIndex];
                                if (currentFileName === sheet.fileName) {
                                    if (!sheetData[sheet.title]) {
                                        sheetData[sheet.title] = [];
                                    }
                                    for (var headerIndex = 0; headerIndex < sheet.headers.length; headerIndex++) {
                                        sheetData[sheet.title].push(sheet.headers[headerIndex].title);
                                    }
                                }
                            }
                            userHeaders.push(sheetData);
                        }

                    }

                    data.userHeaders = userHeaders;
                    data.uploadType = createRawData.uploadType;

                    monolithService.checkHeaders(data).then(function (response) {
                        for (var i = 0; i < createRawData.fileData.files.length; i++) {
                            var fileName = createRawData.fileData.files[i].name;
                            if (createRawData.uploadType === 'csv') {
                                for (var headerIndex = 0; headerIndex < createRawData.headerData[i].headers.length; headerIndex++) {
                                    var header = createRawData.headerData[i].headers[headerIndex];
                                    if (response && response[fileName] && response[fileName][header.title]) {
                                        createRawData.cleanHeaders = false;
                                        header.invalidHeader = response[fileName][header.title];
                                    } else {
                                        header.invalidHeader = false;
                                    }
                                }
                            } else {
                                var currentFileName = createRawData.parsedFiles[i].name;
                                for (var sheetIndex = 0; sheetIndex < createRawData.headerData.length; sheetIndex++) {
                                    var sheet = createRawData.headerData[sheetIndex];
                                    if (currentFileName === sheet.fileName) {
                                        for (var headerIndex = 0; headerIndex < sheet.headers.length; headerIndex++) {
                                            var header = sheet.headers[headerIndex];
                                            if (response && response[i] && response[i][sheet.title] && response[i][sheet.title][header.title]) {
                                                createRawData.cleanHeaders = false;
                                                header.invalidHeader = response[i][sheet.title][header.title];
                                            } else {
                                                header.invalidHeader = false;
                                            }
                                        }
                                    }
                                }
                            }

                        }
                        if (createRawData.cleanHeaders) {
                            loadData();
                        }
                    });
                } else {
                    loadData();
                }
            }


            /**
             * @name loadData
             * @desc gets the Headers of the Parsed File
             */
            function loadData() {

                //  CODE for drop flat table. Creates DB through pkql
                if (createRawData.fileData && createRawData.fileData.files.length > 0) {
                    var data = {};
                    if (createRawData.uploadOptions && createRawData.uploadOptions.databaseImportOption) {
                        data.importMethod = createRawData.uploadOptions.databaseImportOption;
                    } else {
                        data.importMethod = 'Create new database engine';
                    }

                    data.dbName = createRawData.dbName;
                    if (!data.dbName) {
                        //just use the file name with the date if no db name exists
                        var str = createRawData.uniqueFileKey[createRawData.fileData.files[0].name];
                        if (!str) {

                            str = createRawData.parsedFiles[0].fileLocation;
                        }
                        //but only use db name after the last slash
                        var n = str.lastIndexOf("\\");
                        var result = str.substring(n + 1);
                        //and before the file type
                        result = result.substr(0, result.indexOf('.'));
                        //and without spaces...
                        result = result.replace(/ /g, "_");
                        data.dbName = result;
                    }
                    data.file = '';
                    for (var i = 0; i < createRawData.fileData.files.length; i++) {
                        if (i > 0) {
                            data.file += ';';
                        }
                        var fileName = createRawData.uniqueFileKey[createRawData.fileData.files[i].name];
                        if (fileName) {
                            data.file += fileName;
                        } else {
                            data.file += createRawData.parsedFiles[i].fileLocation;
                        }
                    }


                    data.headerData = calculateHeaderData();
                    data.newHeaders = calculateUpdatedHeaders();

                    if (!data.headerData) {
                        alertService('Please select at least 1 header', 'No Selected Headers', 'toast-warning');
                    } else {
                        if (createRawData.uploadType === 'csv') {
                            if (true) {
                                createInMemoryTable();
                            } else {
                                monolithService.csvFlatUpload(data).then(function (response) {
                                    var query = pkqlService.generateFlatFileUploadQuery(data.dbName);
                                    var currentWidget = dataService.getWidgetData();
                                    pkqlService.executePKQL(currentWidget.insightId, query);
                                    dataService.openWidget(null, 'create');
                                }, function (error) {
                                    console.log(error);
                                });
                            }
                        } else {
                            //make excel call
                            monolithService.excelFlatUpload(data).then(function (response) {
                                var currentWidget = dataService.getWidgetData();
                                pkqlService.executePKQL(currentWidget.insightId, query);
                                dataService.openWidget(null, 'create');
                            }, function (error) {
                                console.log(error);
                            });
                        }


                    }


                } else {
                    createInMemoryTable();

                }

            }

            function createInMemoryTable() {
                var headerDataTypes = {};
                //TODO Make mainColumn Required?
                var mainColumns = {};

                for (var sheet in createRawData.headerData) {
                    if (!headerDataTypes[createRawData.headerData[sheet].title]) {
                        headerDataTypes[createRawData.headerData[sheet].title] = {};
                    }
                    mainColumns[createRawData.headerData[sheet].title] = createRawData.headerData[sheet].mainColumn;


                    for (var header in createRawData.headerData[sheet].headers) {
                        if (createRawData.headerData[sheet].headers[header].selected) {
                            headerDataTypes[createRawData.headerData[sheet].title][createRawData.headerData[sheet].headers[header].title] = createRawData.headerData[sheet].headers[header].type;
                        }
                    }

                    if (_.isEmpty(headerDataTypes[createRawData.headerData[sheet].title])) {
                        delete headerDataTypes[createRawData.headerData[sheet].title];
                        delete mainColumns[createRawData.headerData[sheet].title];
                    }
                }

                if (!_.isEmpty(headerDataTypes)) {
                    var pkqlObject = {}, pkqlQuery = "", fileKey = "";
                    pkqlObject = {
                        tableJoins: [],
                        delimiter: createRawData.delimiter
                    };
                    //TODO backend needs to set up pkql so that we can pass the header type info changed by the user
                    if (createRawData.pasteData) {
                        pkqlObject.tableJoins = createRawData.tableJoins["Text"] || [];
                        if (!_.isEmpty(createRawData.uniqueFileKey) && createRawData.importType === "files") {
                            pkqlQuery = pkqlService.generateFreeTextImportPKQLQuery(createRawData.pasteData, pkqlObject);
                        }
                    } else if (!_.isEmpty(createRawData.uniqueFileKey) && createRawData.fileData.files.length === 1) {
                        pkqlObject.tableJoins = createRawData.tableJoins[createRawData.fileData.files[0].name] || [];
                        fileKey = createRawData.uniqueFileKey[createRawData.fileData.files[0].name];
                        pkqlObject.selectors = [];
                        for (var i = 0; i < createRawData.allHeaders.length; i++) { // select all headers
                            if (createRawData.allHeaders[i].fileName === createRawData.fileData.files[0].name) {
                                pkqlObject.selectors.push(createRawData.allHeaders[i].title);
                            }
                        }
                        pkqlQuery = pkqlService.generateFileImportPKQLQuery(fileKey, pkqlObject);
                    } else {

                        if (_.isEmpty(createRawData.addedNodes)) {//create the first file as a table first
                            fileKey = createRawData.parsedFiles[0].fileLocation;
                            pkqlObject.selectors = [];
                            pkqlObject.types = [];
                            for (var i = 0; i < createRawData.allHeaders.length; i++) { // select all headers
                                if (createRawData.allHeaders[i].fileName === createRawData.parsedFiles[0].name && createRawData.allHeaders[i].selected) {
                                    pkqlObject.selectors.push(createRawData.allHeaders[i].title);
                                    pkqlObject.types.push(createRawData.allHeaders[i].type)
                                }
                            }

                            pkqlQuery = pkqlService.generateFileImportPKQLQuery(fileKey, {
                                selectors: pkqlObject.selectors,
                                delimiter: createRawData.delimiter,
                                tableJoins: [],
                                types: pkqlObject.types
                            });
                        }
                        var fileCount = 0;
                        for (var file in createRawData.tableJoins) { //then join the rest to the table by chaini
                            pkqlObject.tableJoins = createRawData.tableJoins[file];
                            pkqlObject.selectors = [];
                            for (var j = 0; j < createRawData.allHeaders.length; j++) { // select all headers
                                if (createRawData.allHeaders[j].fileName === file && createRawData.allHeaders[j].selected) {
                                    pkqlObject.selectors.push(createRawData.allHeaders[j].title);
                                }
                            }
                            pkqlQuery += pkqlService.generateFileImportPKQLQuery(fileKey, pkqlObject);
                            fileCount++;
                        }
                    }
                    pkqlQuery += 'panel[0].viz(Grid, []);';

                    runDataFrameQuery().then(function () {
                        var currentWidget = dataService.getWidgetData();
                        pkqlService.executePKQL(currentWidget.insightId, pkqlQuery)
                            .then(function () {
                                dataService.toggleWidgetHandle('visual');
                            });
                    });
                }

                else if (!_.isEmpty(headerDataTypes)) {
                    alertService('Please Select Columns to Load', 'Warning', 'toast-warning', 3000);
                }
                else {
                    alertService('File Key Not Found', 'Warning', 'toast-warning', 3000);
                }

            }

            /**
             * @name runDataFrameQuery
             * @param clearDataFrame
             * @desc run the dataframe query which will clear the dataframe
             * @returns {*}
             */
            function runDataFrameQuery(clearDataFrame) {
                var deferredPromise = $q.defer();
                if (_.isEmpty(createRawData.addedNodes) || clearDataFrame || !createRawData.insightHasNodes) {
                    if (!createRawData.frameType) {
                        createRawData.frameType = 'grid';
                    }
                    var dataFrameQuery = pkqlService.generateDataFrameQuery(createRawData.frameType);
                    var currentWidget = dataService.getWidgetData();
                    pkqlService.executePKQL(currentWidget.insightId, dataFrameQuery).then(function (response) {
                        createRawData.insightHasNodes = false;
                        deferredPromise.resolve();
                    });
                } else {
                    deferredPromise.resolve();
                }

                return deferredPromise.promise;
            }

            function checkValidJoins() {
                for (var i = 0; i < createRawData.tableJoins.length; i++) {
                    if (!createRawData.tableJoins[i].existingConcept.selected || !createRawData.tableJoins[i].newConcept.selected || !createRawData.tableJoins[i].joinType.selected) {
                        return true;
                    }
                }

                return false;
            }

            function updateValidDB() {
                if (createRawData.allDbs.indexOf(createRawData.engineName) > -1) {
                    createRawData.validDB = false;
                } else {
                    createRawData.validDB = true;
                }
            }

            /*** General ***/
            /**
             * @name navigateToFirstStep
             * @desc goes to the first page
             */
            function navigateToFirstStep() {
                if (createRawData.showUpload) {
                    createRawData.showUpload = false;
                } else {
                    createRawData.step = 1;
                }

            }

            /**

             /*** Utility ***/
            /**
             * @name hideFreeText
             * @desc hides raw data modal
             */
            function hideFreeText() {

                if (createRawData.showUpload) {
                    createRawData.showUpload = false;
                } else {
                    createRawData.createHideFreeText();
                }

            }

            /**
             * @name isEmpty
             * @desc returns bool based on if object/array is empty
             */
            function isEmpty(o) {
                return _.isEmpty(o)
            }

        }

        function createRawDataLink(scope, ele, attrs, ctrl) {
            var createRawDataUpdateListener = $rootScope.$on('update-data', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-data');
                scope.createRawData.createHideFreeText();
            });

            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
                scope.createRawData.createFullDB = false;
                scope.createRawData.cleanHeaders = true;
                scope.createRawData.showChangeHeaderOptions = {};
                if (scope.createRawData.fileDataFromCreate && scope.createRawData.fileDataFromCreate.files && scope.createRawData.fileDataFromCreate.files.length > 0) {
                    for (var i = 0; i < scope.createRawData.fileDataFromCreate.files.length; i++) {
                        var fileTimer = $timeout(function (i) {
                            scope.createRawData.fileData.addFile(scope.createRawData.fileDataFromCreate.files[i].file);
                        }.bind(null, i))
                    }
                }

                //checks if this is coming from upload, if so jumps to step 2 and parses the data
                //UPDATE should always be true below now that this directive is separated from the one used in create
                if (scope.createRawData.showUpload) {
                    scope.createRawData.fileData = scope.createRawData.fileDataFromCreate;
                    scope.createRawData.createFullDB = true;
                    scope.createRawData.parseData();
                    scope.createRawData.step = 2;
                }
            }

            initialize();

            //cleanup
            scope.$on('$destroy', function () {
                createRawDataUpdateListener();
                console.log('destroying createRawData....');
            });
        }
    }
})();