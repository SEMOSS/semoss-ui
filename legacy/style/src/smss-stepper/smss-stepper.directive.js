/**
 * @name smss-stepper.directive.js
 * @desc smss-stepper field
 */
export default angular
    .module('smss-style.stepper', [])
    .directive('smssStepper', smssStepperDirective)
    .directive('smssStepperItem', smssStepperItemDirective);

import './smss-stepper.scss';

smssStepperDirective.$inject = ['$timeout'];
smssStepperItemDirective.$inject = [];

function smssStepperDirective($timeout) {
    smssStepperCtrl.$inject = ['$element'];
    smssStepperLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: `
            <div class="smss-stepper">
                <div id="smss-stepper__steps" 
                    class="smss-stepper__steps">
                        <div class="smss-stepper__steps__step" 
                            ng-repeat="child in smssStepper.childScopes track by child.smssStepperItem.section"
                            ng-class="{'smss-stepper__steps__step--active': smssStepper.highlight === child.smssStepperItem.section}"
                            ng-click="smssStepper.navigate(child.smssStepperItem.section)">
                            <div class="smss-stepper__steps__step__tag"></div>
                            {{child.smssStepperItem.name}}
                        </div>
                </div>                
                <div id="smss-stepper__content" class="smss-stepper__content" ng-transclude>
                </div>   
            </div>
        `,
        scope: {},
        bindToController: {},
        transclude: true,
        replace: true,
        controllerAs: 'smssStepper',
        controller: smssStepperCtrl,
        link: smssStepperLink,
    };

    function smssStepperCtrl($element) {
        let contentEle, highlightTimeout;

        var smssStepper = this;

        smssStepper.highlight = '';
        smssStepper.childScopes = [];

        smssStepper.register = register;
        smssStepper.navigate = navigate;

        /**
         * @name register
         * @param {scope} childScope scope of the newly added stepper item
         * @desc registers the open item
         * @returns {void}
         */
        function register(childScope) {
            smssStepper.childScopes.push(childScope);

            // highlight the step
            updateHighlight();

            childScope.$on(
                '$destroy',
                function (section) {
                    // remove the scope
                    for (
                        let scopeIdx = smssStepper.childScopes.length - 1;
                        scopeIdx >= 0;
                        scopeIdx++
                    ) {
                        if (
                            smssStepper.childScopes[scopeIdx].smssStepperItem
                                .section === section
                        ) {
                            smssStepper.childScopes.splice(1);
                            break;
                        }
                    }

                    // highlight the step
                    updateHighlight();
                }.bind(null, childScope.smssStepperItem.section)
            );
        }

        /**
         * @name navigate
         * @param {string} section - section to scroll to
         * @desc navigate to a particular section
         * @returns {void}
         */
        function navigate(section) {
            if (!section) {
                return;
            }

            for (
                let scopeIdx = 0, scopeLen = smssStepper.childScopes.length;
                scopeIdx < scopeLen;
                scopeIdx++
            ) {
                const childScope = smssStepper.childScopes[scopeIdx];

                // find the highlight one
                if (childScope.smssStepperItem.section === section) {
                    const childEle = childScope.smssStepperItem.getElement();

                    // scroll it
                    contentEle.scrollLeft = childEle.offsetLeft;
                    break;
                }
            }
        }

        /** Content */
        /**
         * @name onContentScroll
         * @desc scroll the content
         * @returns {void}
         */
        function onContentScroll() {
            if (highlightTimeout) {
                $timeout.cancel(highlightTimeout);
            }

            highlightTimeout = $timeout(() => {
                updateHighlight();
            }, 100);
        }

        /**
         * @name updateHighlight
         * @desc update the highlight element in the view
         * @returns {void}
         */
        function updateHighlight() {
            const boundary =
                (contentEle.scrollLeft /
                    (contentEle.scrollWidth - contentEle.offsetWidth)) *
                contentEle.scrollWidth;

            // reset the highlight
            smssStepper.highlight = '';

            for (
                let scopeIdx = 0, scopeLen = smssStepper.childScopes.length;
                scopeIdx < scopeLen;
                scopeIdx++
            ) {
                const childScope = smssStepper.childScopes[scopeIdx],
                    childEle = childScope.smssStepperItem.getElement();

                // find the highlight one
                if (boundary <= childEle.offsetLeft + childEle.offsetWidth) {
                    smssStepper.highlight = childScope.smssStepperItem.section;
                    break;
                }
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            contentEle = $element[0].querySelector('#smss-stepper__content');

            // update the highlighted element
            updateHighlight();

            contentEle.addEventListener('scroll', onContentScroll);
        }

        initialize();
    }

    function smssStepperLink(scope) {
        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            scope.$on('smss-stepper--navigate', (event, section) => {
                scope.smssStepper.navigate(section);
            });
        }

        initialize();
    }
}

function smssStepperItemDirective() {
    smssStepperItemCtrl.$inject = [];
    smssStepperItemLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: `
        <div class="smss-stepper-item" ng-class="{'smss-stepper-item--disabled': smssStepperItem.disabled}" ng-transclude>
        </div>
        `,
        scope: {},
        bindToController: {
            name: '=',
            section: '@',
            disabled: '=?ngDisabled',
        },
        require: ['^smssStepper'],
        transclude: true,
        replace: true,
        controllerAs: 'smssStepperItem',
        controller: smssStepperItemCtrl,
        link: smssStepperItemLink,
    };

    function smssStepperItemCtrl() {}

    function smssStepperItemLink(scope, ele, attrs, ctrl) {
        scope.smssStepperCtrl = ctrl[0];

        scope.smssStepperItem.getElement = getElement;

        /**
         * @name getElement
         * @desc return the content element
         * @returns {HTMLElement} -
         */
        function getElement() {
            return ele[0];
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            // register with the parent
            scope.smssStepperCtrl.register(scope);
        }

        initialize();
    }
}
