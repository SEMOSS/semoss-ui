'use strict';

/**
 * @name checklist.js
 * @desc checklist list
 */
export default angular
    .module('app.widget-compiler.checklist', [])
    .directive('checklist', checklistDirective);

checklistDirective.$inject = ['$q', '$timeout', '$compile'];

function checklistDirective($q, $timeout, $compile) {
    checklistLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        link: checklistLink,
        require: [],
        scope: {
            handle: '=',
        },
    };

    function checklistLink(scope, ele, attrs) {
        scope.busyLoading = false;

        scope.onSelect = onSelect;
        scope.searchInstances = searchInstances;
        scope.getMoreInstances = getMoreInstances;

        /**
         * @name onSelect
         * @param {object} model the model
         * @param {object} delta the delta of the select
         * @desc upon change of selection, this function will be called
         * @returns {void}
         */
        function onSelect(model, delta) {
            if (delta.type === 'all') {
                scope.handle.selectAll = true;
            } else if (delta.type === 'none') {
                scope.handle.selectAll = false;
            }

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
         * @name getMoreInstances
         * @desc change the offset and replace in the pkqlcommand and then run the call to get the next set of values
         * @returns {void}
         */
        function getMoreInstances() {
            scope.busyLoading = true;
            $q.when(scope.handle.getMoreInstances()).then(function () {
                scope.busyLoading = false;
            });
        }

        /**
         * @name searchInstances
         * @param {string} search - string containing the search term
         * @desc run query to search for instances based on search term
         * @returns {void}
         */
        function searchInstances(search) {
            scope.busyLoading = true;
            $q.when(scope.handle.searchInstances(search)).then(function () {
                scope.busyLoading = false;
            });
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
            template += '<div';
            if (
                scope.handle.view.attributes &&
                scope.handle.view.attributes.container
            ) {
                template +=
                    ' class="' + scope.handle.view.attributes.container + '" ';
            }
            template += '>';
            template += '<div';
            // if (scope.handle.view.attributes && scope.handle.view.attributes.container) {
            //     template += ' class=\"' + scope.handle.view.attributes.searchAttr + '\" ';
            // }
            template += '>';
            template += '<smss-checklist';
            template += ' style="height:200px"';
            template += ' model="handle.model.defaultValue"';
            template += ' options="handle.model.defaultOptions"';
            template += ' change="onSelect(model, delta)"';
            if (scope.handle.model.infiniteQuery) {
                template += ' scroll="getMoreInstances()"';
            }

            if (scope.handle.model.searchParam) {
                template += ' search="searchInstances(search)"';
            }

            template += ' loading="busyLoading" ';
            if (scope.handle.view.attributes) {
                if (scope.handle.view.attributes.value) {
                    template +=
                        ' value="' + scope.handle.view.attributes.value + '" ';
                }
                if (scope.handle.view.attributes.display) {
                    template +=
                        ' display="' +
                        scope.handle.view.attributes.display +
                        '" ';
                }
                if (scope.handle.view.attributes.filter) {
                    template +=
                        ' filter="' +
                        scope.handle.view.attributes.filter +
                        '" ';
                }
                if (scope.handle.view.attributes.multiple) {
                    template += ' multiple ';
                }
                if (scope.handle.view.attributes.searchable) {
                    template += ' searchable ';
                }
                if (scope.handle.view.attributes.quickselect) {
                    template += ' quickselect ';
                }
                if (scope.handle.view.attributes.readonly) {
                    template += ' ng-disabled="true" ';
                }
            }
            template += '>';
            template += '</smss-checklist>';
            template += '</div>';

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
