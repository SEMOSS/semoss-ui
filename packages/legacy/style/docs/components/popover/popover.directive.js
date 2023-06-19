export default angular
    .module('docs.popover', [])
    .directive('popoverSection', popoverDirective);
import './popover.scss';
function popoverDirective() {
    popoverLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./popover.directive.html'),
        link: popoverLink,
    };
    function popoverLink(scope) {
        scope.popoverTypes = 'hello';
    }
}
