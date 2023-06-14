export default angular
    .module('docs.button-tab', [])
    .directive('buttonTabSection', buttonDirective);
import './button-tab.scss';
function buttonDirective() {
    buttonLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./button-tab.directive.html'),
        replace: true,
        link: buttonLink,
    };
    function buttonLink(scope) {
        scope.tabgroup1 = {
            selected: 1,
            click: function (tab) {
                scope.tabgroup1.selected = tab;
            },
        };
        scope.tabgroup2 = {
            selected: 1,
            click: function (tab) {
                scope.tabgroup2.selected = tab;
            },
        };
        scope.disabledTab = true;
    }
}
