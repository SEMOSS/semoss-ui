'use strict';

import './share.scss';

/**
 * @name embed
 * @desc The embed link for a given visualization
 */
export default angular
    .module('app.share.directive', [])
    .directive('share', shareDirective);

shareDirective.$inject = [
    '$location',
    '$window',
    'monolithService',
    'ENDPOINT',
];

function shareDirective($location, $window, monolithService, ENDPOINT) {
    shareCtrl.$inject = [];
    shareLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'share',
        bindToController: {},
        template: require('./share.directive.html'),
        controller: shareCtrl,
        link: shareLink,
    };

    function shareCtrl() {}

    function shareLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.share.shareURL = '';

        scope.share.copyText = copyText;
        scope.share.setSecret = setSecret;

        /**
         * @name copyText
         * @desc this will copy the text to the clipboard
         * @param {string} text - text to copy
         * @returns {void}
         */
        function copyText(text) {
            var exportElement;
            // For IE.
            if ($window.clipboardData) {
                $window.clipboardData.setData('Text', text);
            } else {
                exportElement = angular.element(
                    "<textarea style='position:fixed;left:-1000px;top:-1000px;'>" +
                        text +
                        '</textarea>'
                );
                ele.append(exportElement);
                exportElement.select();

                if (document.execCommand('copy')) {
                    exportElement.remove();
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully copied to clipboard'
                    );
                } else {
                    exportElement.remove();
                    scope.widgetCtrl.alert('error', 'Cannot copy to clipboard');
                }
            }
        }

        /**
         * @name setSecret
         * @desc set secret and begin process to share session, gives user a share url to enter
         * @return {void}
         */
        function setSecret() {
            // /auth/cookie?i=<instanceid>&s=<password> step
            // need password to share
            // gets back ?JESSIONSID=<id>&hash=<hash>&i=<instanceid>
            // need to open page with password
            // then open semoss with ?JESSSIONSID=<id>&hash=<hash>&i=<instanceid>&s=<password>
            monolithService
                .setCookie(scope.widgetCtrl.insightID, scope.share.secret)
                .then(function (response) {
                    var path = window.location.pathname;
                    // find deploy path;
                    // it is always everything up to the second to last backslash in window.location.pathname
                    if (path[path.length - 1] === '/') {
                        path = path.substring(0, path.length - 1);
                    }
                    path = path.substring(0, path.lastIndexOf('/'));
                    if (path[0] !== '/' && path) {
                        path = '/' + path;
                    }
                    scope.share.shareURL =
                        'http://' +
                        window.location.hostname +
                        ':' +
                        scope.share.port +
                        path +
                        '/' +
                        ENDPOINT.MODULE +
                        '/share/' +
                        response.PARAM;
                    scope.widgetCtrl.alert('success', 'Share URL updated');
                });
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl;
            scope.share.port = '80';
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {});
    }
}
