export default angular
    .module('docs.list', [])
    .directive('listSection', listDirective);
function listDirective() {
    listLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./list.directive.html'),
        link: listLink,
    };
    function listLink(scope) {
        scope.listOptions1 = [
            'Lorem',
            'ipsum',
            'dolor',
            'sit',
            'amet',
            'consectetur',
            'adipiscing',
            'elit',
            'sed',
            'do',
            'eiusmod',
        ];
        scope.listOptions2 = Array.apply(null, {
            length: 1000,
        }).map(Number.call, Number);

        scope.listOptions3 = [
            {
                display: 'apple',
                value: 0,
                icon: 'fa-circle',
            },
            {
                display: 'banana',
                value: 1,
                icon: 'fa-star',
            },
            {
                display: 'orange',
                value: 2,
                icon: 'fa-square',
            },
        ];
    }
}
