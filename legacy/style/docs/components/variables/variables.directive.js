export default angular
    .module('docs.variables', [])
    .directive('variablesSection', variablesDirective);
import './variables.scss';
function variablesDirective() {
    variablesLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./variables.directive.html'),
        link: variablesLink,
    };
    function variablesLink(scope) {
        scope.variablesFile =
            require('!!raw-loader!../../../src/variables.scss').default;
    }
}
