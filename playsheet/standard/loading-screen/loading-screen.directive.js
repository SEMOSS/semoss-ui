(function () {
    "use strict";

    angular.module("app.loading-screen.directive", [])
        .directive("loadingScreen", loadingScreen);

    loadingScreen.$inject = [];

    function loadingScreen() {

        loadingScreenLink.$inject = ["scope"];

        return {
            restrict: "EA",
            scope: {
                loadingScreenShow: "=",
                message: "=?"
            },
            templateUrl: "standard/loading-screen/loading-screen.directive.html",
            link: loadingScreenLink
        };

        //Loading screen tied to container that directive it is placed in
        function loadingScreenLink(scope, ele, attrs, controllers) {
            scope.$watch('loadingScreenShow', function () {
                scope.loadScreen = scope.loadingScreenShow;
                if(typeof scope.message !== 'string') {
                    scope.message = 'Loading...';
                }
            });
        }
        
    }

})
(); //end of controller IIFE