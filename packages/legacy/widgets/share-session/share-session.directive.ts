'use strict';

import angular from 'angular';

import './share-session.scss';

export default angular
    .module('app.share-session.directive', [])
    .directive('shareSession', shareSessionDirective);

shareSessionDirective.$inject = ['ENDPOINT', 'semossCoreService', '$location'];

function shareSessionDirective(ENDPOINT, semossCoreService, $location) {
    shareSessionLink.$inject = [];

    return {
        restrict: 'E',
        template: require('./share-session.directive.html'),
        scope: {},
        require: ['^insight'],
        controllerAs: 'shareSession',
        bindToController: {},
        link: shareSessionLink,
        controller: shareSessionCtrl,
    };

    function shareSessionCtrl() {}

    function shareSessionLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];

        scope.shareSession.resizable = false;

        scope.shareSession.custom = {
            open: false,
            valid: false,
            path: '',
        };

        scope.shareSession.selectedDashboard = 'URL';
        scope.shareSession.selectedJBDC = 'REST API';

        scope.shareSession.copyToClipboard = copyToClipboard;
        scope.shareSession.setSelectedDashboard = setSelectedDashboard;
        scope.shareSession.setSelectedJBDC = setSelectedJBDC;
        scope.shareSession.updateIframeUrl = updateIframeUrl;

        /**
         * Copies string to clipboard and notifies user
         * @param str String to copy to Clipboard
         */
        function copyToClipboard(str: string): void {
            navigator.clipboard.writeText(str);

            semossCoreService.emit('alert', {
                color: 'success',
                text: 'Successfully copied to clipboard',
            });
        }

        /**
         * @param {string} tab Name of tab
         */
        function setSelectedJBDC(tab: string): void {
            scope.shareSession.selectedJBDC = tab;
        }

        /**
         * @param {string} tab Name of tab
         */
        function setSelectedDashboard(tab: string): void {
            scope.shareSession.selectedDashboard = tab;
        }

        function updateIframeUrl(): void {
            const resizable = scope.shareSession.resizable
                ? 'resize: both;overflow: auto;'
                : '';

            scope.shareSession.code = `<iframe frameborder="0" width="1000" height="600" style="border: 1px solid #ccc;${resizable}" src="${scope.shareSession.url}"></iframe>`;
        }

        /**
         * updates values
         */
        function update(): void {
            const { URL, HOST, PORT, MODULE } = ENDPOINT;
            const { insightID } = scope.insightCtrl;
            const frameName = Object.keys(
                scope.insightCtrl.getShared('frames')
            )[0];

            scope.shareSession.insightID = insightID;
            scope.shareSession.jdbcJson = `${URL}/api/project-session/jdbc_json?insightId=${insightID}&open=true&sql=Select * from ${frameName}`;
            scope.shareSession.jdbcCsv = `${URL}/api/project-session/jdbc_csv?insightId=${insightID}&open=true&sql=Select * from ${frameName}`;
            scope.shareSession.jdbc = `jdbc:smss:${HOST}:${
                PORT === '' ? '80' : PORT
            };endpoint=${MODULE};protocol=http;user=<USER>;pass=<PASS>;project=session;insight=${insightID}`;
            scope.shareSession.url = `${
                $location.absUrl().split('#')[0]
            }#!/insight?engine=project-session&id=${insightID}`;

            updateIframeUrl();
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize(): void {
            update();
        }

        initialize();
    }
}
