export default angular
    .module('docs.button', [])
    .directive('buttonSection', buttonDirective);
function buttonDirective() {
    buttonLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./button.directive.html'),
        replace: true,
        link: buttonLink,
    };
    function buttonLink(scope) {
        scope.selectedBtn = 'GRID';
        scope.btnDisabled = true;
    }
}
