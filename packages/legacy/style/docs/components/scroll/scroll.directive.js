export default angular
    .module('docs.scroll', [])
    .directive('scrollSection', scrollDirective);
import './scroll.scss';
function scrollDirective() {
    return {
        restrict: 'E',
        template: require('./scroll.directive.html'),
    };
}
