(function () {
    "use strict";

    angular.module("app.directives.iatddqueuing", [])
        .directive("iatddqueuing", iatddQueuing);

    iatddQueuing.$inject = ['$rootScope', 'monolithService', 'utilityService', '$timeout', 'dataService'];

    function iatddQueuing($rootScope, monolithService, utilityService, $timeout, dataService) {
        iatddQueuingController.$inject = ['$scope'];
        iatddQueuingLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];

        return {
            restrict: 'E',
            bindToController: true,
            controllerAs: 'iatddQueuingCtrl', //name the controller
            controller: iatddQueuingController, 
            link: iatddQueuingLink,
            templateUrl: "custom/specific/iatdd/iatddqueuing.html" //location of the html files
        };

        function iatddQueuingController($scope) {
        }

        function iatddQueuingLink(scope, ele, attrs, controllers) {
            //receive the data from the controller
            var rawBEData = dataService.getWidgetData();
            var engineName = rawBEData.data.engineName;
            scope.iatddQueuingCtrl.refreshCount = 0;

            rawBEData.engine = {
                name: engineName,
                api: null
            };

            //created default array of packages using data provded by back-end
            var formattedPackages = {};
            for (var i in rawBEData.data.chartData.data.charts[1].data) {
                formattedPackages[rawBEData.data.chartData.data.charts[1].data[i]['Package']] = true;
            }

            //initialized the default values for the dashboard
            scope.iatddQueuingCtrl.defaultFormValues = {
                requirements: {
                    "Training_and_Support": 10,
                    "Process_Flow": 10,
                    "Technical_Requirements": 10,
                    "Self_Service_Check_In": 10,
                    "BI_and_Analytics": 10,
                    "System_Integration": 10
                },
                stakeholders: {
                    army: true,
                    airforce: true,
                    navy: true
                },
                packages: formattedPackages
            };

            //initialize variables
            scope.iatddQueuingCtrl.variableFormValues = angular.copy(scope.iatddQueuingCtrl.defaultFormValues);
            scope.iatddQueuingCtrl.oldVariableFormValues = angular.copy(scope.iatddQueuingCtrl.defaultFormValues);
            scope.iatddQueuingCtrl.resetButton = true;
            scope.iatddQueuingCtrl.refreshButton = false;
            scope.iatddQueuingCtrl.showTools = true;

            /* function to determine whether the refresh button should be disabled or enabled 
                disabled when the parameters are at default or they have not changed since the last refresh call 
            */
            scope.iatddQueuingCtrl.checkFormValues = function() {
                var oldValue = scope.iatddQueuingCtrl.oldVariableFormValues;
                var newValue = scope.iatddQueuingCtrl.variableFormValues;
                if (angular.equals(scope.iatddQueuingCtrl.variableFormValues, scope.iatddQueuingCtrl.defaultFormValues)) {
                    scope.iatddQueuingCtrl.resetButton = true;
                }
                else {
                    scope.iatddQueuingCtrl.resetButton = false;
                }
                if (angular.equals(newValue, oldValue)) {
                    scope.iatddQueuingCtrl.refreshButton = true;
                }
                else {
                    scope.iatddQueuingCtrl.refreshButton = false;
                }
                $timeout();
            };

            //watch variable form variables to disable and enable buttons
            scope.$watch('iatddQueuingCtrl.variableFormValues', function () {
                scope.iatddQueuingCtrl.checkFormValues();
            }, true);

            //order the overall vendor score to be Q-Matic first and then QFlow
            scope.iatddQueuingCtrl.orderScores = function() {
                scope.iatddQueuingCtrl.overallOrdered = {};
                if (scope.iatddQueuingCtrl.overall.data[0].Vendor == "Q-Matic" || scope.iatddQueuingCtrl.overall.data[0].Vendor == "System 2"){
                    scope.iatddQueuingCtrl.overallOrdered[0] = (scope.iatddQueuingCtrl.overall.data[0]);
                    scope.iatddQueuingCtrl.overallOrdered[1] = (scope.iatddQueuingCtrl.overall.data[1]);
                }
                else {
                    scope.iatddQueuingCtrl.overallOrdered[0] = (scope.iatddQueuingCtrl.overall.data[1]);
                    scope.iatddQueuingCtrl.overallOrdered[1] = (scope.iatddQueuingCtrl.overall.data[0]);
                }

                scope.iatddQueuingCtrl.overall.data = scope.iatddQueuingCtrl.overallOrdered;
            };

            scope.iatddQueuingCtrl.updateHeat = function(){
                $rootScope.$emit('iatddheatmap-receive', 'iatddHeatmapUpdate', rawBEData.data.chartData);
                if (scope.iatddQueuingCtrl.refreshCount >= 1){
                    $rootScope.$emit('iatddheatmap-receive', 'iatddPackageRefresh');
                }
            };

            //order the total costs to be Q-Matic first and then QFlow
            scope.iatddQueuingCtrl.orderCosts = function() {
                scope.iatddQueuingCtrl.costsOrdered = {};
                if (scope.iatddQueuingCtrl.overall.data[0].Vendor == "Q-Matic" || scope.iatddQueuingCtrl.overall.data[0].Vendor == "System 2"){
                    scope.iatddQueuingCtrl.costsOrdered[0] = (scope.iatddQueuingCtrl.tableData.data[0]);
                    scope.iatddQueuingCtrl.costsOrdered[1] = (scope.iatddQueuingCtrl.tableData.data[1]);
                }
                else {
                    scope.iatddQueuingCtrl.costsOrdered[0] = (scope.iatddQueuingCtrl.tableData.data[1]);
                    scope.iatddQueuingCtrl.costsOrdered[1] = (scope.iatddQueuingCtrl.tableData.data[0]);
                }

                scope.iatddQueuingCtrl.tableData.data = scope.iatddQueuingCtrl.costsOrdered;
            };

            /* dataProcessor function that is called each time the monolith call is processed
                function gets the data from the back-end and places it into the different objects
                which are then manipulated in the .html */
            scope.iatddQueuingCtrl.dataProcessor = function() {
                scope.iatddQueuingCtrl.heatData = JSON.parse(JSON.stringify(rawBEData.data.chartData.data.charts[1]));
                scope.iatddQueuingCtrl.updateHeat();
                scope.iatddQueuingCtrl.overall = JSON.parse(JSON.stringify(rawBEData.data.chartData.data.charts[2]));
                scope.iatddQueuingCtrl.orderScores();
                scope.iatddQueuingCtrl.tableData = JSON.parse(JSON.stringify(rawBEData.data.chartData.data.charts[0]));
                scope.iatddQueuingCtrl.orderCosts();
                scope.iatddQueuingCtrl.oldVariableFormValues = angular.copy(scope.iatddQueuingCtrl.variableFormValues);
                scope.iatddQueuingCtrl.refreshCount = scope.iatddQueuingCtrl.refreshCount + 1;
            };

            /* refresh function that calls the refreshData function and sets the button to disabled */
            scope.iatddQueuingCtrl.refresh = function() {
                //check if variable greater than 10 or less than 0
                for (var i in scope.iatddQueuingCtrl.variableFormValues.requirements) {
                    if (parseInt(scope.iatddQueuingCtrl.variableFormValues.requirements[i]) > 10) {
                        scope.iatddQueuingCtrl.variableFormValues.requirements[i] = 10;
                    }
                    if (parseInt(scope.iatddQueuingCtrl.variableFormValues.requirements[i]) <= 0) {
                        scope.iatddQueuingCtrl.variableFormValues.requirements[i] = 1;
                    }
                }
            
                scope.iatddQueuingCtrl.refreshButton = true;
                refreshData('Refreshed Data');
            };

            /* reset function that sets the data to default, calls the refreshData function, and sets the button to disabled */
            scope.iatddQueuingCtrl.reset = function() {
                scope.iatddQueuingCtrl.variableFormValues = angular.copy(scope.iatddQueuingCtrl.defaultFormValues);
                scope.iatddQueuingCtrl.oldVariableFormValues = angular.copy(scope.iatddQueuingCtrl.variableFormValues);
                scope.iatddQueuingCtrl.resetButton = true;
                scope.iatddQueuingCtrl.refreshButton = true;
                refreshData('Reset Data');
            };

            scope.iatddQueuingCtrl.dataProcessor();

            /* refreshData function that calls the monolith service and receives data back */
            function refreshData(type) {
                //add underscores to the data to allow easy processing in the back-end
                var underscoreData = angular.copy(scope.iatddQueuingCtrl.variableFormValues);
                underscoreData.packages = utilityService.addUnderscoresToTableData([underscoreData.packages])[0];

                //monolith service call -> calls updateInfo function on back-end
                monolithService.runPlaySheetMethod(rawBEData.engine, rawBEData.insightId, underscoreData, "updateInfo")
                    .then(function (response) {
                        //if response is not null, gets data through response.data.charts
                        if (response.data != null && !_.isEmpty(response.data)) {
                            rawBEData.data.chartData.data = response.data;
                            scope.iatddQueuingCtrl.dataProcessor();
                        } else {
                            console.log(response);
                        }
                    }.bind());

            }
        }
    }

})();