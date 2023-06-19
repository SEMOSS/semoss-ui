import angular from 'angular';
import { LayoutManager } from './LayoutManager';
import { PANEL_TYPES } from '../../constants';

import { extractUnit, convertUnit } from '../../utility/style';

import './worksheet.scss';

import './worksheet-settings/worksheet-settings.directive';

export default angular
    .module('app.worksheet.directive', ['app.worksheet.worksheet-settings'])
    .directive('worksheet', worksheetDirective);

worksheetDirective.$inject = ['$compile', '$timeout'];

function worksheetDirective($compile, $timeout) {
    worksheetCtrl.$inject = [];
    worksheetLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^insight'],
        template: require('./worksheet.directive.html'),
        scope: {},
        controller: worksheetCtrl,
        controllerAs: 'worksheet',
        bindToController: {
            sheetId: '@',
        },
        link: worksheetLink,
        replace: true,
    };

    function worksheetCtrl() {}

    function worksheetLink(scope, ele, attrs, ctrl) {
        let worksheetEle,
            worksheetGoldenEle,
            layoutManager,
            widgetScope = {},
            changeTimeout;

        scope.insightCtrl = ctrl[0];

        scope.worksheet.PANEL_TYPES = PANEL_TYPES;

        scope.worksheet.panels = {};

        scope.worksheet.popover = {
            save: false,
        };

        scope.worksheet.onChange = onChange;
        scope.worksheet.addPanel = addPanel;
        scope.worksheet.selectPanel = selectPanel;
        scope.worksheet.closePanel = closePanel;
        scope.worksheet.clonePanel = clonePanel;
        scope.worksheet.openPanelFilter = openPanelFilter;
        scope.worksheet.hasPanels = hasPanels;
        scope.worksheet.toggleMaximize = toggleMaximize;

        /*** Panel */
        /**
         * @name onChange
         * @param panelId - panel id
         * @param changes - what has changed in the config
         * @desc when user moves or resizes a panel, this updates the necessary data structure
         */
        function onChange(panelId: string, changes: any): void {
            const config = scope.worksheet.panels[panelId].config;

            for (const change in changes) {
                if (changes.hasOwnProperty(change)) {
                    config[change] = changes[change];
                }
            }

            scope.insightCtrl.emit('cache-panel', {
                insightID: scope.insightCtrl.insightID,
                panelId: panelId,
                panel: {
                    config: config,
                },
            });
        }

        /**
         * @name addPanel
         * @desc add a panel to the current sheet
         */
        function addPanel(): void {
            let panelId: number = scope.insightCtrl.getShared('panelCounter'),
                worksheet = scope.insightCtrl.getWorkbook('worksheet'),
                pixelComponents: any = [];

            // increment
            panelId++;

            pixelComponents = pixelComponents.concat([
                {
                    type: 'addPanel',
                    components: [panelId, worksheet],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'addPanelConfig',
                    components: [
                        {
                            type: scope.insightCtrl.getWorkspace(
                                'options.panel.type'
                            ),
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'addPanelEvents',
                    components: [
                        {
                            onSingleClick: {
                                Unfilter: [
                                    {
                                        panel: '',
                                        query: '<encode>(<Frame> | UnfilterFrame(<SelectedColumn>));</encode>',
                                        options: {},
                                        refresh: false,
                                        default: true,
                                        disabledVisuals: ['Grid', 'Sunburst'],
                                        disabled: false,
                                    },
                                ],
                            },
                            onBrush: {
                                Filter: [
                                    {
                                        panel: '',
                                        query: '<encode>if((IsEmpty(<SelectedValues>)),(<Frame> | UnfilterFrame(<SelectedColumn>)), (<Frame> | SetFrameFilter(<SelectedColumn>==<SelectedValues>)));</encode>',
                                        options: {},
                                        refresh: false,
                                        default: true,
                                        disabled: false,
                                    },
                                ],
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'retrievePanelEvents',
                    components: [],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'setPanelView',
                    components: ['visualization'],
                    terminal: true,
                },
            ]);

            // open the menu
            const callback = () => {
                const menu = scope.insightCtrl.getWorkspace('menu');
                if (menu && !menu.open) {
                    menu.open = true;

                    scope.insightCtrl.emit('change-workspace-menu', {
                        insightID: scope.insightCtrl.insightID,
                        options: menu,
                    });
                }
            };

            // execute the pixel
            scope.insightCtrl.execute(pixelComponents, callback);
        }

        /**
         * @name selectPanel
         * @param panelId to select
         * @desc select the panel
         */
        function selectPanel(
            panelId: string | undefined,
            mode: 'move' | 'edit'
        ): void {
            // we allow selecting only when it isn't in presentation mode
            if (scope.worksheet.presentation) {
                return;
            }

            scope.insightCtrl.emit('select-panel', {
                sheetId: scope.worksheet.sheetId,
                panelId: panelId,
                mode: mode,
            });
        }

        /**
         * @name closePanel
         * @param panelId - id of panel to remove
         * @desc close the panel
         */
        function closePanel(panelId: string): void {
            scope.insightCtrl.execute([
                {
                    type: 'closePanel',
                    components: [panelId],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name clonePanel
         * @param panelId - id to clone
         * @param relative - position the clone relative to the current
         * @desc clone the panel
         */
        function clonePanel(
            event: JQueryEventObject,
            panelId: string,
            relative: boolean
        ): void {
            let newPanelId: number =
                    scope.insightCtrl.getShared('panelCounter'),
                openNewSheet: boolean = event.ctrlKey;

            // increment
            newPanelId++;

            const components: PixelCommand[] = [];

            if (openNewSheet) {
                let newSheetId =
                    scope.insightCtrl.getWorkbook('worksheetCounter');

                // add one
                newSheetId++;

                components.push(
                    {
                        type: 'Pixel',
                        components: [`AddSheet("${newSheetId}")`],
                        terminal: true,
                    },
                    {
                        type: 'clonePanel',
                        components: [panelId, newPanelId, newSheetId],
                        terminal: true,
                    }
                );
            } else {
                components.push(
                    {
                        type: 'panel',
                        components: [panelId],
                    },
                    {
                        type: 'clonePanel',
                        components: [newPanelId],
                        terminal: true,
                    }
                );
            }

            if (relative) {
                const config = scope.insightCtrl.getPanel(
                    scope.worksheet.sheetId,
                    panelId,
                    'config'
                );

                const extractedTop = extractUnit(config.top),
                    extractedLeft = extractUnit(config.left);

                if (worksheetEle) {
                    // send the full config, because we "cache" the values
                    config.top =
                        String(
                            convertUnit(
                                20,
                                'px',
                                extractedTop[1],
                                'height',
                                worksheetEle
                            ) + extractedTop[0]
                        ) + extractedTop[1];
                    config.left =
                        String(
                            convertUnit(
                                20,
                                'px',
                                extractedLeft[1],
                                'width',
                                worksheetEle
                            ) + extractedLeft[0]
                        ) + extractedLeft[1];

                    components.push(
                        {
                            type: 'panel',
                            components: [newPanelId],
                        },
                        {
                            type: 'addPanelConfig',
                            components: [config],
                            terminal: true,
                        }
                    );
                }
            }

            scope.insightCtrl.execute(components);
        }

        /**
         * @name openPanelFilter
         * @desc opens the filter tab in the widget menu
         * @param panelId id of panel
         */
        function openPanelFilter(panelId: string): void {
            scope.insightCtrl.emit('open-workspace-panel-filter', {
                insightID: scope.insightCtrl.insightID,
                panelId: panelId,
            });
        }

        /**
         * @name changePanel
         * @param
         * @desc the panel has changed
         */
        function changePanel(): void {
            if (changeTimeout) {
                $timeout.cancel(changeTimeout);
            }

            // debounce
            changeTimeout = $timeout(function () {
                $timeout.cancel(changeTimeout);
            }, 100);
        }

        /**
         * @name toggleMaximize
         * @param panelStatus - the current panel status to set to
         * @desc set the panel status
         * @returns {void}
         */
        function toggleMaximize(panelId: string, panelStatus: string): void {
            scope.worksheet.panels[panelId].config.panelstatus = panelStatus;

            // update the changes
            onChange(panelId, {
                panelstatus: panelStatus,
            });
        }

        /**
         * @name scrollToPanel
         * @param
         * @desc the panel has changed
         */
        function scrollToPanel(panelId: string): void {
            $timeout(() => {
                console.log('scrolling');
                const panelEle = worksheetEle.querySelector(
                    `panel--${panelId}`
                );

                if (panelEle && panelEle.firstElementChild) {
                    panelEle.firstElementChild.scrollIntoView();
                }
            });
        }

        /*** Layout */
        /**
         * @name initializeLayout
         * @desc initializes the worksheet layout
         */
        function initializeLayout(): void {
            const golden =
                scope.insightCtrl.getWorkbook(
                    `worksheets.${scope.worksheet.sheetId}.golden`
                ) || {};

            layoutManager = new LayoutManager({
                ele: worksheetGoldenEle,
                content: golden.content || [],
                compile: (container, state) => {
                    const widgetId = `SMSSWidget${scope.insightCtrl.insightID}___${state.panelId}`;
                    container
                        .getElement()
                        .html(
                            `<widget widget-id="${widgetId}"><widget-view></widget-view></widget>`
                        );

                    // timeout so that it is appended to the DOM
                    setTimeout(() => {
                        // destroy the scope
                        if (widgetScope.hasOwnProperty(state.panelId)) {
                            widgetScope[state.panelId].$destroy();
                        }

                        widgetScope[state.panelId] = scope.$new();

                        // compile the element
                        $compile(container.getElement())(
                            widgetScope[state.panelId]
                        );
                    });
                },
                destroy: (state) => {
                    if (widgetScope.hasOwnProperty(state.panelId)) {
                        widgetScope[state.panelId].$destroy();
                    }
                },
                events: {
                    select: (panelId: string) => {
                        selectPanel(panelId, 'move');

                        // need to digest
                        $timeout();
                    },
                    close: closePanel,
                    clone: clonePanel,
                    change: changePanel,
                    toggleMaximize: toggleMaximize,
                    filter: openPanelFilter,
                },
            });

            // add a resize listener
            scope.$watch(
                function () {
                    return ele[0].offsetHeight + '-' + ele[0].offsetWidth;
                },
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        layoutManager.resize();
                    }
                }
            );

            updatedWorksheet();
            selectedPanel();
            updatedPresentation();
        }

        /**
         * @name saveWorksheet
         * @desc sets flag to let golden layout know not to drop insights when components are destroyed
         * called when switching sheets
         */
        function saveWorksheet(): void {
            // use this method because it will return undefined if the worksheet is not there
            const worksheet = scope.insightCtrl.getWorkbook(
                `worksheets.${scope.worksheet.sheetId}`
            );

            if (!worksheet) {
                return;
            }

            // this check is here because it can be deleted....
            if (worksheet) {
                let golden = {};

                // if one panel is golden, use this layout
                for (const panelId in scope.worksheet.panels) {
                    if (
                        scope.worksheet.panels.hasOwnProperty(panelId) &&
                        scope.worksheet.panels[panelId].config.type ===
                            PANEL_TYPES.GOLDEN
                    ) {
                        golden = layoutManager.getConfig();
                        break;
                    }
                }

                scope.insightCtrl.emit('cache-worksheet', {
                    golden: golden,
                    sheetId: scope.worksheet.sheetId,
                });
            }
        }

        /*** Listeners */
        /**
         * @name updatedWorksheet
         * @param {*} payload the payload
         * @desc update the worksheet
         */
        function updatedWorksheet(payload?): void {
            // check to make sure this is the intended sheet to react
            if (payload && scope.worksheet.sheetId !== payload.sheetId) {
                return;
            }

            const worksheet = scope.insightCtrl.getWorksheet(
                    scope.worksheet.sheetId
                ),
                backgroundColor =
                    worksheet && worksheet.backgroundColor
                        ? worksheet.backgroundColor
                        : '',
                height = worksheet && worksheet.height ? worksheet.height : '',
                width = worksheet && worksheet.width ? worksheet.width : '';

            if (worksheetEle.style.backgroundColor !== backgroundColor) {
                worksheetEle.style.backgroundColor = backgroundColor;
            }

            if (worksheetEle.style.height !== height) {
                worksheetEle.style.height = height;
            }

            if (worksheetEle.style.width !== width) {
                worksheetEle.style.width = width;
            }

            // update the config
            layoutManager.render(worksheet.golden);

            //TODO: what happens when we close from a different sheet? This should probably be done in the service.............
            // remove the extra golden panels
            const addedPanels = layoutManager.getPanels();
            for (
                let panelIdx = 0, panelLen = addedPanels.length;
                panelIdx < panelLen;
                panelIdx++
            ) {
                // the panel exists and is golden, so it should be part of the layout
                if (
                    worksheet.panels.hasOwnProperty(addedPanel[panelIdx]) &&
                    worksheet.panels[addedPanel[panelIdx]].config.type ===
                        PANEL_TYPES.GOLDEN
                ) {
                    continue;
                }

                // it was removed previously (or is not golden), so we don't need it
                layoutManager.removePanel(addedPanel[panelIdx]);
            }

            //add the panels
            for (const panelId in worksheet.panels) {
                if (worksheet.panels.hasOwnProperty(panelId)) {
                    // add  the layout if it isn't there
                    if (
                        worksheet.panels[panelId].config.type ===
                        PANEL_TYPES.GOLDEN
                    ) {
                        if (addedPanels.indexOf(panelId) === -1) {
                            layoutManager.addPanel(
                                panelId,
                                worksheet.panels[panelId].panelLabel,
                                worksheet.panels[panelId].config
                            );
                        } else {
                            // update the label (might have changed)
                            layoutManager.updatePanelLabel(
                                panelId,
                                worksheet.panels[panelId].panelLabel
                            );

                            // update the options (might have)
                            layoutManager.updatePanelConfig(
                                panelId,
                                worksheet.panels[panelId].config
                            );
                        }
                    }

                    // save it to the variable
                    scope.worksheet.panels[panelId] = worksheet.panels[panelId];
                }
            }

            if (worksheet.hideHeaders) {
                layoutManager.hideHeaders();
            } else {
                layoutManager.showHeaders();
            }

            if (worksheet.hideGutters) {
                layoutManager.hideSplitter();

                // set it now, it won't repain
                if (worksheet.gutterSize) {
                    layoutManager.resizeSplitter(worksheet.gutterSize);
                }
            } else {
                // set it now, it will repaint when shown
                if (worksheet.gutterSize) {
                    layoutManager.resizeSplitter(worksheet.gutterSize);
                }

                layoutManager.showSplitter();
            }
        }

        /**
         * @name hasPanels
         * @desc get the number of panels in a worksheet
         * @returns whether or not the worksheet has any panels
         */
        function hasPanels(): boolean {
            return Object.keys(scope.worksheet.panels).length > 0;
        }

        /**
         * @name addedPanel
         * @desc add a panel
         * @param payload {insightID, sheetId, panelId}
         */
        function addedPanel(payload: {
            insightID: string;
            sheetId: string;
            panelId: string;
        }): void {
            console.log('added panel', payload.panelId);
            // highlight if a panel is added here

            // check if it is correct
            if (payload.sheetId !== scope.worksheet.sheetId) {
                return;
            }

            const panel = scope.insightCtrl.getWorksheet(
                scope.worksheet.sheetId,
                `panels.${payload.panelId}`
            );

            // add to the layout
            if (panel.config.type === PANEL_TYPES.GOLDEN) {
                layoutManager.addPanel(
                    payload.panelId,
                    panel.panelLabel,
                    panel.config
                );
            } else if (panel.config.type === PANEL_TYPES.FLOATING) {
                scrollToPanel(payload.panelId);
            }

            // save it
            scope.worksheet.panels[payload.panelId] = panel;
        }

        /**
         * @name closedPanel
         * @desc close a panel
         * @param payload {insightID, sheetId, panelId}
         */
        function closedPanel(payload: {
            insightID: string;
            sheetId: string;
            panelId: string;
        }): void {
            // check if it is correct
            if (payload.sheetId !== scope.worksheet.sheetId) {
                return;
            }

            // see if the panel is golden and remove it if is
            if (
                scope.worksheet.panels[payload.panelId].config.type ===
                PANEL_TYPES.GOLDEN
            ) {
                layoutManager.removePanel(payload.panelId);
            }

            delete scope.worksheet.panels[payload.panelId];
        }

        /**
         * @name updatePanel
         * @desc updates panel information
         * @param payload {insightID, sheetId, panelId}
         */
        function updatePanel(payload: {
            panelId: string;
            sheetId: string;
        }): void {
            // check if it is correct
            if (payload.sheetId !== scope.worksheet.sheetId) {
                return;
            }

            // see if the panel exists
            if (!scope.worksheet.panels[payload.panelId]) {
                return;
            }

            const panel = scope.insightCtrl.getPanel(
                payload.sheetId,
                payload.panelId
            );
            // see what changed and upate accordintly

            // check if the type has changed!
            if (
                scope.worksheet.panels[payload.panelId].config.type !==
                panel.config.type
            ) {
                // it is now golden, add it to the layout
                if (panel.config.type === PANEL_TYPES.GOLDEN) {
                    layoutManager.addPanel(
                        payload.panelId,
                        panel.panelLabel,
                        panel.config
                    );
                } else if (
                    scope.worksheet.panels[payload.panelId].config.type ===
                    PANEL_TYPES.GOLDEN
                ) {
                    // not golden, if it previously was remove it
                    layoutManager.removePanel(payload.panelId);
                }

                // type has changed we need to redo the highlighting
                if (payload.panelId === scope.worksheet.selectedPanel) {
                    if (panel.config.type === PANEL_TYPES.GOLDEN) {
                        layoutManager.addHighlight(payload.panelId);
                    } else {
                        layoutManager.removeHighlight();
                    }
                }
            } else {
                const changes: any = {};
                // check if the title has changed
                if (
                    scope.worksheet.panels[payload.panelId].panelLabel !==
                    panel.panelLabel
                ) {
                    if (panel.config.type === PANEL_TYPES.GOLDEN) {
                        layoutManager.updatePanelLabel(
                            payload.panelId,
                            panel.panelLabel
                        );
                    }
                }

                // check if the background has changed
                if (
                    scope.worksheet.panels[payload.panelId].config
                        .backgroundColor !== panel.config.backgroundColor
                ) {
                    if (panel.config.type === PANEL_TYPES.GOLDEN) {
                        changes.backgroundColor = panel.config.backgroundColor;
                    }
                }

                // check if the opacity has changed
                if (
                    scope.worksheet.panels[payload.panelId].config.opacity !==
                    panel.config.opacity
                ) {
                    if (panel.config.type === PANEL_TYPES.GOLDEN) {
                        changes.opacity = panel.config.opacity;
                    }
                }

                if (Object.keys(changes).length > 0) {
                    layoutManager.updatePanelConfig(payload.panelId, changes);
                }
            }
            // update
            scope.worksheet.panels[payload.panelId] = panel;
        }

        /**
         * @name selectedPanel
         * @param update the selected panel
         */
        function selectedPanel() {
            scope.worksheet.selectedPanel = scope.insightCtrl.getWorksheet(
                scope.worksheet.sheetId,
                'selected.panel'
            );

            // add the highlight if its active
            if (
                typeof scope.worksheet.selectedPanel !== 'undefined' &&
                scope.worksheet.panels[scope.worksheet.selectedPanel] &&
                scope.worksheet.panels[scope.worksheet.selectedPanel].config
                    .type === PANEL_TYPES.GOLDEN
            ) {
                layoutManager.addHighlight(scope.worksheet.selectedPanel);
            } else {
                layoutManager.removeHighlight();
            }
        }

        /**
         * @name updatedPresentation
         * @desc called when the presentation information changes
         */
        function updatedPresentation(): void {
            scope.worksheet.presentation =
                scope.insightCtrl.getWorkspace('presentation');

            //only change controls if it is different
            //TODO: modify golden-layout to disable different events
            if (scope.worksheet.presentation) {
                layoutManager.disable();
            } else {
                layoutManager.enable();
            }
        }

        /**
         * @name updatePanelHighlight
         * @desc highlight the panel
         */
        function updatePanelHighlight(payload: any): void {
            layoutManager.updatePanelHighlight(payload);
        }

        /** Utility */

        /**
         * @name initialize
         * @desc initializes the worksheet directive
         */
        function initialize(): void {
            let updatedWorksheetListener: () => {},
                addedPanelListener: () => {},
                closedPanelListener: () => {},
                updatedPanelListener: () => {},
                resetPanelListener: () => {},
                updateViewListener: () => {},
                selectedPanelListener: () => {},
                saveWorksheetListener: () => {},
                updatedPresentationListener: () => {},
                updatePanelHighlightListener: () => {},
                windowResizeListener;

            worksheetEle = ele[0];
            worksheetGoldenEle = ele[0].querySelector('#worksheet__golden');

            // register listeners
            updatedWorksheetListener = scope.insightCtrl.on(
                'updated-worksheet',
                updatedWorksheet
            );
            addedPanelListener = scope.insightCtrl.on(
                'added-panel',
                addedPanel
            );
            closedPanelListener = scope.insightCtrl.on(
                'closed-panel',
                closedPanel
            );
            updatedPanelListener = scope.insightCtrl.on(
                'updated-panel',
                updatePanel
            );
            resetPanelListener = scope.insightCtrl.on(
                'reset-panel',
                updatePanel
            );
            updateViewListener = scope.insightCtrl.on(
                'update-view',
                updatePanel
            );
            selectedPanelListener = scope.insightCtrl.on(
                'selected-panel',
                selectedPanel
            );
            saveWorksheetListener = scope.insightCtrl.on(
                'save-worksheet',
                saveWorksheet
            );
            updatedPresentationListener = scope.insightCtrl.on(
                'updated-presentation',
                updatedPresentation
            );
            updatePanelHighlightListener = scope.insightCtrl.on(
                'highlight-panel',
                updatePanelHighlight
            );
            windowResizeListener = function () {
                scope.$apply();
            };

            // trigger a digest when window resizes so golden layout can resize correctly
            window.addEventListener('resize', windowResizeListener);

            scope.$on('$destroy', function () {
                console.log('destroying worksheet....');
                updatedWorksheetListener();
                addedPanelListener();
                closedPanelListener();
                updatedPanelListener();
                resetPanelListener();
                updateViewListener();
                saveWorksheetListener();
                selectedPanelListener();
                updatedPresentationListener();
                updatePanelHighlightListener();
                window.removeEventListener('resize', windowResizeListener);
                // save before we destroy it
                saveWorksheet();

                if (layoutManager) {
                    layoutManager.destroy();
                }
            });

            // initialize the layout
            initializeLayout();
        }

        initialize();
    }
}
