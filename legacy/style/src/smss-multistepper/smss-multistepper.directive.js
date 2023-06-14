/**
 * @name smss-multistepper.directive.js
 * @desc smss-multistepper field
 */
export default angular
    .module('smss-style.multistepper', [])
    .directive('smssMultistepper', smssMultistepperDirective)
    .directive('smssMultistepperItem', smssMultistepperItemDirective);

import './smss-multistepper.scss';

smssMultistepperDirective.$inject = [];
smssMultistepperItemDirective.$inject = [];

function smssMultistepperDirective() {
    smssMultistepperController.$inject = [];
    smssMultistepperLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template:
            '<div class="smss-multistepper" ng-class="{\'smss-multistepper--vertical\': smssMultistepper.vertical, \'smss-multistepper--compact\': smssMultistepper.compact}" ng-transclude></div>',
        scope: {},
        bindToController: {},
        transclude: true,
        replace: true,
        controllerAs: 'smssMultistepper',
        controller: smssMultistepperController,
        link: smssMultistepperLink,
    };

    function smssMultistepperController() {
        var smssMultistepper = this;

        smssMultistepper.childScopes = [];

        smssMultistepper.register = register;

        /**
         * @name register
         * @param {scope} childScope scope of the newly added multistepper item
         * @desc registers the open item
         * @returns {void}
         */
        function register(childScope) {
            smssMultistepper.childScopes.push(childScope);
            childScope.step = smssMultistepper.childScopes.length;

            childScope.$on(
                '$destroy',
                function (id) {
                    var i,
                        len,
                        idx = -1;

                    for (
                        i = 0, len = smssMultistepper.childScopes.length;
                        i < len;
                        i++
                    ) {
                        if (smssMultistepper.childScopes[i].$id === id) {
                            idx = i;
                            break;
                        }
                    }

                    if (idx > -1) {
                        smssMultistepper.childScopes.splice(idx, 1);
                    }
                }.bind(null, childScope.$id)
            );
        }
    }

    function smssMultistepperLink(scope, ele, attrs) {
        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            if (attrs.hasOwnProperty('vertical')) {
                scope.smssMultistepper.vertical = true;
            }
            if (attrs.hasOwnProperty('compact')) {
                scope.smssMultistepper.compact = true;
            }
        }

        initialize();
    }
}

function smssMultistepperItemDirective() {
    smssMultistepperItemLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: `<div class="smss-multistepper-item" tabindex="{{disabled ? '-1' : '0'}}"
                        ng-class="{'smss-multistepper-item--active': state === 'active', 'smss-multistepper-item--completed': state === 'completed',
                                   'smss-multistepper-item--error': state === 'error', 'smss-multistepper-item--optional': state === 'optional'}">
                        <div class="smss-multistepper-item__content">
                            <div class="smss-multistepper-item__number">
                                    <i ng-if="state === 'completed'" class="fa fa-check"></i>
                                    <i ng-if="state === 'error'" class="fa fa-exclamation"></i>
                                    <span ng-if="state !== 'completed' && state !== 'error'">{{step}}</span>
                            </div>
                            <div ng-transclude></div>
                        </div>
                        <div class="smss-multistepper-item__divider"></div>
                   </div>`,
        scope: {
            disabled: '=?ngDisabled',
            state: '=',
            step: '=?',
        },
        require: '^smssMultistepper',
        transclude: true,
        replace: true,
        link: smssMultistepperItemLink,
    };

    function smssMultistepperItemLink(scope, ele, attrs, ctrl) {
        scope.smssMultistepper = ctrl;

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            if (
                scope.state !== 'default' &&
                scope.state !== 'active' &&
                scope.state !== 'completed' &&
                scope.state !== 'error' &&
                scope.state !== 'optional'
            ) {
                // TODO: should we emit some kind of warning/error here?
                scope.state = 'default';
            }
            scope.smssMultistepper.register(scope);
        }

        initialize();
    }
}
