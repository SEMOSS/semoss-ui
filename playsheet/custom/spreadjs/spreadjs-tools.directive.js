(function () {
    'use strict';

    /**
     * @name spreadjs directive
     * @desc tools specific to spreadjs
     */

    angular.module('app.spreadjs-tools.directive', [])
        .directive('spreadjsTools', spreadjsTools);

    spreadjsTools.$inject = [];

    function spreadjsTools() {

        spreadjsToolsCtrl.$inject = ["$rootScope", "$scope"];
        spreadjsToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'spreadjsTools',
            bindToController: {},
            templateUrl: 'custom/spreadjs/spreadjs-tools.directive.html',
            controller: spreadjsToolsCtrl,
            link: spreadjsToolsLink
        };
        function spreadjsToolsCtrl($rootScope, $scope) {
            var spreadjsTools = this;
            spreadjsTools.addConditionalRule = addConditionalRule;
            spreadjsTools.removeConditionalRules = removeConditionalRules;
            spreadjsTools.resetRules = resetRules;
            /*
             CellValueRule: The cell value rule.
             SpecificTextRule: The specific text rule.
             FormulaRule: The formula rule.
             DateOccurringRule: The date occurring rule.
             Top10Rule: The top 10 rule.
             UniqueRule: The unique rule.
             DuplicateRule: The duplicate rule.
             AverageRule: The average rule.
             TwoScaleRule: The two scale rule.
             ThreeScaleRule: The three scale rule.
             DataBarRule: The data bar rule.
             IconSetRule: The icon set rule.
             */

            spreadjsTools.resetRules();

            function addConditionalRule () {
                var sheet = $("#ss").data("spread").getActiveSheet();
                var selections = sheet.getSelections();
                var existingFormatRules = {};

                var tempSelectedRule = spreadjsTools.ruleSelections.options[spreadjsTools.ruleSelections.selected];
                spreadjsTools.ruleSelections.options = {};
                spreadjsTools.ruleSelections.options[spreadjsTools.ruleSelections.selected] = tempSelectedRule;
                var newRule = {selections: selections, ruleSelections: spreadjsTools.ruleSelections};

                var data = {ruleSelections: spreadjsTools.ruleSelections};
                $rootScope.$broadcast('smss-grid-receive', 'add-rules', data);

                //Here update uiOptions but get the uiOptions for formatRules first to append to it if it exists
                if(!_.isEmpty($scope.toolPanelCtrl.selectedData.uiOptions.formatRules)) {
                    existingFormatRules = JSON.parse($scope.toolPanelCtrl.selectedData.uiOptions.formatRules);
                }

                for(var i=selections[0].col; i < selections[0].colCount+selections[0].col; i++) {
                    var tempRule = angular.copy(newRule);
                    tempRule.selections[0].colCount = 1;
                    tempRule.selections[0].col = i;
                    if (existingFormatRules[i]) {
                        existingFormatRules[i].push(tempRule);
                    } else {
                        existingFormatRules[i] = [tempRule];
                    }
                }

                $scope.toolPanelCtrl.updateUiOptions("formatRules", JSON.stringify(existingFormatRules));
                resetRules();
            }

            function removeConditionalRules () {
                var data = {ruleSelections: spreadjsTools.ruleSelections};
                var existingFormatRules = {};
                $rootScope.$broadcast('smss-grid-receive', 'remove-rules', data);

                var sheet = $("#ss").data("spread").getActiveSheet();
                var selections = sheet.getSelections();

                //remove all format rule from selected column
                if($scope.toolPanelCtrl.selectedData.uiOptions && $scope.toolPanelCtrl.selectedData.uiOptions.formatRules) { //remove formatting from this column
                    existingFormatRules = JSON.parse($scope.toolPanelCtrl.selectedData.uiOptions.formatRules);
                    for(var i=selections[0].col; i<selections[0].colCount; i++) {
                        delete existingFormatRules[i];
                    }
                }

                $scope.toolPanelCtrl.updateUiOptions("formatRules", JSON.stringify(existingFormatRules));
            }

            function resetRules () {
                spreadjsTools.ruleSelections = {
                    selected: spreadjsTools.ruleSelections ? spreadjsTools.ruleSelections.selected : "CellValueRule",
                    backColor: "#FF0000",
                    foreColor: "#000000",
                    options: {
                        CellValueRule: {
                            condition: "0", //=== EqualsTo; for some reason spreadjs takes it in based on integers. must be hard coded to represent each condition with a number?
                            lowerBound: 0,
                            upperBound: 0
                        },
                        SpecificTextRule: {
                            condition: "0", //=== Contains
                            text: ""
                        },
                        DateOccurringRule: {
                            condition: "0"
                        },
                        FormulaRule: {
                            formula: ""
                        },
                        Top10Rule: {
                            condition: "0",
                            number: 10
                        },
                        UniqueRule: {},
                        DuplicateRule: {},
                        AverageRule: {
                            condition: "0"
                        }/*,
                        TwoScaleRule: {},
                        ThreeScaleRule: {},
                        DataBarRule: {},
                        IconSetRule: {}*/
                    }
                };
            }
        }

        function spreadjsToolsLink(scope, ele, attrs, ctrl) {
            scope.toolPanelCtrl = ctrl[0];
        }

    }
})();
