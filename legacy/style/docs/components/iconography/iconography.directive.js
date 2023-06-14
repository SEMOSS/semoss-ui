export default angular
    .module('docs.iconography', [])
    .directive('iconographySection', iconDirective);
import './iconography.scss';

function iconDirective() {
    return {
        restrict: 'E',
        template: require('./iconography.directive.html'),
    };
}
