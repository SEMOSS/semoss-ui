export default angular
    .module('smss-style.field', [])
    .directive('smssField', smssField);

import './smss-field.scss';

smssField.$inject = [];

function smssField() {
    smssFieldLink.$inject = ['scope', 'ele', 'attrs', 'ctrl', 'transclude'];

    return {
        restrict: 'E',
        template: require('./smss-field.directive.html'),
        replace: true,
        scope: {},
        transclude: {
            label: '?label',
            description: '?description',
            content: 'content',
        },
        terminal: true,
        link: smssFieldLink,
    };

    function smssFieldLink(scope, ele, attrs, ctrl, transclude) {
        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            if (attrs.hasOwnProperty('inline')) {
                scope.inline = !(attrs.inline === 'false');
            } else {
                scope.inline = false;
            }

            // for the label and description
            if (transclude.isSlotFilled('label')) {
                scope.label = true;

                transclude(
                    scope.$parent,
                    function (clone) {
                        if (clone.length) {
                            clone.addClass('smss-field__label');

                            ele.append(clone);

                            ele.on('focusin', function () {
                                clone.attr('focused', 'true');
                            });

                            ele.on('focusout', function () {
                                clone.removeAttr('focused');
                            });
                        }
                    },
                    null,
                    'label'
                );
            }

            transclude(
                scope.$parent,
                function (clone) {
                    if (clone.length) {
                        clone.addClass('smss-field__content');

                        ele.append(clone);
                    }
                },
                null,
                'content'
            );

            if (transclude.isSlotFilled('description')) {
                scope.description = true;

                transclude(
                    scope.$parent,
                    function (clone) {
                        if (clone.length) {
                            clone.addClass('smss-field__description');

                            ele.append(clone);
                        }
                    },
                    null,
                    'description'
                );
            }
        }

        initialize();
    }
}
