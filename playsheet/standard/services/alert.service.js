(function () {
    "use strict";

    /**
     * @name alert.service.js
     * @desc handles creation of application alerts through toastr.
     */
    angular.module('app.alert.service', [])
        .factory('alertService', alertService);

    alertService.$inject = ["toastr"];

    function alertService(toastr) {
        return function (subtitle, title, toast_color, timeout) {
            //angular.element('#toast-container').remove(); //why do we need to remove the toast..? chained toasts will all be removed and not displayed at all with this remove
            //toastr.clear();
            if(subtitle != null) {
                toastr.success(subtitle, title, {
                    closeButton: true,
                    iconClass: toast_color,
                    timeOut: timeout,
                    allowHtml: true
                });
            }
        };
    }

})();