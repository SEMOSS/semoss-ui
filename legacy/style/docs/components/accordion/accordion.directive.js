export default angular
    .module('docs.accordion', [])
    .directive('accordionSection', accordionDirective);

function accordionDirective() {
    accordionLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./accordion.directive.html'),
        replace: true,
        link: accordionLink,
    };
    function accordionLink(scope) {
        scope.accordion1 = [
            {
                name: 'Accordion Title 1',
                content: 'Content 1 with initial height of 20%',
                height: 20,
            },
            {
                name: 'Accordion Title 2',
                content: 'Content 2 with initial height of 80%',
                height: 80,
            },
            {
                name: 'Disabled Accordion Title 3',
                content: 'Content 3',
                disabled: true,
            },
        ];

        scope.accordion2 = [
            {
                name: 'Rotated Accordion Title 1',
                content: 'Content 1 with initial width of 20%',
                height: 20,
            },
            {
                name: 'Rotated Accordion Title 2',
                content: 'Content 2 with initial width of 80%',
                height: 80,
            },
            {
                name: 'Disabled Rotated Accordion Title3',
                content: 'Content 3',
                disabled: true,
            },
        ];
    }
}
