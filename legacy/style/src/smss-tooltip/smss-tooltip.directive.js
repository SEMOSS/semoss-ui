export default angular
    .module('smss-style.tooltip', [])
    .directive('smssTooltip', smssTooltipDirective);

import './smss-tooltip.scss';

import { Popover } from '../utility/popover.js';

smssTooltipDirective.$inject = ['$compile'];

function smssTooltipDirective($compile) {
    smssTooltipLink.$inject = ['scope', 'ele', 'attrs'];
    return {
        restrict: 'A',
        link: smssTooltipLink,
        // terminal: true
    };

    function smssTooltipLink(scope, ele, attrs) {
        let tooltipEle, childScope, popover;

        /** Tooltip **/
        /**
         * Render the tooltip
         * @returns {void}
         */
        function renderTooltip() {
            // create the element
            tooltipEle = document.createElement('div');
            tooltipEle.className = 'smss-tooltip';

            // create a new instance
            popover = new Popover(ele[0], tooltipEle, {
                type: 'hover',
                spacing: 4,
            });
        }

        /**
         * Update the tooltip
         * @returns {void}
         */
        function updateTooltip() {
            // grab the values
            const html = attrs.smssTooltip;

            if (childScope) {
                childScope.$destroy();
            }
            // create a scope
            childScope = scope.$new();

            // add it to the ele
            tooltipEle.innerHTML = html;

            // compile it
            $compile(angular.element(tooltipEle).contents())(childScope);
        }

        /**
         * @name initialize
         * @desc Called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            renderTooltip();

            //watch the tooltip
            attrs.$observe('smssTooltip', function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    updateTooltip();
                }
            });

            // destroy it
            scope.$on('$destroy', function () {
                // destroy the popover
                if (popover) {
                    popover.destroy();
                }
            });
        }

        initialize();
    }
}
