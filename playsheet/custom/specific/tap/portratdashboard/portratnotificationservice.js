(function () {
    'use strict';

    angular.module('app.tap.portratnotificationservice', [])
        .factory('notificationService', notificationService);

    notificationService.$inject = ['$rootScope'];

    function notificationService($rootScope) {

        var events = [
            'single-view-service-data-change', 
            'single-view-service-selected-data-change', 
            'chart-data-change', 
            'multi-id-change', 
            'join-select-change', 
            'toggle-change', 
            'join-filter-change', 
            'send-to-explore'
        ];

        return {
            subscribe: function (scope, event, callback) {
                if (!_.includes(events, event)) {
                    console.log('not a valid event');
                    return;
                }

                var handler = $rootScope.$on(event, callback);
                scope.$on('$destroy', handler);
            },

            notify: function (event, data, id) {
                $rootScope.$emit(event, data, id);
            }

        };
    }
})();