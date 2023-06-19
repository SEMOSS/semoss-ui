export default angular
    .module('docs.typeahead', [])
    .directive('typeaheadSection', typeaheadDirective);

typeaheadDirective.$inject = ['$filter'];

function typeaheadDirective($filter) {
    typeaheadLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./typeahead.directive.html'),
        link: typeaheadLink,
    };
    function typeaheadLink(scope) {
        scope.typeahead1 = {
            options: [
                'Lorem',
                'Lorem_ipsum',
                'Lorem_ipsum_dolor',
                'ipsum',
                'ipsum_dolor',
                'dolor',
                'a',
                'b',
                'c',
                'd',
                'e',
                'f',
                'g',
            ],
            selected: '',
            placeholder: 'Start typing here',
            scroll: scrollFunction,
            loading: false,
        };
        scope.typeahead2 = {
            options: [
                {
                    display: 'apple',
                    value: 0,
                },
                {
                    display: 'orange',
                    value: 1,
                },
                {
                    display: 'banana',
                    value: 2,
                },
            ],
            selected: '',
        };
        function scrollFunction() {
            console.log('Typeahead list is scrolling');
        }
    }
}
