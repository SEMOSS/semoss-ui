export default angular
    .module('docs.checklist', [])
    .directive('checklistSection', checklistDirective);

function checklistDirective() {
    checklistLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./checklist.directive.html'),
        link: checklistLink,
    };
    function checklistLink(scope) {
        scope.checklist1 = {
            value: [],
            options: [null, 'Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
        };
        scope.checklist2 = {
            value: [],
            options: [
                {
                    display: 'apple',
                    value: 0,
                },
                {
                    display: 'banana',
                    value: 1,
                },
                {
                    display: 'orange',
                    value: 2,
                },
            ],
            disabled: true,
        };
    }
}
