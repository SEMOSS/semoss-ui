export default angular
    .module('docs.checkbox', [])
    .directive('checkboxSection', checkboxDirective);

function checkboxDirective() {
    checkboxLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./checkbox.directive.html'),
        link: checkboxLink,
    };

    function checkboxLink(scope) {
        scope.check1 = true;
        scope.check2 = true;
        scope.check3 = true;
        scope.check4 = true;
    }
}
