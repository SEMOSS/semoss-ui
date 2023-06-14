(function () {
    "use strict";

    /**
     * @name permissions.service.js
     * @desc central point for handling user permissions and authorizations throughout the application
     */
    angular.module("app.permissions.service", [])
        .factory("permissionsService", permissionsService);

    permissionsService.$inject = ['ENDPOINT', 'LOGIN_PAGE', '$http', '$rootScope', '$window', '$q', "alertService", "monolithService", "dataService"];

    function permissionsService(ENDPOINT, LOGIN_PAGE, $http, $rootScope, $window, $q, alertService, monolithService, dataService) {
        var backendSecurity = false,
            isAuthenticated = false,
            userData = {
                email: "",
                name: "",
                picture: "",
                id: "",
                token: ""
            },
            availableEngines = [],
            permissionsRequests = [],
            userPermissionRequests = [];

        /*** Security **/

        /**
         * @name getSecuritySettings
         * @desc returns security settings so ui can adjust
         */
        function getSecuritySettings() {
            return {
                backendSecurity: backendSecurity,
                isAuthenticated: isAuthenticated,
                userData: userData,
                permissionsRequests: permissionsRequests,
                userPermissionRequests: userPermissionRequests,
                availableEngines: availableEngines
            }
        }

        /**
         * @name checkSecurity
         * @desc checks to see if security is enabled
         */

        function checkSecurity() {
            resetEngines();
        }

        /**
         * @name setPermissionsAlert
         * @desc alerts user of any security changes (if http fails)
         */
        function setPermissionsAlert(userId) {
            var activeAlertText;
            if (userId === "-1" && $window.localStorage.id) {
                //if localStorage has items then we assume user timed out
                activeAlertText = "You were timed out due to inactivity. Please sign in to continue.";
                $window.localStorage.clear();
                userData = {};
                isAuthenticated = false;
                resetEngines();
            } else if (userId === "-1" && !$window.localStorage.id) {
                //we assume user never signed in
                activeAlertText = "Please sign in to continue.";
                userData = {};
                isAuthenticated = false;
                resetEngines();
            } else if (userId !== "-1") {
                //we assume user does not have correct permissions
                activeAlertText = "You do not have the permissions for this functionality.";
            }
            alertService(activeAlertText, 'Error', 'toast-error', 7000);

        }

        /*** Request Functions **/
        /**
         * @name resetEngines
         * @desc function that pulls in all engines and requests and then updates UI (called when security changes)
         */
        function resetEngines() {
            $q.all([getAllEngines(), getEngineAccessRequestsByUser(), getEngineAccessRequests()]).then(function () {
                updateSecurity();
            });
        }

        /**
         * @name getAllEngines
         * @desc sets all the available engines
         */
        function getAllEngines() {
            return monolithService.getAllEngines()
                .then(function (data) {
                    availableEngines = data;
                    return data;
                });
        }

        /**
         * @name getEngineAccessRequests
         * @desc sets all the of the permissionRequests
         */

        function getEngineAccessRequests() {
            var url = ENDPOINT + "/api/authorization/getEngineAccessRequests";

            return $http({
                url: url,
                method: "GET",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                permissionsRequests = response.data.requests;
                return response.data;
            }, function (error) {
                var etext = "Error";
                if (error.data && error.data.errorMessage) {
                    etext = error.data.errorMessage;
                }
                alertService(etext, 'Error', 'toast-error', 7000);
            });

        }

        /**
         * @name getEngineAccessRequestsByUser
         * @desc sets all the of the permissionRequests by user
         */
        function getEngineAccessRequestsByUser() {
            var url = ENDPOINT + "/api/authorization/getEngineAccessRequestsByUser";

            return $http({
                url: url,
                method: "GET",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                userPermissionRequests = response.data;

                return response.data;
            }, function (error) {
                var etext = "Error";
                if (error.data && error.data.errorMessage) {
                    etext = error.data.errorMessage;
                }
                alertService(etext, 'Error', 'toast-error', 7000);
            });
        }

        /**
         * @name addEngineAccessRequest
         * @desc adds an engine request
         */
        function addEngineAccessRequest(engineName) {
            var url = ENDPOINT + "/api/authorization/addEngineAccessRequest",
                postData = "engine=" + engineName;

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                alertService('Permission request has been submitted.', 'Success', 'toast-success', 3000);
                resetEngines();
            }, function (error) {
                var etext = "Error";
                if (error.data && error.data.errorMessage) {
                    etext = error.data.errorMessage;
                } else if (error.data.error) {
                    etext = error.data.error;
                }
                alertService(etext, 'Error', 'toast-error', 7000);
            });
        }

        /**
         * @name processEngineAccessRequest
         * @desc processes an engine request
         */
        function processEngineAccessRequest(requestId, permissions) {
            var url = ENDPOINT + "/api/authorization/processEngineAccessRequest",
                postData = "requestId=" + requestId + "&permissions=" + encodeURIComponent(JSON.stringify(permissions));

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                resetEngines();
                return response.data;
            }, function (error) {
                var etext = "Error";
                if (error.data && error.data.errorMessage) {
                    etext = error.data.errorMessage;
                }
                alertService(etext, 'Error', 'toast-error', 7000);
            });
        }

        /** Updater **/
        /**
         * @name updateSecurity
         * @desc updates ui whenever security changes
         */
        function updateSecurity() {
            $rootScope.$emit('browse-receive', 'update-security');
            $rootScope.$emit('settings-receive', 'update-security');
            $rootScope.$emit('search-receive', 'update-security');
            $rootScope.$emit('related-panel-receive', 'update-security');
            $rootScope.$emit('admin-receive', 'update-security');
        }

        /** Helpers **/
        /**
         * @param backendSecurityEnabled
         * @desc checks to see if security is enabled
         * @returns {boolean}
         */
        function backendSecurityEnabled() {
            var url = ENDPOINT + "/api/authorization/securityEnabled";

            return $http({
                url: url,
                method: "GET",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, function (error) {
                var etext = "Error";
                if (error.data && error.data.errorMessage) {
                    etext = error.data.errorMessage;
                }
                alertService(etext, 'Error', 'toast-error', 7000);
            });
        }

        /**
         * @name logoutSatellizer
         * @param provider {String} Google or Facebook
         * @desc logout authentication from satellizer
         */
        function logoutSatellizer(provider) {
            var url = ENDPOINT + "/api/auth/logout/" + provider;

            return $http({
                url: url,
                method: "GET",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, function (error) {
                var etext = "Error";
                if (error.data && error.data.errorMessage) {
                    etext = error.data.errorMessage;
                }
                alertService(etext, 'Error', 'toast-error', 7000);

                return false
            });
        }


        return {
            getAllEngines: getAllEngines,
            resetEngines: resetEngines,
            checkSecurity: checkSecurity,
            getSecuritySettings: getSecuritySettings,
            setPermissionsAlert: setPermissionsAlert,
            addEngineAccessRequest: addEngineAccessRequest,
            processEngineAccessRequest: processEngineAccessRequest
        };
    }
})();
