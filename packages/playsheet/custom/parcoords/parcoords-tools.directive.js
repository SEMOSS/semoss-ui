(function () {
    'use strict';

    angular.module('app.parcoords-tools.directive', [])
        .directive('parcoordsTools', parcoordsTools);

    //injectors
    parcoordsTools.$inject = [];

    function parcoordsTools() {
        parcoordsToolsLink.$inject = ["scope", "ele", "attrs", "controllers"];
        parcoordsToolsCtrl.$inject = ["$scope"];

        return {
            restrict: 'EA',
            require: ['^toolPanel'],
            bindToController: {},
            templateUrl: 'custom/parcoords/parcoords-tools.directive.html',
            controllerAs: 'parcoordsTools',
            controller: parcoordsToolsCtrl,
            link: parcoordsToolsLink
        };

        function parcoordsToolsLink(scope, ele, attrs, controllers) {
            scope.toolPanelCtrl = controllers[0];

            //calculate drop down values
            var dropDownValues = [];
            for (var i in scope.toolPanelCtrl.selectedData.dataTableAlign) {
                dropDownValues.push(scope.toolPanelCtrl.selectedData.dataTableAlign[i]);
            }

            scope.dimensionDropDown = {
                list: [],
                selected: ""
            };
            scope.overlapSelectedDropDown = {
                list: dropDownValues,
                selected: ""
            };
            scope.overlapRelatedDropDown = {
                list: [],
                selected: ""
            };
            scope.isWidthActive = false;
            scope.isHeightActive = false;
            scope.forwardStateActivated = false;
            scope.backStateActivated = false; //set to false initially
            scope.select2Options = {
                allowClear: true
            };
            scope.parCoordsToolLength = 0;
            scope.parCoordsToolState = 0;
            if(scope.toolPanelCtrl.selectedData.uiOptions) {
                scope.isWidthActive = scope.toolPanelCtrl.selectedData.uiOptions.widthFitToScreen;
                scope.isHeightActive = scope.toolPanelCtrl.selectedData.uiOptions.heightFitToScreen;
            }
        }
    }

    //controller for the directive
    function parcoordsToolsCtrl($scope) {
        var parcoordsTools = this;

        parcoordsTools.populateDropDown = populateDropDown;
        parcoordsTools.populateOverlapDropDown = populateOverlapDropDown;
        parcoordsTools.clearDropDown = clearDropDown;
        parcoordsTools.resetTools = resetTools;
        parcoordsTools.removeSelected = removeSelected;
        parcoordsTools.drillDown = drillDown;
        parcoordsTools.resetPerspective = resetPerspective;
        parcoordsTools.backStatePress = backStatePress;
        parcoordsTools.forwardStatePress = forwardStatePress;
        parcoordsTools.heightFitToScreen = heightFitToScreen;
        parcoordsTools.widthFitToScreen = widthFitToScreen;
        parcoordsTools.createOverlap = createOverlap;
        parcoordsTools.ifExtend = ifExtend;

        function ifExtend() {
            if ($scope.overlapSelectedDropDown.list.length > 3 || $scope.overlapRelatedDropDown.list.length > 3){
                if (parcoordsTools.extend === true) {
                    return true;
                }
            }
            return false;
        }

        function clearDropDown() {
            $scope.dimensionDropDown.selected = '';
        }

        function resetTools() {
            $scope.isWidthActive = false;
            $scope.isHeightActive = false;
            $scope.backStateActivated = false;
            $scope.forwardStateActivated = false;
        }

        function removeSelected(selected) {
            var list = $scope.overlapSelectedDropDown.list.slice();
            var index = list.indexOf(selected);
            $scope.overlapRelatedDropDown.selected = "";
            $scope.overlapRelatedDropDown.list = list;
            $scope.overlapRelatedDropDown.list.splice(index, 1);
        }

        function populateDropDown(dropDownData) {
            console.log("Dimension drop down data: ");
            //console.log($scope.dimensionDropDown.list);
            $scope.dimensionDropDown.list = [];
            for (var key in dropDownData[0]) {
                if (!_.isNaN(Number(dropDownData[0][key]))) {
                    $scope.dimensionDropDown.list.push(key);
                }
            }
        }

        function populateOverlapDropDown(overlapData) {
            $scope.overlapSelectedDropDown.list = _.keys(overlapData[0]);
            $scope.overlapRelatedDropDown.list = _.keys(overlapData[0]);
        }

        function drillDown() {
            //if you drill down after you have moved back a couple steps, reset the variables to reset the forward button
            if ($scope.parCoordsToolState < $scope.parCoordsToolLength) {
                $scope.parCoordsToolLength = $scope.parCoordsToolState;
            }

            $scope.parCoordsToolLength++;
            $scope.parCoordsToolState++;
            $scope.toolPanelCtrl.toolUpdater('drillDown', $scope.parCoordsToolState);
        }

        function resetPerspective() {
            $scope.parCoordsToolState = 0;
            $scope.parCoordsToolLength = 0;
            $scope.toolPanelCtrl.toolUpdater('resetPerspective', null);
        }

        function backStatePress() {
            if ($scope.parCoordsToolState > 0) {
                $scope.parCoordsToolState--;
                $scope.toolPanelCtrl.toolUpdater('changeBackForward', $scope.parCoordsToolState);
            }
        }

        function forwardStatePress() {
            if ($scope.parCoordsToolState < $scope.parCoordsToolLength) {
                $scope.parCoordsToolState++;
                $scope.toolPanelCtrl.toolUpdater('changeBackForward', $scope.parCoordsToolState);
            }
        }

        function widthFitToScreen() {
            $scope.toolPanelCtrl.updateUiOptions('widthFitToScreen', $scope.isWidthActive);
            $scope.toolPanelCtrl.updateUiOptions('heightFitToScreen', $scope.isHeightActive);
            $scope.toolPanelCtrl.toolUpdater('widthFitToScreen', null);
        }

        function heightFitToScreen() {
            $scope.toolPanelCtrl.updateUiOptions('widthFitToScreen', $scope.isWidthActive);
            $scope.toolPanelCtrl.updateUiOptions('heightFitToScreen', $scope.isHeightActive);
            $scope.toolPanelCtrl.toolUpdater('heightFitToScreen', null);
        }

        function createOverlap(selected, related) {
            var input = [selected, related, $scope.parCoordsToolState];
            $scope.parCoordsToolState++;
            $scope.parCoordsToolLength++;
            $scope.toolPanelCtrl.toolUpdater('createOverlap', input);
        }


        //populateDropDown($scope.parcoordsTools.dropDownData);
        //populateOverlapDropDown($scope.parcoordsCtrl.overlapData);


    }
})(); //end of controller IIFE
