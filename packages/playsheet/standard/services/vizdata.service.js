(function () {
    'use strict';

    /**
     * @name data.service.js
     * @desc handles getting and setting of data for visualizations
     */
    angular.module('app.vizdata.service', [])
        .factory('vizdataService', vizdataService);

    vizdataService.$inject = ['monolithService', '$q', '_', 'alertService', 'nameServerService'];

    function vizdataService(monolithService, $q, _, alertService, nameServerService) {
        /**
         * @name registerSelectedParam
         * @param selectedOpt
         * @param insight
         * @returns {*}
         * @desc takes selected parameter from visualization, checks to see if any other dependent parameters exist, will retrieve the list of those dependent parameters
         */
        function registerSelectedParam(selectedOpt, insight) {
            var queriesToRun = [];
            var servicesToRun = [];
            for (var opt in insight.params) {
                if (insight.params[opt].param.depends === 'true' && _.includes(insight.params[opt].param.dependVars, selectedOpt.paramID)) {
                    var query = '';
                    var findersArr = [];
                    var valuesArr = [];
                    for (var i = 0; i < insight.params[opt].param.dependVars.length; i++) {
                        var dependVar = insight.params[opt].param.dependVars[i];
                        var selectedParam;
                        for (var param in insight.params) {
                            if (insight.params[param].param.paramID === dependVar) {
                                selectedParam = insight.params[param];
                            }
                        }
                        if (selectedParam.selected === '') {
                            break;
                        }
                        findersArr[i] = '@' + selectedParam.type + '@';
                        valuesArr[i] = selectedParam.selected[0];
                        query = insight.params[opt].param.query;
                    }
                    queriesToRun.push({
                        name: opt,
                        query: query
                    });
                    servicesToRun.push(monolithService.runSelectQuery(insight.core_engine, query, findersArr, valuesArr));
                }
            }

            return $q.all(servicesToRun).then(function (data) {
                for (var i = 0; i < queriesToRun.length; i++) {
                    insight.params[queriesToRun[i].name].list = data[i];
                    //check to see if the selected dependent option is part of the paramOptions list
                    //if not we clear the option
                    var optSelected = insight.params[queriesToRun[i].name].selected;
                    var optionInList = _.find(data[i], function (item) {
                        return item[0] === optSelected[0];
                    });
                    if (!optionInList) {
                        insight.params[queriesToRun[i].name].selected = [];
                    }
                }
            }, function (error) {
                var errMsg;
                if (error.data && error.data.Message) {
                    errMsg = error.data.Message;
                } else {
                    errMsg = 'Error running query';
                }
            });
        }

        /**
         * @name getChartData
         * @param insight
         * @returns {*}
         * @desc makes call to monolithService to get the chart data
         */
        function getChartData(insight) {
            return monolithService.getChartDataFromInsightOption({
                'engine': insight.core_engine,
                'insight': insight.core_engine_id,
                'params': insight.params,
                'sparql': insight.query,
                'layout': insight.layout,
                'relatedInsight': ''
            }).then(function (data) {
                //parse the uiOptions if they exist
                if (data && data.uiOptions) {
                    data.uiOptions = JSON.parse(data.uiOptions);
                }
                if (!_.isEmpty(data) && !(data.layout === "Graph" && _.isEmpty(data.nodes) && data.edges.length === 0) || (data.data && data.data.length === 0)) {
                    if (data.layout === "prerna.ui.components.playsheets.MashupPlaySheet") {
                        return { mashup: data };
                    }
                    data["core_engine"] = {
                        name: insight.core_engine,
                        api: null
                    };

                    //TODO TEMP
                    var pkqlOutput = {};
                    if (data.pkqlOutput) {
                        pkqlOutput = JSON.parse(JSON.stringify(data.pkqlOutput));
                        delete data.pkqlOutput;
                    }

                    return { chartData: data, pkqlOutput: pkqlOutput };

                } else {
                    alertService('No Data for Selected Insight', 'Error', 'toast-error', 3000);
                    return false;
                }
            }, function (error) {
                var errMsg;
                if (error && error.data && error.data.Message) {
                    errMsg = error.data.Message;
                } else {
                    errMsg = 'Error retrieving data';
                }

                alertService(errMsg, 'Error', 'toast-error', 3000);
                return false;
            });
        }

        /**
         * @name getDashboardData
         * @param dashboardInfo
         * @returns {*}
         * @desc retreives data on all the insights for a saved dashboard
         */
        function getDashboardData(dashboardInfo) {
            var dashboardDataServices = [],
                instanceValuesServices = [],
                deferred = $q.defer();

            //queue up all the insight calls
            for (var j = 0; j < dashboardInfo.insightsData.length; j++) {
                //add services to be run in an array
                dashboardDataServices.push(monolithService.getChartDataFromInsightOption({
                    'engine': dashboardInfo.insightsData[j].core_engine,
                    'insight': dashboardInfo.insightsData[j].core_engine_id,
                    'params': dashboardInfo.insightsData[j].params,
                    'sparql': undefined,
                    'layout': dashboardInfo.insightsData[j].layout,
                    'relatedInsight': ''
                }));
                //don't need this currently, but if we want to reduce saved data, we will use it
                instanceValuesServices.push(monolithService.getOptionsForInsight(dashboardInfo.insightsData[j].core_engine, dashboardInfo.insightsData[j].core_engine_id));
            }

            $q.all(instanceValuesServices).then(function (insightParamOptions) {//run to get the param options and param information
                //run each dashboard visualization
                $q.all(dashboardDataServices).then(function (dashboardInfo, insightParamOptions, dashboardData) {
                    var mashupConfig = {
                        dataItems: [],
                        joinData: undefined,
                        savedDashLayout: undefined,
                        savedDashView: undefined
                    };
                    //set join data in the service if necessary
                    if (!_.isEmpty(dashboardInfo.joinData)) {
                        mashupConfig.joinData = dashboardInfo.joinData;
                    }

                    //set join data in the service if necessary
                    if (!_.isEmpty(dashboardInfo.savedDashLayout)) {
                        mashupConfig.savedDashLayout = dashboardInfo.savedDashLayout;
                    }

                    //set join data in the service if necessary
                    if (!_.isEmpty(dashboardInfo.savedDashView)) {
                        mashupConfig.savedDashView = dashboardInfo.savedDashView;
                    }


                    for (var i = 0; i < dashboardData.length; i++) {
                        //check if ui options were saved and then add them to chartData
                        if (dashboardInfo.uiOptionsData && dashboardInfo.uiOptionsData[i]) {
                            dashboardData[i].uiOptions = dashboardInfo.uiOptionsData[i];
                        }

                        var pkqlOutput = {};
                        if (dashboardData[i].pkqlOutput) {
                            pkqlOutput = JSON.parse(JSON.stringify(dashboardData[i].pkqlOutput));
                            delete dashboardData[i].pkqlOutput;
                        }


                        var returnObj = {};

                        returnObj.data = {
                            groupedData: {
                                chartData: dashboardData[i],
                                insightData: dashboardInfo.insightsData[i],
                                comments: { list: {}, maxId: 0 },
                                panelConfig: {}
                            },
                            showCreate: false/*,
                             filterOptions: dashboardInfo.filterOptions[i], //selected filter options
                             savedConfig: dashboardInfo.savedConfig[i] //position of the widgets*/
                        };

                        returnObj.pkqlData = pkqlOutput;

                        mashupConfig.dataItems.push(returnObj);
                        //set Tools
                        //if(dashboardData[i].uiOptions){
                        //toolDataService.setToolData(JSON.parse(dashboardData[i].uiOptions), dashboardData[i].insightID);
                        //}

                        //add items from dashboardInfo necessary for insightParamOptions
                        /*for (var insight in dashboardInfo.insightsData[i]) {
                         insightObj.engine = dashboardInfo.insightsData[i][insight].Engine;
                         insightObj.perspective = dashboardInfo.insightsData[i][insight].Perspective;
                         insightObj.params = dashboardInfo.insightsData[i][insight].Parameters;

                         if(!_.isEmpty(insightParamOptions[i].options)) { //fill in the list and the param information
                         for(var option in insightObj.params) {
                         insightObj.params[option].list = insightParamOptions[i].options[option];
                         insightObj.params[option].param = insightParamOptions[i].params[option];
                         }
                         }
                         }*/
                    }

                    return deferred.resolve(mashupConfig);
                }.bind({}, dashboardInfo, insightParamOptions), function (err) {
                    return deferred.reject(err);
                });
            }, function (err) {
                return deferred.reject(err);
            });

            return deferred.promise;
        }

        /**
         * @name createViz
         * @param insight
         * @returns {*}
         * @desc makes call to monolithService to get the chart data
         */
        function createViz(insight) {
            return monolithService.getOptionsForInsight(insight.core_engine, insight.core_engine_id).then(function (data) {
                if (!_.isEmpty(data)) {
                    insight["params"] = {};
                    if (_.isEmpty(data.params)) {
                        return { state: "noParams" };
                    }

                    for (var key in data.options) {
                        if (!insight.params[key] || !insight.params[key].selected) {
                            insight.params[key] = {
                                list: data.options[key],
                                param: data.params[key],
                                selected: [],
                                type: key,
                                isCollapsed: false
                            };
                        }
                        else {
                            insight.params[key] = {
                                list: data.options[key],
                                param: data.params[key],
                                selected: insight.params[key].selected,
                                type: key,
                                isCollapsed: true
                            };
                        }
                    }

                    var allParamsAreSelected = true;
                    for (var key in insight.params) {
                        if (!insight.params[key].selected || insight.params[key].selected.length === 0) {
                            allParamsAreSelected = false;
                        } else {
                            registerSelectedParam(insight.params[key].param, insight);
                        }
                    }

                    if (allParamsAreSelected) {
                        return { state: "AllSelected", paramList: insight.params };
                    }
                    else {
                        return { state: "notAllSelected", paramList: insight.params };
                    }

                }
            }, function (error) {
                var errMsg;
                if (error.data && error.data.Message) {
                    errMsg = error.data.Message;
                } else {
                    errMsg = 'Error retrieving insight options';
                }

                return $q.reject(errMsg);
                //alertService(errMsg, "Error", "toast-error", 3000);
            });
        }

        /**
         * @name getRelatedInsights
         * @param selectedItem
         * @returns {*} list of related insights
         * @desc makes call to monolithService to get related insight information
         */
        function getRelatedInsights(selectedItem, engine, layout, filterData, limit, offset) {
            var uriArray = [];
            var selectedItemArray = [];
            if (!Array.isArray(selectedItem)) {
                selectedItemArray.push(selectedItem);
            } else {
                selectedItemArray = selectedItem;
            }

            for (var i in selectedItemArray) {
                if (selectedItemArray[i].uri) {
                    uriArray.push(selectedItemArray[i].uri);
                }
            }

            if (!_.isEmpty(uriArray)) {
                var nameServerArray = nameServerService.getNameServerInfo();
                var servicesToRun = [];
                for (var i = 0; i < nameServerArray.length; i++) {
                    if (nameServerArray[i].isconsumed) {
                        servicesToRun.push(monolithService.getRelatedInsights(engine,
                            layout, uriArray, nameServerArray[i].url, nameServerArray[i].webapp,
                            filterData, 1000, 0));
                    }
                }
                return $q.all(servicesToRun).then(function (data) {
                    for (var i in data) {
                        if (typeof data[i] === 'string') {
                            console.log('Data came in as ' + data[i]);
                            data[i] = jQuery.parseJSON(data[i]);
                        }

                        for (var j = 0; j < data[i].results.length; j++) {
                            var engineObj = {
                                'name': data[i].results[j].core_engine,
                                'api': undefined
                            };
                            data[i].results[j].engine = engineObj;
                        }
                    }


                    return data;
                }, function (error) {
                    alertService('Error retrieving related insights.', 'Error', 'toast-error', 3000);
                });
            }
        }

        return {
            registerSelectedParam: registerSelectedParam,
            getChartData: getChartData,
            createViz: createViz,
            getDashboardData: getDashboardData,
            getRelatedInsights: getRelatedInsights
        };
    }
})();
