'use strict';

/**
 * @name datePickerDirective
 * @desc date picker
 * @returns {void}
 */
export default angular
    .module('app.widget-compiler.date-picker', [])
    .directive('datePicker', datePickerDirective);

datePickerDirective.$inject = ['$q', '$compile'];

function datePickerDirective($q, $compile) {
    datePickerLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        link: datePickerLink,
        require: [],
        scope: {
            handle: '=',
        },
    };

    function datePickerLink(scope, ele, attrs, ctrl) {
        scope.onSelect = onSelect;

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
         * @name initialize
         * @desc initialize the directive
         * @returns {void}
         */
        function initialize() {
            var template = `
<div class="${
                scope.handle.view.attributes &&
                scope.handle.view.attributes.container
                    ? scope.handle.view.attributes.container
                    : ''
            }">
    <smss-date-picker 
        model="handle.model.defaultValue"
        change="onSelect(model) "
        ${
            scope.handle.view.attributes &&
            typeof scope.handle.view.attributes.format !== 'undefined'
                ? `format="'${scope.handle.view.attributes.format}'" `
                : ''
        }
        ${
            scope.handle.view.attributes &&
            typeof scope.handle.view.attributes.readonly !== 'undefined'
                ? 'ng-disabled="true"'
                : ''
        }  
        >
    </smss-date-picker>
</div>
`;

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying date-picker');
        });
    }
}
