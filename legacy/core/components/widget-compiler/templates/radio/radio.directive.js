'use strict';

/**
 * @name radio.js
 * @desc radio button that will run a pkql
 */
export default angular
    .module('app.widget-compiler.radio', [])
    .directive('radio', radio);

radio.$inject = ['$compile'];

function radio($compile) {
    radioCtrl.$inject = [];
    radioLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        controller: radioCtrl,
        link: radioLink,
        require: [],
        bindToController: {
            handle: '=',
        },
        controllerAs: 'radioCtrl',
    };

    function radioCtrl() {}

    function radioLink(scope, ele, attrs) {
        scope.radioCtrl.onSelect = onSelect;

        function onSelect() {
            scope.radioCtrl.handle.updateOptions(
                scope.radioCtrl.handle.paramName,
                scope.radioCtrl.handle.model.defaultValue
            );

            if (
                scope.radioCtrl.handle.view &&
                scope.radioCtrl.handle.view.attributes &&
                scope.radioCtrl.handle.view.attributes.change === 'execute'
            ) {
                scope.radioCtrl.handle.executeQuery();
            }
        }

        function initialize() {
            var template = '<div ';
            if (
                scope.radioCtrl.handle.view &&
                scope.radioCtrl.handle.view.attributes &&
                scope.radioCtrl.handle.view.attributes.container
            ) {
                template +=
                    'class="' +
                    scope.radioCtrl.handle.view.attributes.container +
                    '"';
            }

            template += '>';
            template +=
                '<div ng-repeat="type in radioCtrl.handle.model.defaultOptions">';
            template +=
                '<smss-radio model="radioCtrl.handle.model.defaultValue" ';
            template += 'value="{{type}}" ';
            template += 'name="{{radioCtrl.handle.paramName}}" ';
            if (
                scope.radioCtrl.handle.view &&
                scope.radioCtrl.handle.view.attributes &&
                scope.radioCtrl.handle.view.attributes.readonly
            ) {
                template += 'ng-disabled="true" ';
            }
            template += 'change="radioCtrl.onSelect()"';
            template += '>';
            template += '{{type}}';
            template += '</smss-radio>';
            template += '</div>';
            template += '</div>';

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();
        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying radio');
        });
    }
}
