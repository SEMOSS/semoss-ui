(function () {
    'use strict';

    /**
     * @name save-panel.directive.js
     * @desc save-panel saves visualizations
     */
    angular.module('app.save-panel.directive', [])
        .directive('savePanel', savePanel);

    savePanel.$inject = ['$rootScope', 'monolithService', 'widgetConfigService', 'alertService', 'dataService', 'pkqlService'];

    function savePanel($rootScope, monolithService, widgetConfigService, alertService, dataService, pkqlService) {

        savePanelCtrl.$inject = ['_'];
        savePanelLink.$inject = ['scope', 'ele', 'attrs'];

        return {
            restrict: 'E',
            templateUrl: 'custom/save-panel/save-panel.directive.html',
            controller: savePanelCtrl,
            link: savePanelLink,
            scope: {},
            bindToController: {},
            controllerAs: 'savePanel'
        };

        function savePanelCtrl(_) {
            var savePanel = this;

            var chartData, insightData;


            //Functions
            savePanel.saveViz = saveViz;
            savePanel.cancel = cancel;
            savePanel.getPerspectivesForEngine = getPerspectivesForEngine;
            savePanel.selectDefaultValue = selectDefaultValue;
            savePanel.resetDefaultValues = resetDefaultValues;
            savePanel.getDefaultValues = getDefaultValues;
            savePanel.selectAll = selectAll;
            savePanel.validateDbName = validateDbName;

            /**
             * @name selectAll
             * @desc select all defaultValues from the list
             */
            function selectAll(headerIndex) {
                if (savePanel.availableParameters.list[headerIndex].defaultValues.selectAll) {
                    savePanel.availableParameters.list[headerIndex].defaultValues.selected = [];
                    savePanel.availableParameters.list[headerIndex].defaultValues.selectAll = false;
                } else {
                    savePanel.availableParameters.list[headerIndex].defaultValues.selected = angular.copy(savePanel.availableParameters.list[headerIndex].defaultValues.list);
                    savePanel.availableParameters.list[headerIndex].defaultValues.selectAll = true;
                }
            }

            /**
             * @name getDefaultValues
             * @desc gets the list of values for the default values list
             */
            function getDefaultValues(headerIndex) {
                var list = [], pkqlQuery = "";

                if (savePanel.availableParameters.list[headerIndex].instanceOrigin.selected === "User") {
                    //take it in as comma separated list of options and we will split and change to array
                    if (savePanel.availableParameters.list[headerIndex].instanceOrigin.inputs.User.trim()) {
                        list = savePanel.availableParameters.list[headerIndex].instanceOrigin.inputs.User.split(",");
                        if (!list[list.length - 1]) { //dont add empty spaces as an option
                            list.splice(list.length - 1, 1);
                        }
                    }
                } else if (savePanel.availableParameters.list[headerIndex].instanceOrigin.selected === "Database") {
                    //run pkql to get instances from database
                    var selectedEngine = savePanel.availableParameters.list[headerIndex].dbs.selected;
                    pkqlQuery = pkqlService.generateEngineInstanceQuery(selectedEngine, savePanel.availableParameters.list[headerIndex].physicalNames[selectedEngine]);

                    //TODO run the pkql...do we need a new call without a need for insightid?
                } else if (savePanel.availableParameters.list[headerIndex].instanceOrigin.selected === "Query") {
                    //run the custom query
                    pkqlQuery = savePanel.availableParameters.list[headerIndex].instanceOrigin.inputs.Query;
                    //technically don't need an insightID to run against...is there a generic way of running a pkql? should we do "new" and then drop the new dataframe immediately after we get the data?
                    monolithService.runPKQLQuery(chartData.insightID, pkqlQuery)
                        .then(function (data) {
                            console.log(data);
                        });
                }

                savePanel.availableParameters.list[headerIndex].defaultValues.list = list;
                savePanel.availableParameters.list[headerIndex].defaultValues.selectAll = false;
                savePanel.availableParameters.list[headerIndex].defaultValues.selected = [];
            }

            /**
             * @name resetDefaultValues
             * @desc reset the values in the list
             */
            function resetDefaultValues(headerIndex) {
                savePanel.availableParameters.list[headerIndex].defaultValues = {
                    show: false,
                    selectAll: false,
                    list: [],
                    selected: []
                };
            }

            /**
             * @name selectDefaultValue
             * @desc registers the selected default  value/s
             */
            function selectDefaultValue(header, value) {
                if (savePanel.availableParameters.list[header].multiSelect) {
                    //multiselect
                    //savePanel.availableParameters.list[header].defaultValues.selected.push(value);
                    if (savePanel.availableParameters.list[header].defaultValues.selected.length === savePanel.availableParameters.list[header].defaultValues.list.length) {
                        savePanel.availableParameters.list[header].defaultValues.selectAll = true;
                    } else {
                        savePanel.availableParameters.list[header].defaultValues.selectAll = false;
                    }
                } else {
                    //single select
                    savePanel.availableParameters.list[header].defaultValues.selected = [value];
                }
            }

            /**
             * @name saveViz
             * @param saveType - Type of Save
             * @desc saves visualization based on save type
             */
            function saveViz(saveType) {
                if (savePanel.newPerspective.name !== "") {
                    savePanel.perspectives.selected = savePanel.newPerspective.name;
                }

                var selectedParams = [], pkqlQuery = "";
                for (var param in savePanel.availableParameters.list) {
                    if (savePanel.availableParameters.list[param].selected) {
                        //in here we will create the pkql for user.input and push into selectedParams.
                        var selectedEngine = savePanel.availableParameters.list[param].dbs.selected,
                            selectAmount = "1",
                            paramName = savePanel.availableParameters.list[param].physicalNames[selectedEngine],
                            defaultValues = savePanel.availableParameters.list[param].defaultValues.selected,
                            queryComponents = "";

                        if (savePanel.availableParameters.list[param].multiSelect) {
                            selectAmount = "0";
                        }

                        if (savePanel.availableParameters.list[param].instanceOrigin.selected === "User") {
                            queryComponents = savePanel.availableParameters.list[param].instanceOrigin.inputs.User;
                        } else if (savePanel.availableParameters.list[param].instanceOrigin.selected === "Query") {
                            queryComponents = savePanel.availableParameters.list[param].instanceOrigin.inputs.Query;
                        }

                        pkqlQuery = pkqlService.generateParamQuery(paramName, selectAmount, defaultValues, selectedEngine, queryComponents);

                        selectedParams.push(pkqlQuery);
                    }
                }

                if (insightData.isFreeTextData) { //csv saving
                    savePanel.engines.selected = {name: "LocalMasterDatabase"};
                    savePanel.perspectives.selected = "Generic-Perspective";
                }

                if (!savePanel.isDbInsight) {
                    //assumes this method will not get executed without a newDbName from the save panel html

                    //replaceSpacesInDbName
                    savePanel.newDbName = savePanel.newDbName.replace(/ /g, "_");

                    //Create db with engine name before saving insight to it
                    monolithService.saveFilesInInsightAsDb(chartData.insightID, savePanel.newDbName).then(function (response) {
                        savePanel.engines.selected.name = savePanel.newDbName;
                        //assumption that all of these dbs will be RDBMS
                        savePanel.engines.selected.type = "prerna.engine.impl.rdbms.RDBMSNativeEngine";
                        saveInsight()
                    })
                } else {
                    saveInsight()
                }

                //function that handles the save viz actions
                function saveInsight() {
                    monolithService.getInsightsForPerspective(savePanel.engines.selected, savePanel.perspectives.selected)
                        .then(function (data) {
                            var questionOrder = data.length + 1;
                            if (!chartData.dataTableAlign) {
                                chartData.dataTableAlign = {};
                            }
                            if (saveType === "new") {
                                monolithService.addInsight(savePanel.engines.selected, chartData.insightID, savePanel.perspectives.selected, questionOrder, savePanel.newQuestionTitle, chartData.layout, selectedParams, chartData.dataTableAlign, chartData.uiOptions, chartData.specificData)
                                    .then(function (data) {
                                        alertService('Insight has been successfully saved.', 'Success', 'toast-success', 3000);
                                        //Todo need to update the layout and the new core engine id (the indexed insight)
                                        var currentWidget = dataService.getWidgetData();

                                        currentWidget.data.insightData = angular.extend(currentWidget.data.insightData, {
                                            name: data.data.insightName,
                                            core_engine: data.data.core_engine,
                                            core_engine_id: data.data.core_engine_id,
                                            layout: currentWidget.data.chartData.layout,
                                            paramPKQLS: selectedParams
                                        });

                                        //set in service
                                        dataService.setWidgetData(currentWidget, false, false, false);

                                        //tell others
                                        $rootScope.$emit('pub-sub-receive', 'sync-data', {
                                            insightData: null,
                                            widgetData: currentWidget,
                                            dashboardObject: null,
                                            pkqlData: null
                                        });

                                        dataService.toggleWidgetHandle('');
                                    });
                            } else if (saveType === "edit") {
                                monolithService.editInsight(savePanel.engines.selected, chartData.insightID, savePanel.perspectives.selected, questionOrder, savePanel.newQuestionTitle, chartData.layout, selectedParams, chartData.dataTableAlign, chartData.uiOptions, chartData.specificData)
                                    .then(function (data) {
                                        alertService('Insight has been successfully edited.', 'Success', 'toast-success', 3000);
                                        var currentWidget = dataService.getWidgetData();

                                        currentWidget.data.insightData = angular.extend(currentWidget.data.insightData, {
                                            name: savePanel.newQuestionTitle,
                                            layout: currentWidget.data.chartData.layout,
                                            paramPKQLS: selectedParams
                                        });

                                        //set in service
                                        dataService.setWidgetData(currentWidget, false, false, false);

                                        //tell others
                                        $rootScope.$emit('pub-sub-receive', 'sync-data', {
                                            insightData: null,
                                            widgetData: currentWidget,
                                            dashboardObject: null,
                                            pkqlData: null
                                        });

                                        dataService.toggleWidgetHandle('');
                                    });
                            }
                        });
                }

            }

            function validateDbName() {
                savePanel.validDbName = true;
                var modelValue = savePanel.newDbName;
                modelValue = modelValue.replace(/ /g, "_");
                //return false if special characters, true otherwise
                if (modelValue.match(/[@.*+?&^$%{}()";|[\]\\]/g)) {
                    savePanel.invalidDbNameSpecialCharacters = true;
                    savePanel.invalidDbNameAlreadyExists = false;
                    savePanel.validDbName = false;
                } else {
                    // see if db name exists
                    if (savePanel.engines && savePanel.engines.list) {
                        for (var i = 0; i < savePanel.engines.list.length; i++) {
                            if (savePanel.engines.list[i].name.toUpperCase() === modelValue.toUpperCase()) {
                                savePanel.invalidDbNameSpecialCharacters = false;
                                savePanel.invalidDbNameAlreadyExists = true;
                                savePanel.validDbName = false;
                            }
                        }

                    }
                }
            }

            /**
             * @name cancel
             * @desc cancels saving of the visualization
             */
            function cancel() {
                dataService.toggleWidgetHandle('');
            }

            /*** Data Functions ***/
            /**
             * @name getPerspectivesForEngine
             * @param engine
             * @desc gets list of perspectives for the selected engine
             *
             */
            function getPerspectivesForEngine(engine) {
                return;
            }

            /**
             * @name initialize
             * @desc called on directive load to pull the widget data from dataService
             */
            function initialize() {
                var data = dataService.getWidgetData();
                if (data && data.data) {
                    var insightID = data.data.chartData.insightID;
                    if (insightID === '') {
                        insightID = 'new';
                    }

                    //TODO maybe use getTableHeaders rather than getInsightMetamodel...
                    //determine is insight already has a db or if it is an in-memory table from upload
                    monolithService.isDbInsight(insightID)
                        .then(function (response) {
                            savePanel.isDbInsight = response.isDbInsight;

                            monolithService.getInsightMetamodel(insightID).then(function (metamodelData) {
                                chartData = data.data.chartData;
                                insightData = data.data.insightData;

                                if (insightID === 'new') {
                                    chartData.insightID = metamodelData.data.insightID;
                                }

                                savePanel.insightData = insightData;
                                savePanel.perspectives = {
                                    list: [],
                                    selected: ""
                                };
                                savePanel.engines = {
                                    list: [],
                                    selected: {}
                                };
                                savePanel.newPerspective = {
                                    name: "Semoss-Perspective"
                                };
                                savePanel.fromCreate = (insightData.core_engine_id ? false : true); //if coming from create there will not be a core engine id associated with it
                                savePanel.newQuestionTitle = "";
                                savePanel.filtered = true;
                                savePanel.unfilteredVars = false;
                                savePanel.srcLocation = widgetConfigService.getVizSvg(chartData.layout);

                                var availableParams = [], parameter = {};
                                for (var i in metamodelData.data.nodes) {
                                    parameter = {
                                        title: i,
                                        dbs: { //need to look to see if we need this
                                            list: metamodelData.data.nodes[i].engineName,
                                            selected: metamodelData.data.nodes[i].engineName[0]
                                        },
                                        physicalNames: metamodelData.data.nodes[i].engineToPhysical,
                                        selected: false,
                                        ind: false,
                                        filteredValues: [],
                                        instanceOrigin: {
                                            selected: "Database",
                                            options: ["User", "Database", "Query"],
                                            inputs: {
                                                User: "",
                                                Query: ""
                                            }
                                        },
                                        param: false,
                                        multiSelect: false,
                                        defaultValues: {
                                            enabled: false,
                                            selectAll: false,
                                            list: [],
                                            selected: []
                                        },
                                        parent: ""
                                    };

                                    if (metamodelData.data.nodes[i].prop) {
                                        parameter.parent = metamodelData.data.nodes[i].prop;
                                    }

                                    availableParams.push(parameter);
                                }

                                savePanel.availableParameters = {
                                    list: availableParams
                                };

                                monolithService.getAllEngines()
                                    .then(function (data) {
                                        savePanel.engines.list = data;
                                        if (chartData.core_engine) {
                                            savePanel.engines.selected = data[_.findIndex(data, {name: chartData.core_engine.name})];
                                        }

                                        if (!_.isEmpty(insightData)) {
                                            if (!_.isEmpty(insightData)) {
                                                if (insightData.core_engine) {
                                                    var foundEngine = false;
                                                    for (var i = 0; i < savePanel.engines.list.length; i++) {
                                                        if (savePanel.engines.list[i].name === insightData.core_engine) {
                                                            savePanel.engines.selected = savePanel.engines.list[i];
                                                            foundEngine = true;
                                                            break;
                                                        }
                                                    }

                                                    if (!foundEngine) {
                                                        savePanel.engines.list.push({name: insightData.core_engine});
                                                        savePanel.engines.selected = savePanel.engines.list[savePanel.engines.list.length - 1];
                                                        savePanel.perspectives.selected = "Generic-Perspective";
                                                        return;
                                                    }
                                                }
                                            }

                                            if (savePanel.engines.selected) {
                                                //No longer selecting perspectives

                                                //getPerspectivesForEngine(savePanel.engines.selected)
                                                //    .then(function (data) {
                                                //        savePanel.perspectives.list = data;
                                                //        if (insightData.tags[0]) {
                                                //            for (var i = 0; i < savePanel.perspectives.list.length; i++) {
                                                //                if (savePanel.perspectives.list[i] === insightData.tags[0]) {
                                                //                    savePanel.perspectives.selected = savePanel.perspectives.list[i];
                                                //                    break;
                                                //                }
                                                //            }
                                                //        }
                                                //    });

                                                if (insightData.name) {
                                                    savePanel.newQuestionTitle = insightData.name;
                                                }
                                            }
                                        }
                                    });

                            });
                        });

                }
            }

            /*** on page load **/
            initialize();
        }

        function savePanelLink(scope, ele, attrs) {
            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying save-panel....');
            });
        }
    }
})();