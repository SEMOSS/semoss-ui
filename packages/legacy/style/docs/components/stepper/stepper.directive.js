export default angular
    .module('docs.stepper', [])
    .directive('stepperSection', stepperDirective);

function stepperDirective() {
    stepperLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./stepper.directive.html'),
        replace: true,
        link: stepperLink,
    };

    function stepperLink(scope) {
        scope.navigate = function () {
            scope.$broadcast('smss-stepper--navigate', 'content3');
        };
    }
}
