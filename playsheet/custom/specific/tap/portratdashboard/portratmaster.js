(function () {
    'use strict';

    angular.module('app.tap.portratmaster', [])
        .directive('portratmaster', portratmaster);

    portratmaster.$inject = [];

    function portratmaster() {
        portratmasterLink.$inject = ["scope", "ele", "attrs", "controllers"];
        portratmasterCtrl.$inject = ["$scope"];

        return {
            restrict: 'E',
            controller: portratmasterCtrl,
            link: portratmasterLink,
            bindToController: true,            
            scope: {
                data: "=",
                chartName: "="
            },
            controllerAs: 'portratmasterCtrl',
            priority: 600
        };

        function portratmasterLink(scope, ele, attrs, controllers) {
            //console.log("Entering portratmaster Link");
        }

        function portratmasterCtrl($scope) {
            //console.log("Entering portratmaster Ctrl");
        }
    }
})();
