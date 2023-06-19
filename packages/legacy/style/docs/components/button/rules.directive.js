export default angular
    .module('docs.buttonRules', [])
    .directive('buttonRules', rulesDirective);
import './rules.scss';
function rulesDirective() {
    return {
        restrict: 'E',
        template: require('./rules.directive.html'),
    };
}
