export default angular
    .module('docs.dropdown', [])
    .directive('dropdownSection', dropdownDirective);

function dropdownDirective() {
    dropdownLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./dropdown.directive.html'),
        link: dropdownLink,
    };

    function dropdownLink(scope) {
        scope.log = function (search) {
            console.log(search);
        };
        scope.actionFunction = function () {
            console.log('button was clicked');
        };

        scope.dropdownSearch = false;

        scope.dropdown1 = 0;
        scope.dropdown2 = 'Lorem';
        scope.dropdown3 = '';
        scope.options = {
            dropdown5: ['a', 'b', 'c'],
            dropdown6: [null, 'a', 'b'],
            complex: [
                {
                    display: 'Lorem',
                    value: 0,
                    items: ['1', '2', '3'],
                },
                {
                    display: 'ipsum',
                    value: 1,
                    items: ['1', '2', '3'],
                },
                {
                    display: 'dolor',
                    value: 2,
                    items: ['1', '2', '3'],
                },
                {
                    display: 'sit',
                    value: 3,
                    items: ['1', '2', '3'],
                },
                {
                    display: 'amet',
                    value: 4,
                    items: ['1', '2', '3'],
                },
                {
                    display: 'Lorem ipsum',
                    value: 5,
                    items: ['1', '2', '3'],
                },
                {
                    display: 'Lorem ipsum dolor',
                    value: 6,
                    items: ['1', '2', '3'],
                },
                {
                    display: 'ipsum dolor',
                    value: 7,
                    items: ['1', '2', '3'],
                },
            ],
            simple: [
                'disable dropdown 3',
                'Lorem',
                'ipsum',
                'dolor',
                'sit',
                'amet',
                'apple',
                'banana',
                'pear',
                'orange',
                'grape',
                'kiwi',
                'pineapple',
            ],
        };
    }
}
