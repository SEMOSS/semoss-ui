(function () {
    'use strict';

    /**
     * @name analytics-panel
     * @desc The directive for the analytics panel on the side menu. Controls running of analytics routines on the back end
     */
    angular.module('app.analytics-panel.directive', [])
        .directive('analyticsPanel', analyticsPanel);

    analyticsPanel.$inject = ['$rootScope', '$filter', 'analyticsService', 'utilityService', 'dataService'];

    function analyticsPanel($rootScope, $filter, analyticsService, utilityService, dataService) {

        analyticsPanelCtrl.$inject = ["$scope", 'monolithService', 'alertService'];
        analyticsPanelLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            scope: {},
            require: [],
            controllerAs: 'analyticsPanel',
            bindToController: {
            },
            templateUrl: 'custom/analytics-panel/analytics-panel.directive.html',
            controller: analyticsPanelCtrl,
            link: analyticsPanelLink
        };

        function analyticsPanelCtrl($scope, monolithService, alertService) {
            var analyticsPanel = this;

            //Variables
            analyticsPanel.selectedData = null;//data of the selected viz
            analyticsPanel.routinesList = null; //all the routine information
            analyticsPanel.isRoutineListCollapsed = true;
            analyticsPanel.isParameterListCollaped = true;
            analyticsPanel.filterParams = [];
            analyticsPanel.params = [];
            analyticsPanel.filterSelectAll = true;
            analyticsPanel.disableAlgorithmButtons = false;
            analyticsPanel.loadScreen = false;

            //Functions
            analyticsPanel.resetPanel = resetPanel;
            analyticsPanel.setRoutine = setRoutine;
            analyticsPanel.setOptions = setOptions;
            analyticsPanel.selectInstance = selectInstance;
            analyticsPanel.selectFilterParam = selectFilterParam;
            analyticsPanel.selectAllFilterParam = selectAllFilterParam;
            analyticsPanel.runAlgorithm = runAlgorithm;

            /**
             * @name setRoutine
             * @desc selects routine and loads in the appropriate directive
             * @params routineName {string} layout of selected routine
             */
            function setRoutine(routineName) {
                analyticsPanel.selectedRoutine = analyticsPanel.routinesList[routineName];
                analyticsPanel.routineContent = analyticsService.getRoutineDirectiveElement(routineName);

                analyticsPanel.isRoutineListCollapsed = true;
                analyticsPanel.isParameterListCollaped = false;
                analyticsPanel.isFilterParamCollapsed = false;

                setFilterParams();
            }

            /**
             * @name setOptions
             * @desc sets selected Options
             * @params key {String} key of changing options
             * @params value {String} new value of changed option
             */
            function setOptions(key, value) {
                analyticsPanel.selectedRoutine.options[key] = value;
            }

            /**
             * @name setFilterParams
             * @desc sets default filter params when routine changes
             */
            function setFilterParams() {
                var headers = analyticsPanel.selectedData.headers;

                analyticsPanel.filterParams = [];
                analyticsPanel.filterSelectAll = true;

                //checks if it is a string
                for (var i in headers) {
                    if (headers[i].type !== 'NUMBER' && analyticsPanel.selectedRoutine.restrictToNumerical) {
                        analyticsPanel.filterParams.push({
                            header: headers[i],
                            isSelected: false,
                            hideParam: true
                        });

                    }
                    else {
                        analyticsPanel.filterParams.push({
                            header: headers[i],
                            isSelected: true,
                            hideParam: false
                        });
                    }
                }

                if (analyticsPanel.selectedRoutine && analyticsPanel.selectedRoutine.targetInstance) {
                    for (i in analyticsPanel.filterParams) {
                        if (!analyticsPanel.filterParams[i].hideParam) {
                            analyticsPanel.selectedRoutine.targetInstanceValue = analyticsPanel.filterParams[i].header.title;
                            break;
                        }
                    }
                }
                else {
                    analyticsPanel.selectedRoutine.targetInstanceValue = '';
                }

                analyticsPanel.params = JSON.parse(JSON.stringify(analyticsPanel.filterParams));
            }

            /**
             * @name selectInstance
             * @desc disables the selected instance (so it is always required)
             */
            function selectInstance() {
                if (analyticsPanel.selectedRoutine) {
                    for (var i in analyticsPanel.filterParams) {
                        if (analyticsPanel.filterParams[i].header.title === analyticsPanel.selectedRoutine.targetInstanceValue) {
                            analyticsPanel.filterParams[i].isSelected = true;
                        }
                    }
                }
            }

            /**
             * @name selectFilterParam
             * @param param {object} param object
             * @desc selects param object and disables if less than two are selected
             */
            function selectFilterParam(param) {
                param.isSelected = !param.isSelected;
                var count = 0, returnBool = true;
                for (var i in analyticsPanel.filterParams) {
                    if (!analyticsPanel.filterParams[i].hideParam) {
                        if (!analyticsPanel.filterParams[i].isSelected) {
                            returnBool = false;
                        } else {
                            count++;
                        }
                    }
                }

                if (count < 2) {
                    analyticsPanel.disableAlgorithmButtons = true;
                } else {
                    analyticsPanel.disableAlgorithmButtons = false;
                }

                analyticsPanel.filterSelectAll = returnBool;
            }

            /**
             * @name selectAllFilterParam
             * @desc triggers select all filter functionality (checks if required one is selected)
             */
            function selectAllFilterParam() {
                var opp = !analyticsPanel.filterSelectAll;
                for (var i in analyticsPanel.filterParams) {
                    if (analyticsPanel.filterParams[i].header.title === analyticsPanel.selectedRoutine.targetInstanceValue) {
                        analyticsPanel.filterParams[i].isSelected = true;
                    } else {
                        if (analyticsPanel.filterParams[i].hideParam) {
                            analyticsPanel.filterParams[i].isSelected = false;
                        }
                        else {
                            analyticsPanel.filterParams[i].isSelected = opp;
                        }
                    }
                }
                analyticsPanel.filterSelectAll = opp;

                if (opp === false) {
                    analyticsPanel.disableAlgorithmButtons = true;
                } else {
                    analyticsPanel.disableAlgorithmButtons = false;
                }
            }

            /**
             * @name runAlgorithm
             * @desc runs algoirthm based on selected values
             */
            function runAlgorithm() {
                analyticsPanel.loadScreen = true;
                var filterParamBools = {};
                for (var i in analyticsPanel.filterParams) {
                    filterParamBools[analyticsPanel.filterParams[i].header.title] = analyticsPanel.filterParams[i].isSelected
                }

                var params = [];
                for (var i in analyticsPanel.selectedRoutine.options) {
                    if (analyticsPanel.selectedRoutine.options[i]) {
                        params.push(String(analyticsPanel.selectedRoutine.options[i]));
                    }
                }

                var newData = {
                    type: 'analytics',
                    call: function () {
                        return monolithService.runAlgorithm(analyticsPanel.selectedRoutine.routineName, analyticsPanel.selectedData.insightID, params, filterParamBools, analyticsPanel.selectedRoutine.targetInstanceValue)
                    },
                    callBack: function (data) {
                        analyticsPanel.loadScreen = false;
                        if (data.error) {
                            if (data.error.data && data.error.data.errorMessage) {
                                alertService(data.error.data.errorMessage, "Error", "toast-error", 4000);
                            } else {
                                alertService("Error running analytics", "Error", "toast-error", 4000);
                            }
                        } else {
                            if (data.actionData) {
                                alertService("Added new " + data.actionData.layout, "Success", "toast-success", 4000);
                            } else if (data.headers && data.headers[data.headers.length - 1]) {
                                //assumes the last header is the newly added one
                                alertService("Added new column" + data.headers[data.headers.length - 1].title, "Success", "toast-success", 4000);
                            } else {
                                alertService("Success running Analytics", "Success", "toast-success", 4000);
                            }
                        }
                    }
                };
                dataService.updateData(newData);
            }

            /**
             * @name resetPanel
             * @desc function that is resets panel when selected Widget Changes
             */
            function resetPanel() {
                analyticsPanel.selectedRoutine = null;
                analyticsPanel.isRoutineListCollapsed = false;
                analyticsPanel.routineContent = null;

                //need to get all the headers for the option list
                if (analyticsPanel.selectedData.insightID) {
                    monolithService.getTableHeaders(analyticsPanel.selectedData.insightID).then(function (data) {
                        var headers = [];

                        for (var i = 0; i < data.tableHeaders.length; i++) {
                            headers.push({
                                title: data.tableHeaders[i].uri,
                                filteredTitle: $filter("replaceUnderscores")(data.tableHeaders[i].varKey),
                                type: data.tableHeaders[i].type
                            })
                        }

                        if (headers.length > 0) {
                            analyticsPanel.selectedData.headers = headers;
                        }

                    });
                }
            }
        }

        function analyticsPanelLink(scope, ele, attrs, ctrl) {
            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
                scope.analyticsPanel.routinesList = analyticsService.getRoutineObj();
                var currentWidget = dataService.getWidgetData();
                if (currentWidget && currentWidget.data) {
                    scope.analyticsPanel.selectedData = currentWidget.data.chartData;
                }
                if (scope.analyticsPanel.selectedData) {
                    scope.analyticsPanel.resetPanel();
                }
            }

            initialize();

            //listeners
            var analyticsPanelUpdateListener = $rootScope.$on('update-data', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-data');
                var currentWidget = dataService.getWidgetData();
                if (currentWidget && currentWidget.data) {
                    scope.analyticsPanel.selectedData = currentWidget.data.chartData;
                }
                if (scope.analyticsPanel.selectedData) {
                    scope.analyticsPanel.resetPanel();
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying analyticsPanel....');
                analyticsPanelUpdateListener();
            });
        }

    }
})();
