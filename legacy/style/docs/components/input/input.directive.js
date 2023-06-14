export default angular
    .module('docs.input', [])
    .directive('inputSection', inputDirective);

function inputDirective() {
    inputLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./input.directive.html'),
        link: inputLink,
    };

    function inputLink(scope) {
        scope.inputValue1 = 1;
        scope.inputValue2 = 'input';
        scope.inputValue3 = 'disabled input';

        scope.log = function () {
            console.log(scope.inputValue1);
        };
    }
}
