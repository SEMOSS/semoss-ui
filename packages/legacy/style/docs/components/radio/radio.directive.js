export default angular
    .module('docs.radio', [])
    .directive('radioSection', radioDirective);

function radioDirective() {
    radioLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./radio.directive.html'),
        link: radioLink,
    };
    function radioLink(scope) {
        scope.radioBtnValue = 'ipsum';
        scope.radioBtnDisable = true;
    }
}
