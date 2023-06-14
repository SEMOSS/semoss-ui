'use strict';

import angular from 'angular';

import './color-panel.scss';

export default angular
    .module('app.color-panel.directive', [])
    .directive('colorPanel', colorPanelDirective);

colorPanelDirective.$inject = ['$timeout', 'VIZ_COLORS'];

function colorPanelDirective($timeout, VIZ_COLORS) {
    colorPanelCtrl.$inject = [];
    colorPanelLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'colorPanel',
        bindToController: {},
        template: require('./color-panel.directive.html'),
        controller: colorPanelCtrl,
        link: colorPanelLink,
    };

    function colorPanelCtrl() {}

    function colorPanelLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // functions
        scope.colorPanel.addColor = addColor;
        scope.colorPanel.appendColor = appendColor;
        scope.colorPanel.editCustomPalette = editCustomPalette;
        scope.colorPanel.deleteCustomPalette = deleteCustomPalette;
        scope.colorPanel.resetColor = resetColor;
        scope.colorPanel.execute = execute;

        scope.colorPanel.customColors = {
            show: false,
            new: {
                name: '',
                colors: '',
                pickedColor: '#000000',
            },
            list: [],
        };
        scope.colorPanel.isEditing = false;
        // Set up colors
        scope.colorPanel.colorPanels = [];

        /**
         * @name resetColor
         * @desc removes the ornament to reset the color to the default theme's color
         */
        function resetColor(): void {
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'removePanelOrnaments',
                    components: ['tools.shared.color'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'removePanelOrnaments',
                    components: ['tools.shared.colorName'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name editCustomPalette
         * @param {number} index the index to edit
         * @desc edit the palette by setting the new to the existing
         * @returns {void}
         */
        function editCustomPalette(index: number): void {
            scope.colorPanel.isEditing = true;
            let colors = '',
                colorIdx: number;

            for (
                colorIdx = 0;
                colorIdx <
                scope.colorPanel.customColors.list[index].colors.length;
                colorIdx++
            ) {
                colors +=
                    scope.colorPanel.customColors.list[index].colors[colorIdx];
                if (
                    colorIdx <
                    scope.colorPanel.customColors.list[index].colors.length - 1
                ) {
                    colors += ',';
                }
            }

            scope.colorPanel.customColors.new = {
                name: scope.colorPanel.customColors.list[index].name,
                colors: colors,
                pickedColor: '#000000',
            };
        }

        /**
         * @name deleteCustomPalette
         * @param {number} index the index to delete
         * @desc delete this custom palette
         * @returns {void}
         */
        function deleteCustomPalette(index: number): void {
            let callback: any;

            callback = function () {
                scope.widgetCtrl.alert(
                    'success',
                    'Successfully removed custom color palette.'
                );
            };
            scope.widgetCtrl.execute(
                [
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'removePanelOrnaments',
                        components: [
                            'tools.shared.customColors.' +
                                scope.colorPanel.customColors.list[index].name,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'retrievePanelOrnaments',
                        components: ['tools'],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name appendColor
         * @param {string} color the color to append to list of custom colors
         * @desc add the selected color to the custom color list
         */
        function appendColor(color: string): void {
            if (scope.colorPanel.customColors.new.colors) {
                scope.colorPanel.customColors.new.colors += ',';
            }
            scope.colorPanel.customColors.new.colors += color;
        }

        /**
         * @name addColor
         * @desc make pixel call to add the custom color as ornament
         * @returns {void}
         */
        function addColor(): void {
            scope.colorPanel.isEditing = false;
            let ornament = {
                    customColors: {},
                },
                colorsArray = [],
                colorIdx: number,
                callback;

            if (
                !scope.colorPanel.customColors.new.name ||
                !scope.colorPanel.customColors.new.colors
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please fill in both fields before adding.'
                );

                return;
            }

            colorsArray = scope.colorPanel.customColors.new.colors.split(',');
            for (colorIdx = 0; colorIdx < colorsArray.length; colorIdx++) {
                ornament.customColors[
                    scope.colorPanel.customColors.new.name.replace()
                ] = JSON.stringify(colorsArray);
            }

            callback = function () {
                // set the selected color
                scope.colorPanel.colorName =
                    scope.colorPanel.customColors.new.name;
                // run to select it
                execute();

                scope.colorPanel.customColors.new = {
                    name: '',
                    colors: '',
                    pickedColor: '#000000',
                };
                scope.widgetCtrl.alert(
                    'success',
                    'Successfully added custom color palette.'
                );
            };

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'addPanelOrnaments',
                        components: [
                            {
                                tools: {
                                    shared: {
                                        customColors: ornament.customColors,
                                    },
                                },
                            },
                        ],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'retrievePanelOrnaments',
                        components: ['tools'],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name resetPanel
         * @desc sets the data whenever it changes
         */
        function resetPanel(): void {
            let currentView = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + currentView
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                uiOptions = angular.extend(individiualTools, sharedTools),
                customColor: string,
                customColorItem: any = {};
            initializeVars();
            scope.colorPanel.colorName = uiOptions.colorName;
            // loop through custom colors and add on to the existing list
            scope.colorPanel.customColors.list = [];
            if (sharedTools.customColors) {
                for (customColor in sharedTools.customColors) {
                    if (sharedTools.customColors.hasOwnProperty(customColor)) {
                        customColorItem = {
                            name: customColor,
                            displayName: customColor,
                            colors: JSON.parse(
                                sharedTools.customColors[customColor]
                            ),
                        };
                        scope.colorPanel.customColors.list.push(
                            customColorItem
                        );
                        scope.colorPanel.colorPanels.push(customColorItem);
                    }
                }
            }
        }

        /**
         * @name execute
         * @desc notifies the store whenever a tool function is run.
         */
        function execute(): void {
            if (!scope.colorPanel.colorName) {
                return;
            }

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                shared: {
                                    colorName: scope.colorPanel.colorName,
                                    color: scope.colorPanel.selectedColorArray,
                                },
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        function initializeVars() {
            // Set up colors
            scope.colorPanel.colorPanels = [
                {
                    name: 'Semoss',
                    displayName: 'Semoss',
                    colors: VIZ_COLORS.COLOR_SEMOSS,
                },
                {
                    name: 'One',
                    displayName: 'Option 1',
                    colors: VIZ_COLORS.COLOR_ONE,
                },
                {
                    name: 'Two',
                    displayName: 'Option 2',
                    colors: VIZ_COLORS.COLOR_TWO,
                },
                {
                    name: 'Three',
                    displayName: 'Option 3',
                    colors: VIZ_COLORS.COLOR_THREE,
                },
                {
                    name: 'Four',
                    displayName: 'Option 4',
                    colors: VIZ_COLORS.COLOR_FOUR,
                },
                {
                    name: 'Five',
                    displayName: 'Option 5',
                    colors: VIZ_COLORS.COLOR_FIVE,
                },
                {
                    name: 'Six',
                    displayName: 'Option 6',
                    colors: VIZ_COLORS.COLOR_SIX,
                },
                {
                    name: 'Seven',
                    displayName: 'Option 7',
                    colors: VIZ_COLORS.COLOR_SEVEN,
                },
                {
                    name: 'Eight',
                    displayName: 'Option 8',
                    colors: VIZ_COLORS.COLOR_EIGHT,
                },
                {
                    name: 'Nine',
                    displayName: 'Option 9',
                    colors: VIZ_COLORS.COLOR_NINE,
                },
                {
                    name: 'Ten',
                    displayName: 'Option 10',
                    colors: VIZ_COLORS.COLOR_TEN,
                },
                {
                    name: 'Eleven',
                    displayName: 'Option 11',
                    colors: VIZ_COLORS.COLOR_ELEVEN,
                },
                {
                    name: 'Twelve',
                    displayName: 'Option 12',
                    colors: VIZ_COLORS.COLOR_TWELVE,
                },
                {
                    name: 'Thirteen',
                    displayName: 'Option 13',
                    colors: VIZ_COLORS.COLOR_THIRTEEN,
                },
                {
                    name: 'Fourteen',
                    displayName: 'Option 14',
                    colors: VIZ_COLORS.COLOR_FOURTEEN,
                },
                {
                    name: 'Fifteen',
                    displayName: 'Option 15',
                    colors: VIZ_COLORS.COLOR_FIFTEEN,
                },
            ];
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize(): void {
            let updateTaskListener: () => {},
                addDataListener: () => {},
                updateOrnamentsListener: () => {};

            updateTaskListener = scope.widgetCtrl.on('update-task', resetPanel);
            addDataListener = scope.widgetCtrl.on('added-data', resetPanel);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying colorPanel....');
                updateTaskListener();
                addDataListener();
                updateOrnamentsListener();
            });

            initializeVars();
            resetPanel();
        }

        initialize();
    }
}
