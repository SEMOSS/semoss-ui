export default angular
    .module('docs.alignment', [])
    .directive('alignmentSection', alignmentDirective);
import './alignment.scss';
function alignmentDirective() {
    return {
        restrict: 'E',
        template: require('./alignment.directive.html'),
        replace: true,
    };
}
