(function () {
    'use strict';

    angular.module('app.tap.portratselectpanel', [])
        .directive('portratselectpanel', portratselectpanel);

    portratselectpanel.$inject = ['$rootScope'];
    PortRatSelectPanelCtrl.$inject = ['$scope', '$rootScope', 'portratdashboardService'];

    function portratselectpanel($rootScope) {
        PortRatSelectPanelLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];

        function PortRatSelectPanelLink(scope, ele, attrs, controllers) {
            scope.portratController = controllers[0];
            $rootScope.$broadcast('portRatSelectPanelLoadScreenOn');
        }

        return {
            restrict: 'E',
            scope: true,
            require: ['^portrat'],
            bindToController: true,
            templateUrl: 'custom/specific/tap/portratdashboard/leftpanel/portratselectpanel/portratselectpanel.html',
            controllerAs: 'portratselectpanelctrl',
            controller: PortRatSelectPanelCtrl,
            link: PortRatSelectPanelLink
        }
    }

    function PortRatSelectPanelCtrl($scope, $rootScope, portratdashboardService) {
        this.selectedTab = "Systems";
        this.insightTurnsToCheckMark = "Overview";
        this.loadingScreenName = "portRatSelectPanel";
        this.systemList = [{name: "Overview", ind: "Overview"}];

        var prdSelectCleanUpFunc = $scope.$watch('portratController.portRatSystemList', function () {
            this.systemList = [{name: "Overview", ind: "Overview"}];
            if (!_.isEmpty($scope.portratController.portRatSystemList)) {
                //this sorts the system & capability lists alphabetically. The sorted listed are then concatenated with this.<type>list so overview remains at the top
                var prdSysList = JSON.parse(JSON.stringify($scope.portratController.portRatSystemList));
                prdSysList.sort(function (a, b) {
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    else return 0;
                });
                this.systemList = this.systemList.concat(prdSysList);
            }
        }.bind(this), true);

        var prdSelectedSys = $scope.$watch('portratController.currentSystemData', function () {
            if ($scope.portratController.currentSystemData != "") {
                this.insightTurnsToCheckMark = $scope.portratController.currentSystemData.name;
            }
        }.bind(this), true);

        this.getSystemData = function (sys) {
            if($scope.portratController.currentSystemData != sys) {
                $scope.portratController.loadScreen = true;
            }
            $scope.portratController.currentSystemData = sys;
        };

        this.showParamPanel = function () {
            $scope.portratController.showSelectPanel = false;
            $scope.portratController.showReturnToSelectToggle = true;
            $scope.portratController.showParamPanel = true;
        };

        $scope.$on('$destroy', function () {
            prdSelectCleanUpFunc();
            prdSelectedSys();
        });

    }

})(); //end of controller IIFE