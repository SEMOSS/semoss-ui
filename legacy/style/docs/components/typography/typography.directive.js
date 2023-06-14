export default angular
    .module('docs.typography', [])
    .directive('typographySection', typographyDirective);

function typographyDirective() {
    return {
        restrict: 'E',
        template: require('./typography.directive.html'),
        replace: true,
    };
}
