'use strict';

import angular from 'angular';
import './dashboard-button.scss';
import './dashboard-button-dimensions/dashboard-button-dimensions.directive';
import { EVENT_TYPE, FILE_TYPE } from './types';

export default angular
    .module('app.dashboard-button.directive', [
        'app.dashboard-button.dashboard-button-dimensions',
    ])
    .directive('dashboardButton', dashboardButtonDirective);

dashboardButtonDirective.$inject = ['semossCoreService', '$location'];

function dashboardButtonDirective(
    semossCoreService: SemossCoreService,
    $location
) {
    dashboardButtonLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight', '^widget'],
        controllerAs: 'dashboardButton',
        bindToController: {},
        template: require('./dashboard-button.directive.html'),
        controller: dashboardButtonCtrl,
        link: dashboardButtonLink,
    };

    function dashboardButtonCtrl() {}

    function dashboardButtonLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        scope.dashboardButton.options = {};
        scope.dashboardButton.event = undefined;

        /**
         * @name buildButton
         * @desc creates the html for the button
         */
        function buildButton(): string {
            scope.dashboardButton.event = function () {
                scope.insightCtrl.emit('execute-pixel', {
                    insightID: scope.insightCtrl.insightID,
                    commandList: [
                        {
                            type: 'Pixel',
                            components: [
                                scope.dashboardButton.options.eventScript,
                            ],
                            terminal: true,
                        },
                    ],
                });
            };
            let border = '',
                height = '',
                lineHeight = '',
                width = '',
                fontSize = '';

            // Build the full css value
            if (scope.dashboardButton.options.style.border.style === 'none') {
                border = 'none';
            } else {
                border =
                    scope.dashboardButton.options.style.border.width.size +
                    scope.dashboardButton.options.style.border.width.unit +
                    ' ' +
                    scope.dashboardButton.options.style.border.style +
                    ' ' +
                    scope.dashboardButton.options.style.border.color;
            }
            if (
                scope.dashboardButton.options.style.height.size &&
                scope.dashboardButton.options.style.height.unit
            ) {
                height =
                    scope.dashboardButton.options.style.height.size +
                    scope.dashboardButton.options.style.height.unit;
                lineHeight = height;
                if (
                    scope.dashboardButton.options.style.border.width.size &&
                    scope.dashboardButton.options.style.border.width.unit
                ) {
                    const borderSize =
                        scope.dashboardButton.options.style.border.width.size +
                        scope.dashboardButton.options.style.border.width.unit;
                    lineHeight = `calc(${height} - 2*${borderSize})`;
                }
            }
            if (
                scope.dashboardButton.options.style.width.size &&
                scope.dashboardButton.options.style.width.unit
            ) {
                width =
                    scope.dashboardButton.options.style.width.size +
                    scope.dashboardButton.options.style.width.unit;
            }
            if (
                scope.dashboardButton.options.style.fontSize.size &&
                scope.dashboardButton.options.style.fontSize.unit
            ) {
                fontSize =
                    scope.dashboardButton.options.style.fontSize.size +
                    scope.dashboardButton.options.style.fontSize.unit;
            }

            // Set the button style
            const style = `style="
                ${
                    scope.dashboardButton.options.style.background.length
                        ? 'background: ' +
                          scope.dashboardButton.options.style.background +
                          ';'
                        : ''
                }
                ${
                    scope.dashboardButton.options.style.color.length
                        ? 'color: ' +
                          scope.dashboardButton.options.style.color +
                          ';'
                        : ''
                }
                ${border.length ? 'border: ' + border + ';' : ''}
                ${height.length ? 'height: ' + height + ';' : ''}
                ${lineHeight.length ? 'line-height: ' + lineHeight + ';' : ''}
                ${width.length ? 'width: ' + width + ';' : ''}
                ${fontSize.length ? 'font-size: ' + fontSize + ';' : ''}
            "`;

            return `
            <smss-btn ng-click="dashboardButton.event()" ${style}>
                {{dashboardButton.options.label}}
            </smss-btn>
            `;
        }

        /**
         * @name resetButton
         * @desc called to rebuild the button
         */
        function resetButton(): void {
            scope.dashboardButton.options =
                scope.widgetCtrl.getWidget('view.dashboard-button.options') ||
                {};
            scope.dashboardButton.html = buildButton();
        }

        /**
         * @name initialize
         * @desc
         */
        function initialize(): void {
            resetButton();

            const updateViewListener = scope.insightCtrl.on(
                'update-view',
                resetButton
            );
            scope.$on('$destroy', () => {
                updateViewListener();
            });
        }

        initialize();
    }
}
