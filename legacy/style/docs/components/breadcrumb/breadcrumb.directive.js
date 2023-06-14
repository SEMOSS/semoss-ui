export default angular
    .module('docs.breadcrumb', [])
    .directive('breadcrumbSection', breadcrumbDirective);
function breadcrumbDirective() {
    breadcrumbLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./breadcrumb.directive.html'),
        replace: true,
        link: breadcrumbLink,
    };
    function breadcrumbLink(scope) {
        scope.breadcrumb = {
            greet: function (text) {
                console.log('Hello World: ', text);
            },
        };
    }
}
