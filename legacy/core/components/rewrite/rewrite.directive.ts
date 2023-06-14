import angular from 'angular';
import './rewrite.scss';

export default angular
    .module('app.rewrite.directive', [])
    .directive('rewrite', rewriteDirective);

rewriteDirective.$inject = [];

function rewriteDirective(
) {
    rewriteCtrl.$inject = [];
    rewriteLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./rewrite.directive.html'),
        scope: {},
        bindToController: {
            src: '@',
        },
        controller: rewriteCtrl,
        controllerAs: 'rewrite',
        link: rewriteLink,
    };

    function rewriteCtrl() {}

    function rewriteLink(scope) {
        // noop
    }
}
