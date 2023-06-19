export default angular
    .module('docs.block', [])
    .directive('block', blockDirective);

import './block.scss';

blockDirective.$inject = ['$compile'];

function blockDirective() {
    blockLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        template: require('./block.directive.html'),
        scope: {
            component: '=',
        },
        link: blockLink,
        replace: true,
    };

    function blockLink(scope) {
        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var directive = '',
                rulesDirective = '';
            // create the html
            directive = scope.component.directive
                .match(
                    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
                )
                .map((x) => x.toLowerCase())
                .join('-');
            scope.directiveHTML = `<${directive}><${directive}/>`;

            if (scope.component.rulesDirective) {
                rulesDirective = scope.component.rulesDirective
                    .match(
                        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
                    )
                    .map((x) => x.toLowerCase())
                    .join('-');
                scope.directiveRules = `<${rulesDirective}><${rulesDirective}/>`;
            }
        }

        initialize();
    }
}
