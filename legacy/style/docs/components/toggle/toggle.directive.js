export default angular
    .module('docs.toggle', [])
    .directive('toggleSection', toggleDirective);
function toggleDirective() {
    toggleLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./toggle.directive.html'),
        link: toggleLink,
    };
    function toggleLink(scope) {
        scope.toggleValue = false;
        scope.toggleDisabled = true;
    }
}
