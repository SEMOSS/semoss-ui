/**
 * @name smss-breadcrumb.directive.js
 * @desc smss-breadcrumb field
 */
export default angular
    .module('smss-style.breadcrumb', [])
    .directive('smssBreadcrumb', smssBreadcrumbDirective)
    .directive('smssBreadcrumbItem', smssBreadcrumbItemDirective);

import './smss-breadcrumb.scss';

smssBreadcrumbDirective.$inject = [];
smssBreadcrumbItemDirective.$inject = [];

function smssBreadcrumbDirective() {
    smssBreadcrumbController.$inject = [];
    smssBreadcrumbLink.$inject = [];

    return {
        restrict: 'E',
        template: '<div class="smss-breadcrumb" ng-transclude></div>',
        scope: {},
        bindToController: {},
        transclude: true,
        replace: true,
        controllerAs: 'smssBreadcrumb',
        controller: smssBreadcrumbController,
        link: smssBreadcrumbLink,
    };

    function smssBreadcrumbController() {
        var smssBreadcrumb = this;

        smssBreadcrumb.childScopes = [];

        smssBreadcrumb.register = register;

        /**
         * @name register
         * @param {scope} childScope scope of the newly added accordion item
         * @desc registers the open item
         * @returns {void}
         */
        function register(childScope) {
            smssBreadcrumb.childScopes.push(childScope);

            childScope.$on(
                '$destroy',
                function (id) {
                    var i,
                        len,
                        idx = -1;

                    for (
                        i = 0, len = smssBreadcrumb.childScopes.length;
                        i < len;
                        i++
                    ) {
                        if (smssBreadcrumb.childScopes[i].$id === id) {
                            idx = i;
                            break;
                        }
                    }

                    if (idx > -1) {
                        smssBreadcrumb.childScopes.splice(idx, 1);
                    }
                }.bind(null, childScope.$id)
            );
        }
    }

    function smssBreadcrumbLink() {
        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {}

        initialize();
    }
}

function smssBreadcrumbItemDirective() {
    smssBreadcrumbItemLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: `<div class="smss-breadcrumb-item" ng-class="{'smss-breadcrumb-item--disabled': disabled}" tabindex="{{disabled ? '-1' : '0'}}">
                       <div ng-transclude></div>
                   </div>`,
        scope: {
            disabled: '=?ngDisabled',
        },
        require: '^smssBreadcrumb',
        transclude: true,
        replace: true,
        link: smssBreadcrumbItemLink,
    };

    function smssBreadcrumbItemLink(scope, ele, attrs, ctrl) {
        scope.smssBreadcrumb = ctrl;

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            scope.smssBreadcrumb.register(scope);
        }

        initialize();
    }
}
