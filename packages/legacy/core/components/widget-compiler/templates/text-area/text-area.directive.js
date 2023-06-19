'use strict';

/**
 * @name text-area.js
 * @desc text-area button that will run a pkql
 */
export default angular
    .module('app.widget-compiler.text-area', [])
    .directive('textArea', textarea);

textarea.$inject = ['$compile'];

function textarea($compile) {
    textareaLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        link: textareaLink,
        require: [],
        scope: {
            handle: '=',
        },
        controllerAs: 'textareaCtrl',
    };

    function textareaLink(scope, ele, attrs, ctrl) {
        function initialize() {
            var template = '<div';

            if (
                scope.handle.view.attributes &&
                scope.handle.view.attributes.container
            ) {
                template +=
                    ' class="' + scope.handle.view.attributes.container + '" ';
            }
            template += '>';
            template += '<smss-textarea';
            template += ' ng-model="handle.model.defaultValue" ';
            if (scope.handle.view.attributes) {
                if (scope.handle.view.attributes.resize) {
                    template +=
                        'style="resize: ' +
                        scope.handle.view.attributes.resize +
                        '"';
                }
                if (scope.handle.view.attributes.readonly) {
                    template += 'ng-disabled="true"';
                }
                if (scope.handle.view.attributes.placeholder) {
                    template +=
                        'placeholder="' +
                        scope.handle.view.attributes.placeholder +
                        '"';
                }
                if (scope.handle.view.attributes.maxlength) {
                    template +=
                        'maxlength="' +
                        scope.handle.view.attributes.maxlength +
                        '"';
                }
            }
            template += '>';
            template += '</smss-textarea>';
            template += '</div>';

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();
        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying textarea');
        });
    }
}
