'use strict';

/**
 * @name typeahead.directive
 * @desc typeahead button that will run a query
 */
export default angular
    .module('app.widget-compiler.typeahead', [])
    .directive('typeahead', typeahead);

typeahead.$inject = ['$compile', '$q'];

function typeahead($compile, $q) {
    typeaheadLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        link: typeaheadLink,
        require: [],
        scope: {
            handle: '=',
        },
    };

    function typeaheadLink(scope, ele, attrs) {
        scope.onSelect = onSelect;
        scope.searchInstances = searchInstances;
        scope.getMoreInstances = getMoreInstances;

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
            template += '<smss-typeahead';
            template += ' model="handle.model.defaultValue" ';
            template += ' options="handle.model.defaultOptions" ';
            template += ' change="onSelect(model)" ';
            template += ' loading="busyLoading" ';
            if (scope.handle.model.searchParam) {
                template += ' search="searchInstances(search)"';
            }

            if (scope.handle.view.attributes) {
                if (scope.handle.view.attributes.display) {
                    template +=
                        ' display="' +
                        scope.handle.view.attributes.display +
                        '"';
                }
                if (scope.handle.view.attributes.readonly) {
                    template += ' ng-disabled="true"';
                }
                if (scope.handle.view.attributes.placeholder) {
                    template +=
                        ' placeholder="\'' +
                        scope.handle.view.attributes.placeholder +
                        '\'"';
                }
                if (scope.handle.view.attributes.minlength) {
                    template +=
                        ' minlength="' +
                        scope.handle.view.attributes.minlength +
                        '" ';
                }
                if (scope.handle.view.attributes.maxlength) {
                    template +=
                        ' maxlength="' +
                        scope.handle.view.attributes.maxlength +
                        '" ';
                }
            }
            if (scope.handle.model.infiniteQuery) {
                template += ' scroll="getMoreInstances()"';
            }
            template += '>';
            template += '</smss-typeahead>';
            template += '</div>';

            // var template = '';
            // template += '<div';
            // if (scope.handle.view.attributes.container) {
            //     template += ' class=\"' + scope.handle.view.attributes.container + '\" ';
            // }
            // template += '>';
            // template += '<smss-typeahead';
            // template += ' model="handle.model.defaultValue" ';
            // template += ' options="handle.model.defaultOptions" ';
            // template += ' change="inputChange()" ';
            // if (scope.handle.view.attributes.minLength) {
            //     template += ' min-length=\"' + scope.handle.view.attributes.minLength + '\" ';
            // }

            // if (scope.handle.view.attributes.display) {
            //     template += ' display=\"\'' + scope.handle.view.attributes.display + '\'\"';
            // }
            // if (scope.handle.view.attributes.which) {
            //     template += ' which=\"' + scope.handle.view.attributes.which + '\"';
            // }
            // template += '><\/smss-typeahead><\div>';

            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();
        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying typeahead');
        });
    }
}
