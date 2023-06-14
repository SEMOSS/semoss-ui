export default angular
    .module('docs.label', [])
    .directive('labelSection', labelDirective);

function labelDirective() {
    return {
        restrict: 'E',
        template: require('./typography-label.directive.html'),
        replace: true,
    };
}
