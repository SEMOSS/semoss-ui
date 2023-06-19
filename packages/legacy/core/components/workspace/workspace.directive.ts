import angular from 'angular';

import Resizable from '../../utility/resizable-old';
import Utility from '../../utility/utility';

import './workspace.scss';

import './workspace-save/workspace-save.directive';
import './workspace-filter/workspace-filter.directive';
import './workspace-panel-filter/workspace-panel-filter.directive';

import '../../../widgets/embed-link/embed-link.directive';

export default angular
    .module('app.workspace.directive', [
        'app.workspace.workspace-save',
        'app.workspace.workspace-filter',
        'app.workspace.workspace-panel-filter',
        'app.embed-link.directive',
    ])
    .directive('workspace', workspaceDirective);

workspaceDirective.$inject = [
    '$state',
    '$timeout',
    'PLAYGROUND',
    'semossCoreService',
    'CONFIG',
    'monolithService',
];

function workspaceDirective(
    $state,
    $timeout,
    PLAYGROUND,
    semossCoreService,
    CONFIG,
    monolithService
) {
    workspaceCtrl.$inject = ['$scope'];
    workspaceLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^insight'],
        scope: {},
        controller: workspaceCtrl,
        controllerAs: 'workspace',
        bindToController: {},
        template: require('./workspace.directive.html'),
        link: workspaceLink,
        replace: true,
    };

    function workspaceCtrl() {}

    function workspaceLink(scope, ele, attrs, ctrl) {
        let resizeTimer,
            workspaceMainEle: HTMLElement,
            workspaceMenuEle: HTMLElement,
            workspaceTerminalEle: HTMLElement,
            workspaceInputEle: HTMLElement;

        // TODO: build switching here (between pipeline, workbook, and presentation)
        scope.insightCtrl = ctrl[0];
        scope.workspace.PLAYGROUND = PLAYGROUND;
        scope.workspace.name = {
            open: false,
            visible: '',
            updated: '',
        };
        scope.workspace.project = {
            visible: '',
            id: '',
        };

        scope.workspace.icons = {
            pause: require('images/pause.svg'),
            'add-panel': require('images/workspace-add-panel.svg'),
            'add-form': require('images/workspace-add-form.svg'),
            'add-chart': require('images/workspace-add-chart.svg'),
            'add-html': require('images/workspace-add-html.svg'),
            'add-filter': require('images/workspace-add-filter.svg'),
            'add-textbox': require('images/workspace-add-textbox.svg'),
            'add-assistant': require('images/workspace-add-assistant.svg'),
        };

        scope.workspace.share = {
            open: false,
        };

        scope.workspace.save = {
            open: false,
            saved: false,
            forceNew: false,
        };

        scope.workspace.filter = {
            open: false,
        };

        scope.workspace.panelFilter = {
            open: false,
            panelLabel: '',
            panelId: '',
        };

        scope.workspace.presentation = false;

        scope.workspace.sheets = [];
        scope.workspace.menu = {};
        scope.workspace.terminal = {};

        scope.workspace.openName = openName;
        scope.workspace.closeName = closeName;
        scope.workspace.openSave = openSave;
        scope.workspace.closeSave = closeSave;
        scope.workspace.closePanelFilter = closePanelFilter;
        scope.workspace.newSheet = newSheet;
        scope.workspace.selectSheet = selectSheet;
        scope.workspace.toggleTerminal = toggleTerminal;
        scope.workspace.dropPanel = dropPanel;
        scope.workspace.addPanel = addPanel;
        scope.workspace.togglePresentation = togglePresentation;
        scope.workspace.getContent = getContent;
        scope.workspace.getMenuContent = getMenuContent;
        scope.workspace.navigate = navigate;
        scope.workspace.adminOnlyInsightShare = CONFIG['adminOnlyInsightShare'];
        scope.workspace.showShareButton = false;

        /**Name */
        /**
         * @name openName
         * @desc open the name
         */
        function openName($event: JQueryEventObject): void {
            if (scope.workspace.presentation || scope.workspace.name.open) {
                return;
            }
            // Only open on click or on enter
            if (
                $event.type === 'click' ||
                ($event.type === 'keypress' && $event.keyCode === 13)
            ) {
                scope.workspace.name.updated = scope.workspace.name.visible;
                scope.workspace.name.open = true;

                workspaceInputEle.focus();
            }
        }

        /**
         * @name closeName
         * @desc open the name
         * @param save - save the name change?
         */
        function closeName(save: boolean): void {
            if (save) {
                scope.insightCtrl.emit('change-insight-name', {
                    name: scope.workspace.name.updated,
                });
            }
            scope.workspace.name.open = false;
        }

        /**Save */
        /**
         * @name openSave
         * @param forceNew boolean, whether to force save to be new
         * @desc open the save
         */
        function openSave(forceNew: boolean): void {
            scope.workspace.save.forceNew = forceNew ? forceNew : false;
            scope.workspace.save.open = true;
        }

        /**
         * @name closeSave
         * @desc open the save
         */
        function closeSave(): void {
            scope.workspace.save.open = false;
        }

        /**Save */
        /**
         * @name openPanelFilter
         * @desc open the panel filter
         */
        function openPanelFilter(panelId: string): void {
            const sheetId = scope.insightCtrl.getWorkbook('worksheet'),
                panel = scope.insightCtrl.getPanel(sheetId, panelId);

            scope.workspace.panelFilter.panelId = panelId;
            scope.workspace.panelFilter.panelLabel = panel.panelLabel;
            scope.workspace.panelFilter.open = true;
        }

        /**
         * @name closePanelFilter
         * @desc close the panel filter
         */
        function closePanelFilter(): void {
            scope.workspace.panelFilter.panelId = '';
            scope.workspace.panelFilter.panelLabel = '';
            scope.workspace.panelFilter.open = false;
        }

        /**Sheet */
        /**
         * @name newSheet
         * @desc called when a sheet is added
         */
        function newSheet(): void {
            let counter = scope.insightCtrl.getWorkbook('worksheetCounter');

            // add one
            counter++;

            // emit
            scope.insightCtrl.execute([
                {
                    type: 'Pixel',
                    components: [`AddSheet("${counter}")`],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name selectSheet
         * @param sheetId - sheetId to select
         * @desc called when a sheet is selected
         */
        function selectSheet(sheetId: string): void {
            scope.insightCtrl.emit('select-worksheet', {
                sheetId: sheetId,
            });
        }
        /**Menu */
        /**
         * @name openMenu
         * @desc open the side menu
         */
        function openMenu(): void {
            const menu = Utility.freeze(scope.workspace.menu);

            // already open
            if (menu.open) {
                return;
            }

            // open it
            menu.open = true;

            scope.insightCtrl.emit('change-workspace-menu', {
                options: menu,
            });
        }

        /**
         * @name closeMenu
         * @desc open the side menu
         */
        function closeMenu(): void {
            const menu = Utility.freeze(scope.workspace.menu);

            // close it
            menu.open = false;

            scope.insightCtrl.emit('change-workspace-menu', {
                options: menu,
            });
        }

        /** Terminal */
        /**
         * @name toggleTerminal
         * @desc toggle the terminal open or closed
         */
        function toggleTerminal(): void {
            if (scope.workspace.terminal.open) {
                scope.insightCtrl.emit('close-workspace-terminal');
            } else {
                scope.insightCtrl.emit('open-workspace-terminal');
            }
        }

        /**
         * @name dropPanel
         * @desc new panel has been dropped, create it
         * @param data - associated data with the panel
         * @param position - position to add to
         */
        function dropPanel(data, position): void {
            // TODO: use the position to draw a "standard" panel

            const worksheet = scope.insightCtrl.getWorkbook('worksheet');

            // increment
            let panelId: number = scope.insightCtrl.getShared('panelCounter');
            panelId++;

            const pixelComponents = [
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
                    components: [data.view],
                    terminal: true,
                },
            ];

            // open the menu
            const callback = () => {
                // open the menu
                openMenu();
            };

            // execute the pixel
            scope.insightCtrl.execute(pixelComponents, callback);
        }

        /**
         * @name addPanel
         * @desc add a panel to the current sheet
         * @param $event - DOM event
         * @param view - view for panel to add
         * @param menu - open the menu?
         */
        function addPanel(
            $event: KeyboardEvent,
            view: string,
            menu: boolean
        ): void {
            let panelId: number = scope.insightCtrl.getShared('panelCounter'),
                worksheet = scope.insightCtrl.getWorkbook('worksheet'),
                pixelComponents: any = [],
                viewOptions: any = null;

            if (view === 'text-editor') {
                viewOptions = {
                    html: 'Insert title text',
                    type: 'title',
                };
            }

            // increment
            panelId++;

            if (
                $event &&
                ($event.metaKey ||
                    $event.ctrlKey ||
                    $event.keyCode === 17 ||
                    $event.keyCode === 224)
            ) {
                worksheet =
                    scope.insightCtrl.getWorkbook('worksheetCounter') + 1;

                pixelComponents.push({
                    type: 'Pixel',
                    components: [`AddSheet("${worksheet}")`],
                    terminal: true,
                });
            }

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
                    components: [view, viewOptions],
                    terminal: true,
                },
            ]);

            // default the text editor to be a floating panel
            if (view === 'text-editor') {
                pixelComponents = pixelComponents.concat([
                    {
                        type: 'panel',
                        components: [panelId],
                    },
                    {
                        type: 'addPanelConfig',
                        components: [
                            {
                                type: 'floating',
                            },
                        ],
                        terminal: true,
                    },
                ]);
            }

            if (view === 'dashboard-assistant') {
                pixelComponents = pixelComponents.concat([
                    {
                        type: 'panel',
                        components: [panelId],
                    },
                    {
                        type: 'addPanelConfig',
                        components: [
                            {
                                type: 'floating',
                                top: 'calc(100% - 50px)',
                                left: 'calc(100% - 50px)',
                                height: '45px',
                                width: '45px',
                                zIndex: 1,
                            },
                        ],
                        terminal: true,
                    },
                ]);
            }

            // open the menu
            let callback = () => {};
            if (menu) {
                callback = () => {
                    // semossCoreService.emit('change-widget-tab', {
                    //     widgetId: $scope.widget.widgetId,
                    //     tab: 'view'
                    // });

                    // open the menu
                    openMenu();
                };
            }

            // execute the pixel
            scope.insightCtrl.execute(pixelComponents, callback);
        }

        /**
         * @name togglePresentation
         * @desc called to toggle presentation mode
         */
        function togglePresentation(): void {
            const presentation = !scope.workspace.presentation;

            scope.insightCtrl.emit('change-presentation', {
                presentation: presentation,
            });
        }

        /** Updates */
        /**
         * @name updateName
         * @desc called to update when the name changes
         */
        function updateName(): void {
            const appInsightId = scope.insightCtrl.getShared(
                'insight.app_insight_id'
            );

            if (scope.workspace.name.open) {
                closeName(false);
            }

            scope.workspace.save.saved = !!appInsightId;
            scope.workspace.name.visible =
                scope.insightCtrl.getShared('insight.name');
            scope.workspace.project.id =
                scope.insightCtrl.getShared('insight.app_id');
            getProject(scope.workspace.project.id);
        }

        /**
         * @name getProject
         * @desc gets the project by ID
         */
        function getProject(projectId: string): any {
            const message = semossCoreService.utility.random('query-pixel');

            // register message to come back to
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                for (
                    let appIdx = 0, appLen = output.length;
                    appIdx < appLen;
                    appIdx++
                ) {
                    if (output[appIdx].project_id === projectId) {
                        scope.workspace.project.visible =
                            output[appIdx].project_name;
                        return;
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'myProjects',
                        components: [],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name updateWorkbook
         * @desc called when the sheet information changes
         */
        function updateWorkbook(): void {
            const book = scope.insightCtrl.getWorkbook();

            // set the selected sheet
            scope.workspace.sheets = [];
            for (const sheetId in book.worksheets) {
                if (book.worksheets.hasOwnProperty(sheetId)) {
                    if (sheetId !== book.worksheet) {
                        scope.workspace.sheets.push({
                            sheetId: book.worksheets[sheetId].sheetId,
                            sheetLabel: book.worksheets[sheetId].sheetLabel,
                        });
                    }
                }
            }

            scope.workspace.sheet = {
                sheetId: book.worksheets.hasOwnProperty(book.worksheet)
                    ? book.worksheets[book.worksheet].sheetId
                    : -1,
                sheetLabel: book.worksheets.hasOwnProperty(book.worksheet)
                    ? book.worksheets[book.worksheet].sheetLabel
                    : '',
            };
        }

        /**
         * @name updateMenu
         * @desc called to update when the menu information changes
         */
        function updateMenu(initalLoad: boolean): void {
            scope.workspace.menu = scope.insightCtrl.getWorkspace('menu');

            // set the menu size
            if (scope.workspace.presentation) {
                workspaceMainEle.style.right = '0px';
                workspaceMenuEle.style.left = '100%';
                workspaceMenuEle.style.width = '0px';
            } else if (scope.workspace.menu.open) {
                if (initalLoad === true) {
                    workspaceMainEle.style.right = `calc(${
                        100 - scope.workspace.menu.current
                    }% + 48px)`;
                    workspaceMenuEle.style.left = `calc(${scope.workspace.menu.current}% - 48px)`;
                    workspaceMenuEle.style.width = `calc(${
                        100 - scope.workspace.menu.current
                    }% + 48px)`;
                } else {
                    workspaceMainEle.style.right = `${
                        100 - scope.workspace.menu.current
                    }%`;
                    workspaceMenuEle.style.left =
                        scope.workspace.menu.current + '%';
                    workspaceMenuEle.style.width = `${
                        100 - scope.workspace.menu.current
                    }%`;
                }
            } else {
                workspaceMainEle.style.right = '48px'; // TODO: not sure if there's a better way to do this
                workspaceMenuEle.style.left = 'calc(100% - 48px)';
                workspaceMenuEle.style.width = '48px';
            }
        }

        /**
         * @name updateTerminal
         * @desc called to update when the menu information changes
         */
        function updateTerminal(): void {
            scope.workspace.terminal =
                scope.insightCtrl.getWorkspace('terminal');

            // set menu components
            if (
                scope.workspace.terminal.open &&
                scope.workspace.terminal.view === 'inline'
            ) {
                workspaceMenuEle.style.bottom = `${
                    100 - scope.workspace.terminal.current
                }%`;
                workspaceMainEle.style.bottom = `${
                    100 - scope.workspace.terminal.current
                }%`;
            } else {
                workspaceMenuEle.style.bottom = '0';
                workspaceMainEle.style.bottom = '0';
            }

            // set the terminal size
            if (
                scope.workspace.terminal.open &&
                (scope.workspace.terminal.view === 'overlay' ||
                    scope.workspace.terminal.view === 'inline')
            ) {
                workspaceTerminalEle.style.display = '';
                workspaceTerminalEle.style.top =
                    scope.workspace.terminal.current + '%';
                workspaceTerminalEle.style.height = `${
                    100 - scope.workspace.terminal.current
                }%`;
            } else {
                workspaceTerminalEle.style.display = 'none';
                workspaceTerminalEle.style.top = '100%';
                workspaceTerminalEle.style.height = '0%';
            }
        }

        function checkShowShareButton() {
            if (scope.workspace.adminOnlyInsightShare === true) {
                monolithService.isAdmin().then(function (adminUser) {
                    if (adminUser) {
                        scope.workspace.showShareButton = true;
                    } else {
                        scope.workspace.showShareButton = false;
                    }
                });
            } else {
                scope.workspace.showShareButton = true;
            }
        }

        /**
         * @name updatedPresentation
         * @desc called when the presentation information changes
         */
        function updatedPresentation(): void {
            scope.workspace.presentation =
                scope.insightCtrl.getWorkspace('presentation');

            // close everything
            if (scope.workspace.presentation) {
                closeName(false);
                closeSave();
                closeMenu();
            } else {
                openMenu();
            }
        }

        /**
         * @name navigate
         * @desc navigate to an active insight or app
         * @param state - selected state
         * @param params - options for the active state
         */
        function navigate(state: string, params: any): void {
            $state.go(state, params || {});
        }

        /** Getters */
        /**
         * @name getContent
         * @desc get the content to paint
         * @returns html to render
         */
        function getContent(): string {
            return '<workbook></workbook>';
        }

        /**
         * @name getMenuContent
         * @desc get the side content to paint
         * @returns html to render
         */
        function getMenuContent(): string {
            if (
                scope.workspace.terminal.open &&
                scope.workspace.terminal.view === 'side'
            ) {
                return `<terminal ng-if="workspace.terminal.open && (workspace.terminal.view === 'side')" location="workspace"></terminal>`;
            }

            const sheetId = scope.insightCtrl.getWorkbook('worksheet'),
                panelId = scope.insightCtrl.getWorksheet(
                    sheetId,
                    'selected.panel'
                );

            if (panelId) {
                const widgetType = scope.insightCtrl.getShared('type');

                if (widgetType === 'insight') {
                    const widgetId =
                        'SMSSWidget' +
                        scope.insightCtrl.insightID +
                        '___' +
                        panelId;
                    return `<widget widget-id="${widgetId}"><widget-menu></widget-menu></widget>`;
                }
            }

            return `<widget><widget-menu></widget-menu></widget>`;
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc initializes the workspace directive
         * @returns {void}
         */
        function initialize(): void {
            const appInsightId = scope.insightCtrl.getShared(
                'insight.app_insight_id'
            );

            scope.workspace.save.saved = !!appInsightId;
            // get elements
            workspaceMainEle = ele[0].querySelector('#workspace__main');
            workspaceMenuEle = ele[0].querySelector('#workspace__menu');
            workspaceTerminalEle = ele[0].querySelector('#workspace__terminal');
            workspaceInputEle = ele[0].querySelector('#workspace__name__input');

            // set up the resizable
            const menuResizable = Resizable({
                available: ['W'],
                unit: '%',
                content: workspaceMenuEle,
                container: ele[0],
                restrict: {
                    minimumWidth: '20%',
                    maximumWidth: '70%',
                },
                on: function (top, left, height, width) {
                    // trigger the digest if we wait (to repaint)
                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    resizeTimer = $timeout(function () {
                        $timeout.cancel(resizeTimer);
                    }, 500);
                },
                stop: function (top, left, height, width) {
                    const menu = Utility.freeze(scope.workspace.menu);

                    workspaceMainEle.style.right = `${100 - left}%`;

                    menu.dragged = left;

                    scope.insightCtrl.emit('change-workspace-menu', {
                        options: menu,
                    });

                    // trigger the digest again (to repaint)
                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    resizeTimer = $timeout(function () {
                        $timeout.cancel(resizeTimer);
                    });
                },
            });

            const terminalResizable = Resizable({
                available: ['N'],
                unit: '%',
                content: workspaceTerminalEle,
                container: ele[0],
                restrict: {
                    minimumHeight: '20%',
                    maximumHeight: '90%',
                },
                on: function (top, left, height, width) {
                    // trigger the digest if we wait (to repaint)
                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    resizeTimer = $timeout(function () {
                        $timeout.cancel(resizeTimer);
                    }, 500);
                },
                stop: function (top, left, height, width) {
                    const terminal = Utility.freeze(scope.workspace.terminal);

                    if (terminal.view === 'inline') {
                        workspaceMenuEle.style.bottom = `${100 - top}%`;
                        workspaceMainEle.style.bottom = `${100 - top}%`;
                    }

                    scope.insightCtrl.emit('drag-workspace-terminal', {
                        dragged: top,
                    });

                    // trigger the digest again (to repaint)
                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    resizeTimer = $timeout(function () {
                        $timeout.cancel(resizeTimer);
                    });
                },
            });

            // register listeners
            const changedNameListener = scope.insightCtrl.on(
                'changed-insight-name',
                updateName
            );
            const addedWorksheetListener = scope.insightCtrl.on(
                'added-worksheet',
                updateWorkbook
            );
            const closedWorksheetListener = scope.insightCtrl.on(
                'closed-worksheet',
                updateWorkbook
            );
            const selectedWorksheetListener = scope.insightCtrl.on(
                'selected-worksheet',
                updateWorkbook
            );
            const updatedWorksheetListener = scope.insightCtrl.on(
                'updated-worksheet',
                updateWorkbook
            );
            const changedWorkspaceMenuListener = scope.insightCtrl.on(
                'changed-workspace-menu',
                updateMenu
            );
            const updatedWorkspaceTerminalListener = scope.insightCtrl.on(
                'updated-workspace-terminal',
                updateTerminal
            );
            const savedInsightListener = scope.insightCtrl.on(
                'saved-insight',
                updateName
            );
            const updatedPresentationListener = scope.insightCtrl.on(
                'updated-presentation',
                updatedPresentation
            );
            const openWorkspacePanelFilter = scope.insightCtrl.on(
                'open-workspace-panel-filter',
                (payload) => {
                    openPanelFilter(payload.panelId);
                }
            );

            scope.$on('$destroy', function () {
                console.log('destroying workspace....');
                changedNameListener();
                addedWorksheetListener;
                closedWorksheetListener();
                selectedWorksheetListener();
                updatedWorksheetListener();
                changedWorkspaceMenuListener();
                updatedWorkspaceTerminalListener();
                savedInsightListener();
                updatedPresentationListener();
                openWorkspacePanelFilter();

                menuResizable.destroy();
                terminalResizable.destroy();
            });

            updateName();
            updateWorkbook();
            updateMenu(true);
            updateTerminal();
            updatedPresentation();
            checkShowShareButton();
        }

        initialize();
    }
}
