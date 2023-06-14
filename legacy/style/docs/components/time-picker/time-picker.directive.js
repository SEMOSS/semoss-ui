export default angular
    .module('docs.time-picker', [])
    .directive('timePickerSection', timePickerDirective);

function timePickerDirective() {
    timePickerLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./time-picker.directive.html'),
        link: timePickerLink,
    };
    function timePickerLink(scope) {
        scope.timePicker1 = {
            value: '01:55 PM',
            format: 'hh:mm A',
        };
        scope.timePicker2 = {
            value: '9:30:15 am',
            format: 'h:mm:ss a',
        };
        scope.timePicker3 = {
            value: '22:30:15',
            format: 'HH:mm:ss',
        };
        scope.timePickerDisabled = true;
    }
}
