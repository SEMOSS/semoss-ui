export default angular
    .module('docs.title', [])
    .directive('titleSection', titleDirective);

function titleDirective() {
    return {
        restrict: 'E',
        template: require('./typography-title.directive.html'),
        replace: true,
    };
}
