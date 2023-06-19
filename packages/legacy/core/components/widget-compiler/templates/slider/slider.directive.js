'use strict';

/**
 * @name slider.js
 * @desc slider button that will run a query
 */
export default angular
    .module('app.widget-compiler.slider', [])
    .directive('slider', sliderDirective);

sliderDirective.$inject = ['$compile'];

function sliderDirective($compile) {
    sliderLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        link: sliderLink,
        require: [],
        scope: {
            handle: '=',
        },
    };

    function sliderLink(scope, ele, attrs, ctrl) {
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
            var type =
                    scope.handle.view.attributes &&
                    scope.handle.view.attributes.type !== 'undefined'
                        ? scope.handle.view.attributes.type
                        : 'numerical',
                template = `
            <div class="${
                scope.handle.view.attributes &&
                scope.handle.view.attributes.container
                    ? scope.handle.view.attributes.container
                    : ''
            }">
                <smss-slider 
                    model="handle.model.defaultValue"
                    change="onSelect(model)"
                    ${
                        scope.handle.view.attributes &&
                        scope.handle.view.attributes.readonly
                            ? 'ng-disabled="true"'
                            : ''
                    }
                    ${
                        type === 'categorical'
                            ? 'options="handle.model.defaultOptions"'
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        typeof scope.handle.view.attributes.display !==
                            'undefined' &&
                        type === 'categorical'
                            ? 'display="' +
                              scope.handle.view.attributes.display +
                              '"'
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        typeof scope.handle.view.attributes.value !==
                            'undefined' &&
                        type === 'categorical'
                            ? 'value="' +
                              scope.handle.view.attributes.value +
                              '"'
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        typeof scope.handle.view.attributes.min !==
                            'undefined' &&
                        type === 'numerical'
                            ? 'min="' + scope.handle.view.attributes.min + '"'
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        typeof scope.handle.view.attributes.max !==
                            'undefined' &&
                        type === 'numerical'
                            ? 'max="' + scope.handle.view.attributes.max + '"'
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        typeof scope.handle.view.attributes.sensitivity !==
                            'undefined' &&
                        type === 'numerical'
                            ? 'sensitivity="' +
                              scope.handle.view.attributes.sensitivity +
                              '"'
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        typeof scope.handle.view.attributes.start !==
                            'undefined' &&
                        type === 'date'
                            ? 'start="' +
                              scope.handle.view.attributes.start +
                              '"'
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        typeof scope.handle.view.attributes.end !==
                            'undefined' &&
                        type === 'date'
                            ? 'end="' + scope.handle.view.attributes.end + '"'
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        typeof scope.handle.view.attributes.format !==
                            'undefined' &&
                        type === 'date'
                            ? `format="'${scope.handle.view.attributes.format}'"`
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        scope.handle.view.attributes.multiple
                            ? 'multiple'
                            : ''
                    }
                    ${
                        scope.handle.view.attributes &&
                        scope.handle.view.attributes.invert
                            ? 'invert'
                            : ''
                    }
                    ${type}
                    >
                </smss-slider>
            </div>
            `;

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying slider-picker');
        });
    }
}
