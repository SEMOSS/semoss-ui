(function () {
    'use strict';

    angular.module('app.tap.portratparampanel', [])
        .directive('portratparampanel', portratparampanel);

    portratparampanel.$inject = ['$rootScope', 'monolithService', 'alertService'];

    function portratparampanel($rootScope, monolithService, alertService) {
        PortRatParamPanelLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];

        function PortRatParamPanelLink(scope, ele, attrs, controllers) {

            scope.portratController = controllers[0];

            scope.updateSystemList = function () {
                monolithService.runPlaySheetMethod(scope.portratController.insightData.core_engine, scope.portratController.chartData.insightID, scope.portratparampanelctrl.sysparams, "getSystems").then(function (response) {
                    var updatedList = [];
                    //clear old system list Array
                    scope.portratparampanelctrl.systemList = [];
                    if (!_.isEmpty(response.data)) {
                        _(response.data.systems).forEach(function (n) {
                            var sysObj = {
                                name: n,
                                ind: "Included"
                            };
                            updatedList.push(sysObj);
                        }).value();
                    }
                    //push new systems to the controller
                    scope.portratparampanelctrl.systemList = updatedList;
                    scope.portratparampanelctrl.runOptDisabled = _.isEmpty(scope.portratparampanelctrl.systemList);
                }.bind());
            };

            //sets the selected systems from the panel check box to decommissioned
            scope.markDecommission = function () {
                var selectParamsEmpty = true;
                for (var key in scope.portratparampanelctrl.sysselectparams) {
                    if (scope.portratparampanelctrl.sysselectparams[key] == true) {
                        selectParamsEmpty = false;
                        break;
                    }
                }

                if (!selectParamsEmpty) {
                    monolithService.runPlaySheetMethod(scope.portratController.insightData.core_engine, scope.portratController.chartData.insightID, scope.portratparampanelctrl.sysselectparams, "getSystems").then(function (response) {
                        var sysList = scope.portratparampanelctrl.systemList.map(function (e) {
                            return e.name;
                        });
                        response.data.systems.forEach(function (n) {
                            if (_.contains(sysList, n)) {
                                scope.portratparampanelctrl.systemList[sysList.indexOf(n)].ind = "Consolidate";
                            } else {
                                var sysObj = {
                                    name: n,
                                    ind: "Consolidate"
                                };
                                scope.portratparampanelctrl.systemList.push(sysObj);
                            }
                        });
                        //reset the user params
                        scope.portratparampanelctrl.resetSysSelectParams();
                    }.bind());
                } else {
                     alertService("Please select options to consolidate", 'Error', 'toast-error', 7000);
                 }
            };

            scope.markModernize = function () {
                var selectParamsEmpty = true;
                for (var key in scope.portratparampanelctrl.sysselectparams) {
                    if (scope.portratparampanelctrl.sysselectparams[key] == true) {
                        selectParamsEmpty = false;
                        break;
                    }
                }

                if (!selectParamsEmpty) {
                    monolithService.runPlaySheetMethod(scope.portratController.insightData.core_engine, scope.portratController.chartData.insightID, scope.portratparampanelctrl.sysselectparams, "getSystems").then(function (response) {
                        var sysList = scope.portratparampanelctrl.systemList.map(function (e) {
                            return e.name;
                        });
                        response.data.systems.forEach(function (n) {
                            if (_.contains(sysList, n)) {
                                scope.portratparampanelctrl.systemList[sysList.indexOf(n)].ind = "Sustain";
                            } else {
                                var sysObj = {
                                    name: n,
                                    ind: "Sustain"
                                };
                                scope.portratparampanelctrl.systemList.push(sysObj);
                            }
                        });
                        //reset the user params
                        scope.portratparampanelctrl.resetSysSelectParams();
                    }.bind());
                } else {
                    alertService("Please select options to sustain.", 'Error', 'toast-error', 7000);
                }
            };

            scope.markClearSelections = function () {
                scope.portratparampanelctrl.systemList.forEach(function (n) {
                    n.ind = "Included";
                });
                scope.portratparampanelctrl.resetSysSelectParams();
            };

            scope.selectCapability = function (cap) {
                if (scope.portratparampanelctrl.sysparams.capability === cap.name) {
                    scope.portratparampanelctrl.sysparams.capability = "";
                    cap.selected = false;
                } else {
                    scope.portratparampanelctrl.capList.forEach(function (n) {
                        n.selected = false;
                    });
                    cap.selected = true;
                    scope.portratparampanelctrl.sysparams.capability = cap.name;
                }
            };

            scope.runOptimization = function () {
                var optConfig = {};
                scope.portratController.loadScreen = true;
                scope.portratController.showDash = false;

                scope.portratparampanelctrl.runOptBtn.isSubmitting = true;
                optConfig["systemList"] = scope.portratparampanelctrl.systemList;
                optConfig["maxAnnualBudget"] = scope.portratparampanelctrl.maxAnnualBudget;
                optConfig["maxYearValue"] = scope.portratparampanelctrl.maxYearValue;
                optConfig["dhmsmCap"] = scope.portratparampanelctrl.dhmsmCap;
                optConfig["optTypes"] = scope.portratparampanelctrl.optTypes.selected;

                //Advanced parameters
                optConfig["infl"] = scope.portratparampanelctrl.inflationRate;
                optConfig["disc"] = scope.portratparampanelctrl.discountRate;
                optConfig["numPts"] = scope.portratparampanelctrl.noStartPoints;
                optConfig["hbc"] = scope.portratparampanelctrl.hourlyBuildCost;
                optConfig["training"] = scope.portratparampanelctrl.trainingRate;

                monolithService.runPlaySheetMethod(scope.portratController.insightData.core_engine, scope.portratController.chartData.insightID, optConfig, "runOpt").then(function (response) {
                    scope.portratController.portRatSystemList = [];
                    scope.portratController.portRatSystemList = JSON.parse(JSON.stringify(response));
                    scope.portratController.showSelectPanel = true;
                    scope.portratController.showParamPanel = false;
                    scope.portratController.showDash = true;
                    scope.portratparampanelctrl.runOptBtn.result = 'success';
                    console.log("Run Optimization Complete");
                    scope.portratController.loadScreen = false;
                });
            };
        }

        return {
            restrict: 'E',
            scope: true,
            bindToController: true,
            require: ['^portrat'],
            templateUrl: 'custom/specific/tap/portratdashboard/leftpanel/portratparampanel/portratparampanel.html',
            controllerAs: 'portratparampanelctrl',
            controller: PortRatParamPanelCtrl,
            link: PortRatParamPanelLink
        }
    }

    PortRatParamPanelCtrl.$inject = ['$scope'];

    function PortRatParamPanelCtrl($scope) {
        this.sysparams = {
            'low': false,
            'high': false,
            'interface': false,
            'nointerface': false,
            'garrison': true,
            'theater': true,
            'capability': ""
        };

        this.sysselectparams = {
            'low': false,
            'high': false,
            'interface': false,
            'nointerface': false,
            'mhsspecific': false,
            'ehrcore': false,
            'capability': ""
        };

        $('[data-toggle="tooltip"]').tooltip();

        this.systemList = [];

        this.dhmsmCap = false;
        this.maxYearValue = 10;
        this.maxAnnualBudget = 1000000000;
        this.optTypes = {
            list: ['IRR', 'ROI', 'Savings'],
            selected: "Savings"
        };

        this.hourlyBuildCost = 150;
        this.trainingRate = 15;
        this.discountRate = 2.5;
        this.inflationRate = 1.5;

        this.noStartPoints = 1;

        this.runOptBtn = {
            isSubmitting: null,
            result: null,
            options: {
                buttonDefaultText: "Run Optimization",
                buttonDefaultClass: 'md-btn btn-green pull-right btn-margin-left',
                buttonSubmittingText: " ",
                buttonSubmittingClass: 'md-btn btn-green pull-right btn-margin-left',
                buttonSuccessText: " ",
                buttonSuccessClass: 'md-btn btn-green pull-right btn-margin-left',
                buttonErrorClass: 'md-btn btn-red pull-right btn-margin-left no-data',
                buttonSubmittingIcon: "fa fa-spin fa-spinner",
                buttonSuccessIcon: "fa fa-check",
                buttonErrorIcon: " "
            }
        };
        this.runOptDisabled = true;

        this.removeSystem = function (sys) {
            var oldList = this.systemList;
            this.systemList = oldList.filter(function (ele) {
                return ele.name !== sys.name;
            });
        };

        this.changeInd = function (sys) {
            var ind = sys.ind;
            if (ind === "Included") {
                sys.ind = "Sustain";
            } else if (ind === "Sustain") {
                sys.ind = "Consolidate";
            } else if (ind === "Consolidate") {
                sys.ind = "Included";
            }
        };

        this.resetSysSelectParams = function () {
            this.sysselectparams = {
                'low': false,
                'high': false,
                'interface': false,
                'nointerface': false,
                'mhsspecific': false,
                'ehrcore': false
            };
        };

        this.returnToSelectPanel = function () {
            $scope.portratController.showSelectPanel = true;
            $scope.portratController.showReturnToSelectToggle = false;
            $scope.portratController.showParamPanel = false;
        };

    }

})(); //end of controller IIFE
