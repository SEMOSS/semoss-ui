(function () {
    'use strict';

    /**
     * @name embed
     * @desc The embed link for a given visualization
     */
    angular.module('app.embed.directive', [])
        .directive('embedPanel', embedPanel);

    embedPanel.$inject = ['$rootScope', '$location', 'dataService'];

    function embedPanel($rootScope, $location, dataService) {

        embedPanelCtrl.$inject = ["$scope"];
        embedPanelLink.$inject = ["scope", "ele", "attrs", "controllers"];

        return {
            restrict: 'EA',
            scope: {},
            require: [],
            controllerAs: 'embedPanel',
            bindToController: {
            },
            templateUrl: 'custom/embed/embed.directive.html',
            controller: embedPanelCtrl,
            link: embedPanelLink
        };

        function embedPanelCtrl($scope) {
            var embedPanel = this;

            embedPanel.embedCode = "";
            embedPanel.embedConfig = {
                resizable: false,
                vizSettings: false
            };

            embedPanel.updateEmbedString = updateEmbedString;

            /**
             * @name updateEmbedString
             * @desc updates the embed string
             */
            function updateEmbedString() {
                var embedWidth = 1000,
                    embedHeight = 600,
                    engine = embedPanel.selectedData.core_engine.name,
                    insightId = JSON.parse(JSON.stringify(embedPanel.selectedData.insightID));

                //need to parse out the "db insight ID" from the insightId
                insightId = insightId.substr(insightId.indexOf(" ") + 1);

                embedPanel.embedCode = "<iframe frameborder=\"0\" width=\"" + embedWidth + "\" height=\"" + embedHeight + "\"" +
                    " style=\"border: 1px solid #ccc;";

                if (embedPanel.embedConfig.resizable) {
                    embedPanel.embedCode += "resize: both;overflow: auto;\""
                } else {
                    embedPanel.embedCode += "\"";
                }

                var settingsToggleString = "false";
                if (embedPanel.embedConfig.vizSettings) {
                    settingsToggleString = "true";
                }

                embedPanel.embedCode += "src=\"" + $location.absUrl().split('#')[0] + "#/embed?engine=" + encodeURIComponent(engine) + "&insightId=" + encodeURIComponent(insightId) + "&setttings=";
                embedPanel.embedCode += settingsToggleString + "\"></iframe>";
                console.log(embedPanel.embedCode);
            }
        }

        function embedPanelLink(scope, ele, attrs, ctrl) {
            /**
             * @name initialize
             */
            function initialize() {
                var currentWidget = dataService.getWidgetData();
                if (currentWidget && currentWidget.data) {
                    scope.embedPanel.selectedData = currentWidget.data.chartData;
                }
                if (scope.embedPanel.selectedData) {
                    scope.embedPanel.updateEmbedString()
                }
            }

            initialize();

            //listeners
            var embedUpdateListener = $rootScope.$on('update-widget', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-widget');
                var currentWidget = dataService.getWidgetData();
                if (currentWidget && currentWidget.data) {
                    scope.embedPanel.selectedData = currentWidget.data.chartData;
                }
                if (scope.embedPanel.selectedData) {
                    scope.embedPanel.updateEmbedString()
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying embedPanel....');
                embedUpdateListener();
            });
        }

    }
})();
