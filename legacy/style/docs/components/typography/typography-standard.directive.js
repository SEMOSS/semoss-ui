export default angular
    .module('docs.standard', [])
    .directive('standardSection', standardDirective);

function standardDirective() {
    return {
        restrict: 'E',
        template: require('./typography-standard.directive.html'),
        replace: true,
    };
}
