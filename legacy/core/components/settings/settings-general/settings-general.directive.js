'use strict';

export default angular
    .module('app.settings.settings-general', [])
    .directive('settingsGeneral', settingsGeneralDirective);

settingsGeneralDirective.$inject = [
    'monolithService',
    'semossCoreService',
    '$q',
    '$timeout',
];

function settingsGeneralDirective() {
    settingsGeneralCtrl.$inject = ['$scope'];
    settingsGeneralLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./settings-general.directive.html'),
        controller: settingsGeneralCtrl,
        link: settingsGeneralLink,
        require: ['^settings'],
        scope: {},
        bindToController: {
            type: '=',
            items: '=',
            selected: '=',
            users: '=',
        },
        controllerAs: 'settingsGeneral',
    };

    function settingsGeneralCtrl() {}

    function settingsGeneralLink(scope, ele, attrs, ctrl) {
        scope.settingsCtrl = ctrl[0];
        scope.settingsGeneral.typeSingular = '';
        scope.settingsGeneral.userSearchterm = '';
        scope.settingsGeneral.insightSearchterm = '';
        scope.settingsGeneral.insightUserSearchterm = '';
        scope.settingsGeneral.itemTabs = [
            'Project Permissions',
            'Insight Permissions',
        ];
        scope.settingsGeneral.selectedItemTab = 'Project Permissions';

        scope.settingsGeneral.updateSelectedItem = updateSelectedItem;
        scope.settingsGeneral.filterResults = filterResults;
        scope.settingsGeneral.closeWarnSelfDemote = closeWarnSelfDemote;

        /**
         * @name filterResults
         * @desc updates the UI when a new item from the list is selected
         * @param {*} isReadOnly - selected item
         * @returns {*} true or false
         */
        function filterResults(isReadOnly) {
            if (isReadOnly) {
                return function (item) {
                    return item.permissions.viewer; // returns true if project/db has read-only permissions
                };
            }
            return function (item) {
                return !item.permissions.viewer; // returns true if project/db has author or editor permissions
            };
        }

        /**
         * @name updateSelectedItem
         * @desc updates the UI when a new item from the list is selected
         * @param {*} item - selected item
         * @param {string} tab - tab name
         * @returns {void}
         */
        function updateSelectedItem(item, tab) {
            scope.settingsGeneral.userSearchterm = '';
            scope.settingsGeneral.insightSearchterm = '';
            scope.settingsGeneral.insightUserSearchterm = '';
            scope.settingsGeneral.selectedItemTab = 'Project Permissions';
            scope.settingsCtrl.updateItemData(item, false, tab);
        }

        /**
         * @name closeWarnSelfDemote
         * @desc close the warning overlay and update the corresponding data
         * @returns {void}
         */
        function closeWarnSelfDemote() {
            if (scope.settingsGeneral.type === 'Projects') {
                scope.settingsCtrl.getProjectUsers(
                    false,
                    scope.settingsCtrl.project.id
                );
            } else {
                scope.settingsCtrl.getDBUsers(false, scope.settingsCtrl.db.id);
            }
            scope.settingsCtrl.warnSelfDemote = false;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.settingsGeneral.typeSingular =
                scope.settingsGeneral.type.slice(0, -1);
        }

        initialize();
    }
}
