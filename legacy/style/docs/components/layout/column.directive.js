export default angular
    .module('docs.column', [])
    .directive('columnSection', columnDirective);
import './column.scss';
function columnDirective() {
    return {
        restrict: 'E',
        template: require('./column.directive.html'),
        replace: true,
    };
}
