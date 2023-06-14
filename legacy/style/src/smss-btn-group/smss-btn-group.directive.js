export default angular
    .module('smss-style.btn-group', [])
    .directive('smssBtnGroup', smssBtnGroup);

import './smss-btn-group.scss';

smssBtnGroup.$inject = [];

function smssBtnGroup() {
    smssBtnGroupLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'EA',
        template: '<div class="smss-btn-group" ng-transclude></div>',
        replace: true,
        transclude: true,
        link: smssBtnGroupLink,
    };

    function smssBtnGroupLink(scope, ele, attrs) {
        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {}

        initialize();
    }
}
