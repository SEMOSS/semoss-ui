(function () {
    'use strict';

    /**
     * @name app.module
     * @desc Angular Configuration File
     */

    var app = angular.module('app', [
        /** Angular Libraries **/
        'ngAria',
        'ngSanitize',
        'oc.lazyLoad',
        'toastr',
        /** Configuration **/
        'app.config',
        /** Common **/
        'app.filters',
        'app.dynamic.directive',
        'app.enterkey.directive',
        'app.replace-spaces.directive',
        'app.reset-focus.directive',
        'app.widget-config.service',
        'app.monolith.service',
        'app.utility.service',
        'app.alert.service',
        'app.vizdata.service',
        'app.name-server.service',
        'app.permissions.service',
        'app.data.service',
        'app.pkql.service',
        'app.filter.service',
        'app.pub-sub.service',
        'app.httpInterceptor.service',
        /** Components **/
        'app.loading-screen.directive',
        'flow'
    ]);
})();


