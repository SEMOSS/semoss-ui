export default angular
    .module('docs.date-picker', [])
    .directive('datePickerSection', datePickerDirective);

function datePickerDirective() {
    datePickerLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./date-picker.directive.html'),
        link: datePickerLink,
    };
    function datePickerLink(scope) {
        scope.datePickerValue1 = '04/19/2008';
        scope.datePickerValue2 = '10/22/2021 09:30:15 AM'; // MM/DD/YYYY hh:mm:ss A
        scope.datePickerValue3 = '10/22/2021 9:30:15 am'; // MM/DD/YYYY h:mm:ss a
        scope.datePickerValue4 = '10/22/2021 22:30:15'; // MM/DD/YYYY HH:mm:ss
        scope.datePickerValue5 = '10/22/2021 22:30:15'; // MM/DD/YYYY H:mm:ss
        scope.datePickerDisabled = true;
    }
}
