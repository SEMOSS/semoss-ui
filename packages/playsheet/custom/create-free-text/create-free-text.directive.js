(function () {
    'use strict';

    angular.module("app.create-free-text.directive", [])
        .directive("createFreeText", createFreeText);

    createFreeText.$inject = ['$rootScope', '$timeout', 'alertService', 'monolithService', 'pkqlService', '$q', 'dataService'];

    function createFreeText($rootScope, $timeout, alertService, monolithService, pkqlService, $q, dataService) {
        createFreeTextLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        createFreeTextCtrl.$inject = ["$scope"];

        return {
            restrict: 'E',
            templateUrl: 'custom/create-free-text/create-free-text.directive.html',
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
                importType: "="
            },
            controllerAs: 'createFreeText',
            controller: createFreeTextCtrl,
            link: createFreeTextLink
        };

        function createFreeTextCtrl($scope) {
            var createFreeText = this;

            createFreeText.step = 1; //step of data
            createFreeText.pasteData = ""; //pasted in data
            createFreeText.connectionFrom = '';//from column (from MM)
            createFreeText.connectionTo = ''; // to column (from Paste/File Data)

            createFreeText.parseData = parseData;
            createFreeText.loadData = loadData;
            createFreeText.navigateToFirstStep = navigateToFirstStep;
            createFreeText.hideFreeText = hideFreeText;
            createFreeText.isEmpty = isEmpty;
            createFreeText.addTableJoin = addTableJoin;
            createFreeText.removeTableJoin = removeTableJoin;
            createFreeText.tableJoins = [];
            createFreeText.headerData = [];
            createFreeText.uniqueFileKey = {};
            createFreeText.allHeaders = [];
            createFreeText.checkValidJoins = checkValidJoins;
            // createFreeText.isValidDB = isValidDB;

            monolithService.getAllEngines().then(function (data) {
                createFreeText.allDbs = [];
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        createFreeText.allDbs.push(data[key].name);
                    }
                }

            });


            /*** Part 1 ***/
            /*** Paste ***/
            /*** File ***/


            /*** General ***/
            /**
             * @name addTableJoin
             * @desc add a new table join
             */
            function addTableJoin(fileName) {
                var newTableJoin = {
                    newConcept: {
                        headers: createFreeText.tableJoins[fileName][0].newConcept.headers,
                        selected: ""
                    },
                    existingConcept: {
                        headers: createFreeText.tableJoins[fileName][0].existingConcept.headers,
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

                createFreeText.tableJoins[fileName].push(newTableJoin);
            }

            /**
             * @name removeTableJoin
             * @desc remove a new table join
             */
            function removeTableJoin(fileName, index) {
                createFreeText.tableJoins[fileName].splice(index, 1);
            }

            /**
             * @name parseData
             * @desc calls function to get header information from BE
             */
            function parseData() {


                var newTableJoin = {}, existingHeaders = [];

                createFreeText.uniqueFileKey = {};
                createFreeText.headerData = [];
                createFreeText.allHeaders = [];
                createFreeText.tableJoins = {};
                createFreeText.step = 2;

                for (var node in createFreeText.addedNodes) { //setup existing headers to be merged later to allHeaders when doing multi file
                    existingHeaders.push({
                        name: node,
                        title: createFreeText.addedNodes[node].physicalName
                    });
                }

                if (createFreeText.pasteData) {
                    createFreeText.loadScreen = true;
                    if (!createFreeText.delimiter) {
                        createFreeText.delimiter = "\t";
                    }

                    if (!_.isEmpty(createFreeText.addedNodes)) { //if joining to existing table
                        newTableJoin = {
                            newConcept: {
                                headers: createFreeText.allHeaders,
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
                        if (createFreeText.tableJoins["Text"]) {
                            createFreeText.tableJoins["Text"].push(newTableJoin);
                        } else {
                            createFreeText.tableJoins["Text"] = [newTableJoin];
                        }
                    }

                    if (createFreeText.importType === "web") {
                        monolithService.determineDataTypesForImportData(createFreeText.pasteData, createFreeText.webSource).then(function (response) {
                            createFreeText.loadScreen = false;
                            formatHeaderData(response.headerData);
                        }, function (error) {
                            createFreeText.loadScreen = false;
                            console.log(error)
                        });
                    }
                }
                else {
                    alertService('No Text or File Found', 'Warning', 'toast-warning', 3000);
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
                        headers: []
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
                            type: headerData[sheet][header],
                            name: headerName,
                            fileName: fileName
                        };
                        sheetHolder.headers.push(headerObj);
                        createFreeText.allHeaders.push(headerObj);
                    }

                    createFreeText.headerData.push(sheetHolder);
                }

                return sheetHolder.headers;
            }

            /**
             * @name loadData
             * @desc gets the Headers of the Parsed File
             */
            function loadData() {

                var headerDataTypes = {};
                //TODO Make mainColumn Required?
                var mainColumns = {};

                for (var sheet in createFreeText.headerData) {
                    if (!headerDataTypes[createFreeText.headerData[sheet].title]) {
                        headerDataTypes[createFreeText.headerData[sheet].title] = {};
                    }
                    mainColumns[createFreeText.headerData[sheet].title] = createFreeText.headerData[sheet].mainColumn;


                    for (var header in createFreeText.headerData[sheet].headers) {
                        if (createFreeText.headerData[sheet].headers[header].selected) {
                            headerDataTypes[createFreeText.headerData[sheet].title][createFreeText.headerData[sheet].headers[header].title] = createFreeText.headerData[sheet].headers[header].type;
                        }
                    }

                    if (_.isEmpty(headerDataTypes[createFreeText.headerData[sheet].title])) {
                        delete headerDataTypes[createFreeText.headerData[sheet].title];
                        delete mainColumns[createFreeText.headerData[sheet].title];
                    }
                }

                if (!_.isEmpty(headerDataTypes)) {
                    var pkqlObject = {}, pkqlQuery = "", fileKey = "";
                    pkqlObject = {
                        tableJoins: [],
                        delimiter: createFreeText.delimiter
                    };
                    //TODO backend needs to set up pkql so that we can pass the header type info changed by the user
                    if (createFreeText.pasteData) {
                        pkqlObject.tableJoins = createFreeText.tableJoins["Text"] || [];
                        if (!_.isEmpty(createFreeText.uniqueFileKey) && createFreeText.importType === "files") {
                            pkqlQuery = pkqlService.generateFreeTextImportPKQLQuery(createFreeText.pasteData, pkqlObject);
                        } else if (createFreeText.importType === "web") {
                            pkqlQuery = pkqlService.generateUrlImportPKQLQuery(createFreeText.pasteData, createFreeText.webSource);
                        }
                    }

                    var fileCount = 0;
                    var fileKey = '';
                    for (var key in createFreeText.uniqueFileKey) {
                        if (createFreeText.uniqueFileKey.hasOwnProperty(key)) {
                            fileCount++;
                            fileKey = createFreeText.uniqueFileKey[key];
                        }
                    }


                    createFreeText.runDataFrameQuery().then(function () {
                        var currentWidget = dataService.getWidgetData();
                        pkqlService.executePKQL(currentWidget.insightId, pkqlQuery);
                    });
                }

                else if (!_.isEmpty(headerDataTypes)) {
                    alertService('Please Select Columns to Load', 'Warning', 'toast-warning', 3000);
                }
                else {
                    alertService('File Key Not Found', 'Warning', 'toast-warning', 3000);
                }
            }

            function checkValidJoins() {
                for (var i = 0; i < createFreeText.tableJoins.length; i++) {
                    if (!createFreeText.tableJoins[i].existingConcept.selected || !createFreeText.tableJoins[i].newConcept.selected || !createFreeText.tableJoins[i].joinType.selected) {
                        return true;
                    }
                }

                return false;
            }

            // function isValidDB() {
            //     return createFreeText.allDbs.indexOf(createFreeText.engineName) > -1;
            // }

            /*** General ***/
            /**
             * @name navigateToFirstStep
             * @desc goes to the first page
             */
            function navigateToFirstStep() {
                createFreeText.step = 1;
            }

            /**

             /*** Utility ***/
            /**
             * @name hideFreeText
             * @desc hides free text modal
             */
            function hideFreeText() {
                createFreeText.createHideFreeText();
            }

            /**
             * @name isEmpty
             * @desc returns bool based on if object/array is empty
             */
            function isEmpty(o) {
                return _.isEmpty(o)
            }

        }

        function createFreeTextLink(scope, ele, attrs, ctrl) {
            var createFreeTextUpdateListener = $rootScope.$on('update-data', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-data');
                scope.createFreeText.createHideFreeText();
            });

            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {

                if (scope.createFreeText.fileDataFromCreate && scope.createFreeText.fileDataFromCreate.files && scope.createFreeText.fileDataFromCreate.files.length > 0) {
                    for (var i = 0; i < scope.createFreeText.fileDataFromCreate.files.length; i++) {
                        var fileTimer = $timeout(function (i) {
                            scope.createFreeText.fileData.addFile(scope.createFreeText.fileDataFromCreate.files[i].file);
                        }.bind(null, i))
                    }
                }
                scope.createFreeText.sources = ['Amazon Product - Search', 'Amazon Product - Lookup', 'Import.io'];
                scope.createFreeText.webSource = scope.createFreeText.sources[0];
            }

            initialize();

            //cleanup
            scope.$on('$destroy', function () {
                createFreeTextUpdateListener();
                console.log('destroying createFreeText....');
            });
        }
    }
})();