'use strict';

/**
 * @name dropdownDirective
 * @desc dropdown list
 * @returns {void}
 */
export default angular
    .module('app.widget-compiler.dropdown', [])
    .directive('dropdown', dropdownDirective);

dropdownDirective.$inject = ['$q', '$compile'];

function dropdownDirective($q, $compile) {
    dropdownLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        link: dropdownLink,
        require: [],
        scope: {
            handle: '=',
        },
    };

    function dropdownLink(scope, ele, attrs, ctrl) {
        scope.onSelect = onSelect;
        scope.getMoreInstances = getMoreInstances;
        scope.searchInstances = searchInstances;

        /**
         * @name onSelect
         * @desc upon change of selection, this function will be called
         * @returns {void}
         */
        function onSelect() {
            scope.handle.updateOptions(
                scope.handle.paramName,
                scope.handle.model.defaultValue
            );
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
         * @desc infinite scroll to get more instancesf
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
         * @desc initialize the directive
         * @returns {void}
         */
        function initialize() {
            var template = '';
            template += '<div';

            if (
                scope.handle.view.attributes &&
                scope.handle.view.attributes.container
            ) {
                template +=
                    ' class="' + scope.handle.view.attributes.container + '" ';
            }
            template += '>';
            template += '<smss-dropdown';
            template += ' model="handle.model.defaultValue" ';
            template += ' options="handle.model.defaultOptions" ';
            template += ' change="onSelect(model)" ';
            if (scope.handle.view.attributes) {
                if (scope.handle.view.attributes.value) {
                    template +=
                        ' value="' + scope.handle.view.attributes.value + '"';
                }
                if (scope.handle.view.attributes.display) {
                    template +=
                        ' display="' +
                        scope.handle.view.attributes.display +
                        '"';
                }
                if (scope.handle.view.attributes.filter) {
                    template +=
                        ' filter="' + scope.handle.view.attributes.filter + '"';
                }
                if (scope.handle.view.attributes.readonly) {
                    template += ' ng-disabled="true"';
                }
                if (scope.handle.view.attributes.placeholder) {
                    template +=
                        ' placeholder="' +
                        scope.handle.view.attributes.placeholder +
                        '"';
                }
            }

            template += ' loading="busyLoading" ';
            if (scope.handle.model.searchParam) {
                template += ' search="searchInstances(search)"';
            }
            if (scope.handle.model.infiniteQuery) {
                template += ' scroll="getMoreInstances()"';
            }
            template += '>';
            template += '</smss-dropdown>';
            template += '</div>';

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying dropdown');
        });
    }
}
