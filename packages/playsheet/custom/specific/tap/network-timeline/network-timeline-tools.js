(function () {
    'use strict';
    angular.module('app.tap.network-timeline-tools.directive', [])
        .directive('networkTimelineTools', networktimelinetools);

    networktimelinetools.$inject = ['networkTimelineService'];
    function networktimelinetools(networkTimelineService) {
        networktimelinetoolsLink.$inject = ["scope", "ele", "attrs", "controllers"];
        networkTimelineToolsController.$inject = [];

        return {
            restrict: 'A',
            require: ['^toolPanel'],
            scope: {},
            bindToController: true,
            templateUrl: 'custom/specific/tap/network-timeline/network-timeline-tools.html',
            link: networktimelinetoolsLink,
            controller: networkTimelineToolsController,
            controllerAs: "networkTools"
        };

        function networktimelinetoolsLink(scope, ele, attrs, controllers) {
            scope.toolPanelCtrl = controllers[0];
            scope.sliderState = "Initial";
            scope.maxLoe = networkTimelineService.getMaxLOE();
            scope.sliderMax = networkTimelineService.getSliderMax();
            scope.sliderVal = 0;
            scope.labelToggle = true;

            /**
             * @name updateVisualization
             * @desc generic function that requires the fn passed in to be a function in the directive
             */
            function updateVisualization(fn, data) {
                scope.toolPanelCtrl.toolUpdater(fn, data);
                scope.toolPanelCtrl.updateUiOptions(fn, data);
            }

            /**
             * @name setInitialStateSlider
             * @desc sets slider variables to initial state and sends update to network-timeline directive
             */
            scope.setInitialStateSlider = function () {
                scope.sliderState = 'Initial';
                scope.sliderVal = 0;
                updateVisualization('setSliderState', scope.sliderState);
                updateVisualization('updateDataFromSlider', 0);
            };

            /**
             * @name setInitialStateSlider
             * @desc sets slider variables to final state and sends update to network-timeline directive
             */
            scope.setFinalStateSlider = function () {
                scope.sliderState = 'Final';
                scope.sliderMax = scope.sliderVal = networkTimelineService.getSliderMax();

                updateVisualization('setSliderState', scope.sliderState);

                if (scope.maxLoe === 1) {
                    updateVisualization('updateDataFromSlider', 1);
                } else {
                    updateVisualization('updateDataFromSlider', scope.maxLoe + 1);
                }
            };

            /**
             * @name setInitialStateSlider
             * @desc sets slider variables to transition state and sends update to network-timeline directive
             */
            scope.setTransitionStateSlider = function () {
                if (scope.sliderState !== "Transition") {

                    scope.sliderState = 'Transition';
                    scope.sliderMax = networkTimelineService.getSliderMax();

                    updateVisualization('setSliderState', scope.sliderState);
                    updateVisualization('updateDataFromSlider', scope.sliderVal);
                }
            };

            /**
             * @name updateSlider
             * @param v - numerical value of the slider
             * @desc On dragging slider, new value is sent to network timeline
             */
            scope.updateSlider = function (v) {
                updateVisualization('updateDataFromSlider', v);
            };

            /**
             * @name toggleLabel
             * @param toggleBool - boolean for whether to toggle on or off
             * @desc toggles the labels on the force graph
             */
            scope.toggleLabel = function (toggleBool) {
                updateVisualization('toggleLabel', toggleBool);
            };

            /**
             * @name unFreezeAllNodes
             * @desc sends update to parent directive to unfreeze all force nodes
             */
            scope.unFreezeAllNodes = function () {
                updateVisualization('unfreezeNodes');
            };

            /**
             * @name freezeAllNodes
             * @desc sends update to parent directive to freeze all force nodes
             */
            scope.freezeAllNodes = function () {
                updateVisualization('freezeNodes');
            };

            /*scope.setCurrentLabels = function (name, selected) {
                updateVisualization('setCurrentLabels', {name: name, selected: selected});
            };*/

            //has to reinitialize tools when reloaded
            scope.setInitialStateSlider();

        }

        function networkTimelineToolsController() {
        }

    }
})(); //end of controller IIFE
