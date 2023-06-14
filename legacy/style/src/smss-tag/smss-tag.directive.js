export default angular
    .module('smss-style.tag', [])
    .directive('smssTag', smssTagDirective);
import './smss-tag.scss';
function smssTagDirective() {
    smssTagLink.$inject = ['scope', 'ele', 'attrs'];
    return {
        restrict: 'E',
        template: `
        <div class="smss-tag" ng-click="smssTag.onClick($event);$event.stopPropagation();" tabindex="{{disabled ? -1 : 0}}"
            ng-keyup="smssTag.onKeyup($event)"
            title={{label}}>
            <span class="smss-tag__label">{{label}}</span>
            <i ng-show="smssTag.showClose" class="fa fa-times" ng-click="smssTag.closeTag($event);$event.stopPropagation();" tabindex="{{disabled ? -1 : 0}}"></i>
        </div>
        `,
        replace: true,
        scope: {
            label: '=',
            onClose: '&?',
            click: '&?',
            disabled: '=?ngDisabled',
        },
        link: smssTagLink,
    };
    function smssTagLink(scope, ele, attrs) {
        scope.smssTag = {};
        scope.smssTag.closeTag = closeTag;
        scope.smssTag.onKeyup = onKeyup;
        scope.smssTag.onClick = onClick;
        scope.smssTag.showClose = false;

        /**
         * @name closeTag
         * @desc called when the tag is closed
         * @param {event} ev - the event
         * @returns {void}
         */
        function closeTag(ev) {
            if (scope.onClose && scope.smssTag.showClose) {
                scope.onClose(ev);
            }
        }

        /**
         * @name onClick
         * @desc called on click event
         * @param {event} ev - the event
         * @returns {void}
         */
        function onClick(ev) {
            if (scope.click) {
                scope.click(ev);
            }
        }

        /**
         * @name onKeyup
         * @desc called on keyup event
         * @param {event} ev - the event
         * @returns {void}
         */
        function onKeyup(ev) {
            if (ev.keyCode === 13) {
                // enter
                closeTag(ev);
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            if (attrs.hasOwnProperty('showClose')) {
                if (attrs.showClose === 'true') {
                    scope.smssTag.showClose = true;
                } else {
                    scope.smssTag.showClose = false;
                }
            }
        }

        initialize();
    }
}
