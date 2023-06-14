'use strict';

/**
 * @name checkbox.js
 * @desc checkbox list
 */
export default angular
    .module('app.widget-compiler.check-box', [])
    .directive('checkbox', checkboxDirective);

checkboxDirective.$inject = ['$q', '$timeout', '$compile'];

function checkboxDirective($q, $timeout, $compile) {
    checkboxLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        link: checkboxLink,
        require: [],
        scope: {
            handle: '=',
        },
    };

    function checkboxLink(scope, ele, attrs) {
        scope.busyLoading = false;

        scope.onSelect = onSelect;
        /**
         * @name onSelect
         * @param {object} model the model
         * @param {object} delta the delta of the select
         * @desc upon change of selection, this function will be called
         * @returns {void}
         */
        function onSelect() {
            if (scope.handle.updateOptions) {
                scope.handle.updateOptions(
                    scope.handle.paramName,
                    scope.handle.model.defaultValue
                );
            }
            if (
                scope.handle.view &&
                scope.handle.view.attributes &&
                scope.handle.view.attributes.change === 'execute'
            ) {
                scope.handle.executeQuery();
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var template = '';

            // TODO: Why is this the case?
            $timeout(function () {});

            // create the template
            template += '<smss-checkbox';
            template += ' model="handle.model.defaultValue"';

            if (scope.handle.view.attributes) {
                if (scope.handle.view.attributes.name) {
                    template +=
                        ' name="' + scope.handle.view.attributes.name + '"';
                }

                if (scope.handle.view.attributes.change) {
                    template += ' change="onSelect(model, delta)" ';
                }

                if (scope.handle.view.attributes.readonly) {
                    template += ' ng-disabled="true"';
                }
            }

            template += '>';

            if (
                scope.handle.view.attributes &&
                scope.handle.view.attributes.label
            ) {
                template += scope.handle.view.attributes.label;
            }

            template += '</smss-checkbox>';

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying checklist');
        });
    }
}
