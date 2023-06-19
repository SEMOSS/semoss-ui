export default angular
    .module('docs.color', [])
    .directive('colorSection', colorDirective);

import './color.scss';

function colorDirective() {
    colorLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./color.directive.html'),
        replace: true,
        link: colorLink,
    };

    function colorLink(scope) {
        scope.groups = [
            {
                title: 'Core',
                colors: [
                    {
                        name: 'primary, highlight',
                        code: '#40A0FF',
                    },
                    {
                        name: 'nav, text',
                        code: '#5C5C5C',
                    },
                ],
            },
            {
                title: 'Greys',
                colors: [
                    {
                        name: 'action, background',
                        code: '#F6F6F6',
                    },
                    {
                        name: 'disabled, border, scroll-thumb',
                        code: '#EFEFEF', // TODO: is this right?
                    },
                    {
                        name: 'action-dark',
                        code: '#E4E5E7',
                    },
                    {
                        name: 'label, description',
                        code: '#5C5C5C',
                    },
                    {
                        name: 'title',
                        code: '#1E1E1E',
                    },
                ],
            },
            {
                title: 'Status',
                colors: [
                    {
                        name: 'success',
                        code: '#2E7D32',
                    },
                    {
                        name: 'warn',
                        code: '#F9A825',
                    },
                    {
                        name: 'error',
                        code: '#BA2828',
                    },
                ],
            },
        ];
    }
}
