'use strict';

/**
 * @name color-picker.js
 * @desc color-picker button that will run a pkql
 */
export default angular
    .module('app.widget-compiler.color-picker', [])
    .directive('colorPicker', colorpicker);

colorpicker.$inject = ['$compile'];

function colorpicker($compile) {
    colorpickerLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        link: colorpickerLink,
        require: [],
        scope: {
            handle: '=',
        },
        controllerAs: 'colorpickerCtrl',
    };

    function colorpickerLink(scope, ele, attrs, ctrl) {
        function initialize() {
            var template = '<div>';
            template += '<smss-color-picker model="handle.model.defaultValue"';
            if (scope.handle.view.attributes) {
                if (scope.handle.view.attributes.readonly) {
                    template += ' ng-disabled="true"';
                }
            }
            template += '>';
            template += '</smss-color-picker>';
            template += '</div>';

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();
        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying colorpicker');
        });
    }
}
