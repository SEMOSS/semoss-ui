'use strict';

/**
 * @name multiselectDirective
 * @desc multiselect list
 * @returns {void}
 */
export default angular
    .module('app.widget-compiler.multiselect', [])
    .directive('multiselect', multiselectDirective);

multiselectDirective.$inject = ['$q', '$compile'];

function multiselectDirective($q, $compile) {
    multiselectLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        link: multiselectLink,
        require: [],
        scope: {
            handle: '=',
        },
    };

    function multiselectLink(scope, ele, attrs, ctrl) {
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
            template += '<smss-multiselect';
            template += ' model="handle.model.defaultValue" ';
            template += ' options="handle.model.defaultOptions" ';
            template += ' change="onSelect(model)" ';
            if (scope.handle.view.attributes) {
                if (scope.handle.view.attributes.quickselect) {
                    template += ' quickselect ';
                }
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
            }

            template += ' loading="busyLoading" ';
            if (scope.handle.model.searchParam) {
                template += ' search="searchInstances(search)"';
            }
            if (scope.handle.model.infiniteQuery) {
                template += ' scroll="getMoreInstances()"';
            }
            template += '>';
            template += '</smss-multiselect>';
            template += '</div>';

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying multiselect');
        });
    }
}
