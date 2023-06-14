import angular from 'angular';

import './playsheet.scss';

export default angular
    .module('app.playsheet.directive', [])
    .directive('playsheet', playsheetDirective);

playsheetDirective.$inject = [
    '$compile',
    '$timeout',
    'ENDPOINT',
    'semossCoreService',
    'monolithService',
    'CONFIG',
];

function playsheetDirective() {
    playsheetCtrl.$inject = [];
    playsheetLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./playsheet.directive.html'),
        scope: {},
        require: ['^widget'],
        controller: playsheetCtrl,
        controllerAs: 'playsheet',
        bindToController: {},
        replace: true,
        link: playsheetLink,
    };

    function playsheetCtrl() {}

    function playsheetLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name updatePlaysheet
         * @desc update the playsheet src
         * @returns {void}
         */
        function updatePlaysheet(): void {
            let src = '';

            const options =
                scope.widgetCtrl.getWidget('view.playsheet.options') || {};

            // if (!window.location.origin) {
            //     src = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname;
            // } else {
            //     src = window.location.origin + window.location.pathname;
            // }

            src += './playsheet/#/';
            src += '?engine=' + options.app_name;
            src += '&questionId=' + options.app_insight_id;
            src += '&layout=' + options.layout;

            // add it
            ele[0].innerHTML = `
            <iframe class="playsheet__iframe"
            frameborder="0"
            width="100%"
            height="100%"
            onmouseover="this.contentWindow.focus()"
            src="${src}"></iframe>
            `;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize(): void {
            updatePlaysheet();
        }

        initialize();
    }
}
