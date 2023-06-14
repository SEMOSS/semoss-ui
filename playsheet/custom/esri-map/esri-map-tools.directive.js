(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */

    angular.module('app.esri-map-tools.directive', [])
        .directive('esriMapTools', esriMapTools);

    esriMapTools.$inject = [];

    function esriMapTools() {

        esriMapToolsCtrl.$inject = ["$scope"];
        esriMapToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'esriMapTools',
            bindToController: {},
            templateUrl: 'custom/esri-map/esri-map-tools.directive.html',
            controller: esriMapToolsCtrl,
            link: esriMapToolsLink
        };
        function esriMapToolsCtrl($scope) {
            var esriMapTools = this;

            esriMapTools.layers = [
                { layerDisplay: "Street Layer", layer: "streets" },
                { layerDisplay: "Topographic Layer", layer: "topo"},
                { layerDisplay: "Satellite Layer", layer: "satellite"},
                { layerDisplay: "Hybrid Layer", layer: "hybrid"},
                { layerDisplay: "Gray Layer", layer: "gray"},
                { layerDisplay: "National Geographic", layer: "national-geographic"},
                { layerDisplay: "Terrain Layer", layer: "terrain"},
                //"Open Street Map Layer": "osm",
                { layerDisplay: "Ocean Layer", layer: "oceans"}
            ];

            esriMapTools.mapBaseLayer = {
                selected: { layerDisplay: "Street Layer", layer: "streets" }
            };

            //functions
            esriMapTools.toggleDrawLine = toggleDrawLine;
            esriMapTools.clearDrawings = clearDrawings;
            esriMapTools.updateBaseLayer = updateBaseLayer;
            esriMapTools.getMapBaseLayer = getMapBaseLayer;
            esriMapTools.setMapBaseLayer = setMapBaseLayer;


            function getMapBaseLayer(){
                return $scope.selectedLayer.selected;
            }

            function setMapBaseLayer(selected) {
                esriMapTools.mapBaseLayer.selected = selected;
                $scope.toolPanelCtrl.updateUiOptions('baseLayer', esriMapTools.mapBaseLayer.selected.layer);
            }

            function toggleDrawLine() {
                $scope.toolPanelCtrl.updateUiOptions('drawLineToggle', !$scope.toolPanelCtrl.selectedData.uiOptions.drawLineToggle);
                $scope.toolPanelCtrl.toolUpdater('toggleDrawLine', !$scope.toolPanelCtrl.selectedData.uiOptions.drawLineToggle);
            }

            function clearDrawings() {
                $scope.toolPanelCtrl.toolUpdater('clearDrawings', null);
            }

            function updateBaseLayer(selectedLayer) {
                setMapBaseLayer(selectedLayer);
                $scope.toolPanelCtrl.toolUpdater('setBaseMap', selectedLayer.layer);
                //$scope.toolPanelCtrl.toolUpdater('setBaseLayer', $scope.selectedLayer.selected);
            }

            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {}

            initialize();

        }

        function esriMapToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];

        }
    }
})();
