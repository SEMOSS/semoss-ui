export default angular
    .module('docs.multiselect', [])
    .directive('multiselectSection', multiselectDirective);

function multiselectDirective() {
    multiselectLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./multiselect.directive.html'),
        link: multiselectLink,
    };

    function multiselectLink(scope) {
        scope.multiselect1 = {
            model: [],
            options: [
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
            change: function (opt) {
                console.log('changed', opt);
            },
            disabled: true,
        };
        scope.multiselect2 = {
            model: [],
            options: [
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
        };
    }
}
