'use strict';

import angular from 'angular';

import './worksheet-settings.scss';
import { WORKSHEET, PANEL_TYPES } from '../../../constants';

export default angular
    .module('app.worksheet.worksheet-settings', [])
    .directive('worksheetSettings', worksheetSettingsDirective);

worksheetSettingsDirective.$inject = [
    'semossCoreService',
    'VIZ_COLORS',
    '$window',
    '$timeout',
];

function worksheetSettingsDirective(
    semossCoreService,
    VIZ_COLORS,
    $window,
    $timeout
) {
    worksheetSettingsCtrl.$inject = [];
    worksheetSettingsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: [],
        template: require('./worksheet-settings.directive.html'),
        scope: {
            insightCtrl: '=?',
        },
        controller: worksheetSettingsCtrl,
        controllerAs: 'worksheetSettings',
        bindToController: {
            close: '&?',
        },
        link: worksheetSettingsLink,
    };

    function worksheetSettingsCtrl() {}

    function worksheetSettingsLink(scope, ele, attrs, ctrl) {
        // scope.insightCtrl = ctrl[0];
        let worksheetEle;

        // Variables
        scope.worksheetSettings.golden = true;
        scope.worksheetSettings.theme = VIZ_COLORS.COLOR_SEMOSS;
        scope.worksheetSettings.sheetId = undefined;
        scope.worksheetSettings.sheetLabel = '';
        scope.worksheetSettings.config = {
            backgroundColor: '',
        };
        scope.worksheetSettings.size = {
            height: {
                number: 50,
                unit: '%',
            },
            width: {
                number: 50,
                unit: '%',
            },
        };

        scope.worksheetSettings.save = save;
        scope.worksheetSettings.scale = scale;
        scope.worksheetSettings.copyInsightConfig = copyInsightConfig;

        // Functions

        /**
         * @name save
         * @desc save the changes
         */
        function save(): void {
            const commandList: PixelCommand[] = [],
                changes: { [key: string]: any } = {};

            const sheetId = scope.insightCtrl.getWorkbook('worksheet'),
                worksheet = scope.insightCtrl.getWorkbook(
                    'worksheets.' + sheetId
                );

            // If the name has not changed, no need to run the pixel (or if it isn't set)
            if (
                scope.worksheetSettings.sheetLabel !== worksheet.sheetLabel ||
                !worksheet.sheetLabel
            ) {
                commandList.push({
                    type: 'Pixel',
                    components: [
                        `Sheet("${sheetId}") | SetSheetLabel(sheetLabel = ["${scope.worksheetSettings.sheetLabel}"])`,
                    ],
                    terminal: true,
                });
            }

            // see which options are changed
            for (const option in scope.worksheetSettings.config) {
                if (
                    scope.worksheetSettings.config.hasOwnProperty(option) &&
                    worksheet.hasOwnProperty(option) &&
                    JSON.stringify(scope.worksheetSettings.config[option]) !==
                        JSON.stringify(worksheet[option])
                ) {
                    changes[option] = scope.worksheetSettings.config[option];
                }
            }

            // add sizing if changed
            if (
                scope.worksheetSettings.config.height !==
                `${scope.worksheetSettings.size.height.number}${scope.worksheetSettings.size.height.unit}`
            ) {
                changes.height = `${scope.worksheetSettings.size.height.number}${scope.worksheetSettings.size.height.unit}`;
            }

            if (
                scope.worksheetSettings.config.width !==
                `${scope.worksheetSettings.size.width.number}${scope.worksheetSettings.size.width.unit}`
            ) {
                changes.width = `${scope.worksheetSettings.size.width.number}${scope.worksheetSettings.size.width.unit}`;
            }

            if (Object.keys(changes).length > 0) {
                commandList.push({
                    type: 'Pixel',
                    components: [
                        `Sheet("${sheetId}") | SetSheetConfig(sheetConfig = [${JSON.stringify(
                            changes
                        )}])`,
                    ],
                    terminal: true,
                });
            }

            if (commandList.length === 0) {
                scope.insightCtrl.alert('warn', 'No options selected.');
                return;
            }

            scope.insightCtrl.execute(commandList, () => {
                scope.worksheetSettings.close();
            });
        }

        /**
         * @name scale
         * @desc vertically scale the sheet to fit the content
         */
        function scale(): void {
            if (!worksheetEle) {
                console.error('Worksheet is not defined');
                return;
            }

            // scale the sheet to the panels
            const panels = document.querySelectorAll('.panel');

            let height = -Infinity;
            panels.forEach((ele) => {
                const bottom =
                    ele.getBoundingClientRect().bottom -
                    worksheetEle.getBoundingClientRect().top;

                height = Math.max(height, bottom);
            });

            if (height < worksheetEle.offsetHeight) {
                scope.insightCtrl.alert(
                    'warn',
                    'Panels do not overflow the sheet. Nothing to scale.'
                );
                return;
            }

            const sheetId = scope.insightCtrl.getWorkbook('worksheet'),
                worksheet = scope.insightCtrl.getWorkbook(
                    'worksheets.' + sheetId
                );

            // store the command
            const commandList: PixelCommand[] = [];

            // add the new height if it's changed
            commandList.push({
                type: 'Pixel',
                components: [
                    `Sheet("${sheetId}") | SetSheetConfig(sheetConfig = [${JSON.stringify(
                        {
                            height: `${height}px`,
                        }
                    )}])`,
                ],
                terminal: true,
            });

            // scale the panels based on the worksheet's original height
            for (const panelId in worksheet.panels) {
                const panel = scope.insightCtrl.getPanel(sheetId, panelId);

                if (panel.config.type !== PANEL_TYPES.FLOATING) {
                    continue;
                }

                const changes: Record<string, unknown> = {};
                const splitTop = extractUnit(panel.config.top, '%');
                if (splitTop[0] !== undefined && splitTop[1] === '%') {
                    changes.top = `${
                        (splitTop[0] / 100) * worksheetEle.offsetHeight
                    }px`;
                }

                const splitHeight = extractUnit(panel.config.height, '%');
                if (splitHeight[0] !== undefined && splitHeight[1] === '%') {
                    changes.height = `${
                        (splitHeight[0] / 100) * worksheetEle.offsetHeight
                    }px`;
                }

                if (Object.keys(changes).length > 0) {
                    const config = panel.config;

                    commandList.push(
                        {
                            type: 'panel',
                            components: [panelId],
                        },
                        {
                            type: 'addPanelConfig',
                            components: [
                                {
                                    ...config,
                                    ...changes,
                                },
                            ],
                            terminal: true,
                        }
                    );
                }
            }

            if (commandList.length === 0) {
                return;
            }

            scope.insightCtrl.execute(commandList);
        }

        /** Updates */
        /**
         * @name updateWorksheet
         * @desc called when the sheet information changes
         */
        function updateWorksheet(): void {
            // save the workspace to get the proper layout
            semossCoreService.workspace.saveWorkspace(
                scope.insightCtrl.insightID
            );

            const sheetId = scope.insightCtrl.getWorkbook('worksheet');
            const worksheet = scope.insightCtrl.getWorkbook(
                'worksheets.' + sheetId
            );

            scope.worksheetSettings.sheetLabel = worksheet.sheetLabel;
            scope.worksheetSettings.config = {
                backgroundColor: worksheet.backgroundColor,
                hideHeaders: worksheet.hideHeaders,
                hideGutters: worksheet.hideGutters,
                gutterSize: worksheet.gutterSize,
                height: worksheet.height,
                width: worksheet.width,
            };

            // update the position
            const splitWidth = extractUnit(
                    scope.worksheetSettings.config.width,
                    '%'
                ),
                splitHeight = extractUnit(
                    scope.worksheetSettings.config.height,
                    '%'
                );

            scope.worksheetSettings.size = {
                height: {
                    number: splitHeight[0] ? splitHeight[0] : 50,
                    unit: splitHeight[1],
                },
                width: {
                    number: splitWidth[0] ? splitWidth[0] : 50,
                    unit: splitWidth[1],
                },
            };

            // show golden?
            if (
                worksheet.hasOwnProperty('golden') &&
                JSON.stringify(worksheet.golden) !==
                    JSON.stringify(WORKSHEET.golden)
            ) {
                scope.worksheetSettings.golden = true;
            } else {
                scope.worksheetSettings.golden = false;
            }
        }

        /**
         * @name copyInsightConfig
         * @desc get the current config for the insight and copy to clipboard
         */
        function copyInsightConfig(): void {
            const config = semossCoreService.workspace.saveWorkspace(
                scope.insightCtrl.insightID
            );
            const configPixel = `META | SetInsightConfig(${JSON.stringify(
                config
            )});`;

            if (navigator && navigator.clipboard) {
                // successor to document.execCommand
                // will be able to copy large amount of text without issue
                // async copy
                navigator.clipboard
                    .writeText(configPixel)
                    .then(() => {
                        scope.insightCtrl.alert(
                            'success',
                            'Insight config successfully copied to clipboard'
                        );
                        $timeout(); // digest
                    })
                    .catch((error) => {
                        scope.insightCtrl.alert(
                            'error',
                            'Insight config unsuccessfully copied to clipboard'
                        );
                    });
            } else if ($window.clipboardData) {
                // IE
                $window.clipboardData.setData('Text', configPixel);
                scope.insightCtrl.alert(
                    'success',
                    'Insight config successfully copied to clipboard'
                );
            } else {
                const exportElement = angular.element(
                    "<textarea style='position:fixed;left:-1000px;top:-1000px;'>" +
                        configPixel +
                        '</textarea>'
                );

                ele.append(exportElement);
                (exportElement as any).select();

                if (document.execCommand('copy')) {
                    exportElement.remove();

                    scope.insightCtrl.alert(
                        'success',
                        'Insight config successfully copied to clipboard'
                    );
                } else {
                    exportElement.remove();
                    scope.insightCtrl.alert(
                        'error',
                        'Insight config unsuccessfully copied to clipboard'
                    );
                }
            }
        }

        /** Helpers */
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
        /** Initialize */
        /**
         * @name initialize
         * @desc initializes the worksheet-settings directive
         */
        function initialize(): void {
            // get the element
            worksheetEle = document.querySelector('#worksheet');

            // register listeners
            const updateLayoutListener = semossCoreService.on(
                'updated-worksheet',
                updateWorksheet
            );
            const addedPanelListener = scope.insightCtrl.on(
                'added-panel',
                updateWorksheet
            );
            const closedPanelListener = scope.insightCtrl.on(
                'closed-panel',
                updateWorksheet
            );
            const updatedPanelListener = scope.insightCtrl.on(
                'updated-panel',
                updateWorksheet
            );
            const resetPanelListener = scope.insightCtrl.on(
                'reset-panel',
                updateWorksheet
            );

            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying worksheet-settings....');
                updateLayoutListener();
                addedPanelListener();
                closedPanelListener();
                updatedPanelListener();
                resetPanelListener();
            });

            // initialize the worksheet-settings
            updateWorksheet();
        }

        initialize();
    }
}
