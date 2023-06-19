(function () {
    "use strict";

    angular.module('app.tap.service', [])
        .factory('tapService', tapService);

    tapService.$inject = [];

    function tapService() {
        var sysDupColorScale = null;

        function setSysDupColorScale(scale) {
            sysDupColorScale = scale;
        }

        function getSysDupColorScale() {
            return sysDupColorScale;
        }

        return {
            setSysDupColorScale: setSysDupColorScale,
            getSysDupColorScale: getSysDupColorScale
        };
    }

})();