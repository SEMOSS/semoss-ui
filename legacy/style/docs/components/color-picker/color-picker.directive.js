export default angular
    .module('docs.color-picker', [])
    .directive('colorPickerSection', colorPickerDirective);
function colorPickerDirective() {
    colorPickerLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./color-picker.directive.html'),
        link: colorPickerLink,
    };
    function colorPickerLink(scope) {
        scope.colorPickerValue = '#40A0FF';
    }
}
