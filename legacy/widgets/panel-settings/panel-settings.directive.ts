'use strict';

import angular from 'angular';

import './panel-settings.scss';

import { PANEL_TYPES, PANEL_OPTIONS } from '../../core/constants.js';

export default angular
    .module('app.panel-settings.directive', [])
    .directive('panelSettings', panelSettingsDirective);

panelSettingsDirective.$inject = ['VIZ_COLORS'];

function panelSettingsDirective(VIZ_COLORS) {
    panelSettingsCtrl.$inject = [];
    panelSettingsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./panel-settings.directive.html'),
        require: ['^insight', '^widget'],
        scope: {},
        controller: panelSettingsCtrl,
        controllerAs: 'panelSettings',
        bindToController: {},
        link: panelSettingsLink,
    };

    function panelSettingsCtrl() {}

    function panelSettingsLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        // variables
        scope.panelSettings.panelLabel = '';
        scope.panelSettings.config = {};

        scope.panelSettings.theme = VIZ_COLORS.COLOR_SEMOSS;
        scope.panelSettings.borderWidth = {
            number: 0,
            unit: 'px',
        };
        scope.panelSettings.shadow = {
            x: 0,
            y: 0,
            blur: 0,
            spread: 0,
        };
        scope.panelSettings.position = {
            top: {
                number: 0,
                unit: '%',
            },
            left: {
                number: 0,
                unit: '%',
            },
            width: {
                number: 50,
                unit: '%',
            },
            height: {
                number: 50,
                unit: '%',
            },
        };

        // Functions
        scope.panelSettings.change = change;
        scope.panelSettings.save = save;

        /** Actions */

        /**
         * @name change
         * @desc the type has changed update the config
         */
        function change(): void {
            // set settings based on the new type
            setSettings(
                scope.panelSettings.config.type,
                scope.panelSettings.config
            );
        }

        /**
         * @name save
         * @desc save the changes
         */
        function save(): void {
            const commandList: PixelCommand[] = [],
                changes: any = {};

            const sheetId = scope.insightCtrl.getWorkbook('worksheet'),
                panel = scope.insightCtrl.getPanel(
                    sheetId,
                    scope.widgetCtrl.panelId
                );

            // If the name has not changed, no need to run the pixel (or if it isn't set)
            if (scope.panelSettings.panelLabel !== panel.panelLabel) {
                commandList.push(
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'setPanelLabel',
                        components: [scope.panelSettings.panelLabel],
                        terminal: true,
                    }
                );
            }

            // there might be a type change, we need to account for this
            // look at the current type, remove things that aren't valid
            if (scope.panelSettings.config.type === PANEL_TYPES.GOLDEN) {
                for (const option in scope.panelSettings.config) {
                    if (
                        scope.panelSettings.config.hasOwnProperty(option) &&
                        PANEL_OPTIONS.GOLDEN.config.hasOwnProperty(option)
                    ) {
                        changes[option] = scope.panelSettings.config[option];
                    }
                }
            } else if (
                scope.panelSettings.config.type === PANEL_TYPES.FLOATING
            ) {
                for (const option in scope.panelSettings.config) {
                    if (
                        scope.panelSettings.config.hasOwnProperty(option) &&
                        PANEL_OPTIONS.FLOATING.config.hasOwnProperty(option)
                    ) {
                        changes[option] = scope.panelSettings.config[option];
                    }
                }

                // add in the borderWidth
                changes.borderWidth = `${scope.panelSettings.borderWidth.number}${scope.panelSettings.borderWidth.unit}`;
                changes.shadowX =
                    typeof scope.panelSettings.shadow.x === 'number'
                        ? `${scope.panelSettings.shadow.x}px`
                        : '0px';
                changes.shadowY =
                    typeof scope.panelSettings.shadow.y === 'number'
                        ? `${scope.panelSettings.shadow.y}px`
                        : '0px';
                changes.shadowBlur =
                    typeof scope.panelSettings.shadow.blur === 'number'
                        ? `${scope.panelSettings.shadow.blur}px`
                        : '0px';
                changes.shadowSpread =
                    typeof scope.panelSettings.shadow.spread === 'number'
                        ? `${scope.panelSettings.shadow.spread}px`
                        : '0px';

                // add in the position changes
                changes.top = `${scope.panelSettings.position.top.number}${scope.panelSettings.position.top.unit}`;
                changes.left = `${scope.panelSettings.position.left.number}${scope.panelSettings.position.left.unit}`;
                changes.width = `${scope.panelSettings.position.width.number}${scope.panelSettings.position.width.unit}`;
                changes.height = `${scope.panelSettings.position.height.number}${scope.panelSettings.position.height.unit}`;
            }

            //this list should be everything that has been changed and should be valid for the PANEL_TYPE
            if (Object.keys(changes).length > 0) {
                commandList.push(
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'addPanelConfig',
                        components: [changes],
                        terminal: true,
                    }
                );
            }

            if (commandList.length > 0) {
                scope.insightCtrl.execute(commandList);
            }
        }

        /** Utility */
        /**
         * @name setSettings
         * @param type - type of the panel to set
         * @param config - config to merge in
         * @returns set settings based on the type of panel
         */
        function setSettings(type: string, config: any): void {
            if (type === PANEL_TYPES.GOLDEN) {
                scope.panelSettings.config = angular.merge(
                    {},
                    PANEL_OPTIONS.GOLDEN.config,
                    config || {}
                );
            } else if (type === PANEL_TYPES.FLOATING) {
                scope.panelSettings.config = angular.merge(
                    {},
                    PANEL_OPTIONS.FLOATING.config,
                    config || {}
                );

                const splitBorderWidth = extractUnit(
                        scope.panelSettings.config.borderWidth,
                        'px'
                    ),
                    splitTop = extractUnit(scope.panelSettings.config.top, '%'),
                    splitLeft = extractUnit(
                        scope.panelSettings.config.left,
                        '%'
                    ),
                    splitWidth = extractUnit(
                        scope.panelSettings.config.width,
                        '%'
                    ),
                    splitHeight = extractUnit(
                        scope.panelSettings.config.height,
                        '%'
                    );

                scope.panelSettings.borderWidth = {
                    number:
                        typeof splitBorderWidth[0] !== 'undefined'
                            ? splitBorderWidth[0]
                            : '',
                    unit: splitBorderWidth[1],
                };

                scope.panelSettings.shadow = {
                    x:
                        extractUnit(
                            scope.panelSettings.config.shadowX,
                            'px'
                        )[0] || 0,
                    y:
                        extractUnit(
                            scope.panelSettings.config.shadowY,
                            'px'
                        )[0] || 0,
                    blur:
                        extractUnit(
                            scope.panelSettings.config.shadowBlur,
                            'px'
                        )[0] || 0,
                    spread:
                        extractUnit(
                            scope.panelSettings.config.shadowSpread,
                            'px'
                        )[0] || 0,
                };

                scope.panelSettings.position = {
                    top: {
                        number: splitTop[0] ? splitTop[0] : 0,
                        unit: splitTop[1],
                    },
                    left: {
                        number: splitLeft[0] ? splitLeft[0] : 0,
                        unit: splitLeft[1],
                    },
                    width: {
                        number: splitWidth[0] ? splitWidth[0] : 50,
                        unit: splitWidth[1],
                    },
                    height: {
                        number: splitHeight[0] ? splitHeight[0] : 50,
                        unit: splitHeight[1],
                    },
                };
            }
        }

        /**
         * @name extractUnit
         * @param value - value to extract from
         * @param u - default unit
         * @returns the value and unit for the position
         */
        function extractUnit(
            value: string,
            u: string
        ): [number | undefined, string] {
            let i = 0,
                unit: string;

            // convert value to a string
            value = String(value);

            if (!value) {
                return [undefined, u];
            }

            const len = value.length;
            for (i = 0; i < len; i++) {
                if (value[i] === '%' || value[i] === 'p' || value[i] === 'e') {
                    break;
                }
            }

            unit = value.substring(i);
            if (!unit) {
                unit = u;
            }

            return [Number(value.substring(0, i)), unit];
        }

        /** Updates */
        /**
         * @name updatePanel
         * @desc called to update when the panel changes
         */
        function updatePanel(): void {
            const sheetId = scope.insightCtrl.getWorkbook('worksheet'),
                panel = scope.insightCtrl.getPanel(
                    sheetId,
                    scope.widgetCtrl.panelId
                );

            scope.panelSettings.panelLabel = panel.panelLabel;

            // set settings based on the original type
            setSettings(panel.config.type, panel.config);
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc initializes the panel-settings directive
         */
        function initialize(): void {
            let updatedPanelListener: () => {},
                cachePanelListener: () => {},
                resetPanelListener: () => {};

            updatedPanelListener = scope.insightCtrl.on(
                'updated-panel',
                updatePanel
            );
            cachePanelListener = scope.insightCtrl.on(
                'cache-panel',
                updatePanel
            );
            resetPanelListener = scope.insightCtrl.on(
                'reset-panel',
                updatePanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                updatedPanelListener();
                cachePanelListener();
                resetPanelListener();
            });

            updatePanel();
        }

        initialize();
    }
}
