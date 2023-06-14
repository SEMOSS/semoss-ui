(function () {
    "use strict";

    /**
     * @name interceptor.service.js
     * @desc handles rejection of responses based on user permissions and appropriate error handling.
     */
    angular.module("app.httpInterceptor.service", [])
        .factory("httpInterceptor", httpInterceptor);

    httpInterceptor.$inject = ['$q', '$injector'];

    function httpInterceptor($q, $injector) {
        return {
            responseError: function (error) {
                $injector.invoke(function (permissionsService) {
                    if (error.status === 401) {
                        var userId = error.headers("userId");
                        //sets the appropriate alert text based for 401 error
                        permissionsService.setPermissionsAlert(userId);
                    } else {
                        var etext = "Error";
                        if (error.data && error.data.errorMessage) {
                            etext = error.data.errorMessage;
                        }
                    }
                });
                return $q.reject(error);
            }
        };
    }
})();