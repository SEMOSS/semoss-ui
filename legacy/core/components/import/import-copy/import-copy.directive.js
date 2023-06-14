'use strict';

export default angular
    .module('app.import-copy.directive', [])
    .directive('importCopy', importCopyDirective);

import './import-copy.scss';

importCopyDirective.$inject = [];

function importCopyDirective() {
    importCopyController.$inject = [];
    importCopyLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^import'],
        controller: importCopyController,
        bindToController: {},
        controllerAs: 'importCopy',
        link: importCopyLink,
        template: require('./import-copy.directive.html'),
    };

    function importCopyController() {}

    function importCopyLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];

        scope.importCopy.step = 1; // step of data
        scope.importCopy.copy = {
            url: '',
        };

        scope.importCopy.checkCopy = checkCopy;
        scope.importCopy.loadCopy = loadCopy;

        /**
         * @name setCopy
         * @desc reset the selected form
         * @return {void}
         */
        function setCopy() {
            scope.importCopy.copy = {
                url: '',
            };
        }

        /**
         * @name checkCopy
         * @desc validate the copy form
         * @return {boolean} is the copy valid or not?
         */
        function checkCopy() {
            return scope.importCtrl.name.valid && scope.importCopy.copy.url;
        }

        /**
         * @name loadCopy
         * @desc validate the copy form
         * @return {boolean} is the copy valid or not?
         */
        function loadCopy() {
            var callback;

            // check if valid
            if (!checkCopy()) {
                return;
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    scope.importCtrl.alert(
                        'error',
                        'Unable to connect to ' + response.pixelReturn[0].output
                    );

                    return;
                }

                scope.importCtrl.alert('success', 'Database Copied');
                scope.importCtrl.exit(output);
            };

            // we do not put tags and description because it should come with it

            scope.importCtrl.query(
                [
                    {
                        type: 'copyAppRepo',
                        components: [
                            scope.importCtrl.name.value,
                            scope.importCopy.copy.url,
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            setCopy();
        }

        initialize();
    }
}
