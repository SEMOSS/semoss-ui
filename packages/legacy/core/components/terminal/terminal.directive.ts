'use strict';

import angular from 'angular';
import Resizable from '../../utility/resizable-old';
import { PANEL_TYPES } from '../../constants';

import './terminal.scss';

import './terminal-browser/terminal-browser.directive';
import './terminal-console/terminal-console.directive';
import './terminal-file/terminal-file.directive';

interface Selected {
    name: string;
    path: string;
    date: string;
    split: string[];
    content: string;
    open: boolean;
    history: { message: string; user: string; date: string }[];
    new: boolean;
    space: string;
    updated: string;
    ext: string;
}

export default angular
    .module('app.terminal.directive', [
        'app.terminal.terminal-browser',
        'app.terminal.terminal-console',
        'app.terminal.terminal-file',
    ])
    .directive('terminal', terminalDirective);

terminalDirective.$inject = [
    '$timeout',
    'semossCoreService',
    'monolithService',
];

function terminalDirective(
    $timeout: ng.ITimeoutService,
    semossCoreService: SemossCoreService,
    monolithService: MonolithService
) {
    terminalCtrl.$inject = ['$scope'];
    terminalLink.$inject = ['scope'];

    return {
        restrict: 'EA',
        template: require('./terminal.directive.html'),
        scope: {},
        require: ['^insight'],
        controller: terminalCtrl,
        controllerAs: 'terminal',
        bindToController: {
            location: '@', // where is the terminal located workspace, panel, popup, or pipeline
        },
        link: terminalLink,
        replace: true,
    };

    function terminalCtrl($scope) {
        // needs to be overwritten
        $scope.terminal.openFile = (selected: Selected) => {
            console.log(selected);
        }; // when the file is ooened (for terminal-file)
        $scope.terminal.updateFile = (selected: Selected) => {
            console.log(selected);
        }; // when the file is updated (for terminal-file)
        $scope.terminal.selectFile = (selected: Selected) => {
            console.log(selected);
        }; // when the file is selected (for terminal-browser)
    }

    function terminalLink(scope, ele, attrs, ctrl) {
        let resizeTimer: ng.IPromise<any>,
            terminalBrowserEle: HTMLElement,
            terminalFileEle: HTMLElement,
            terminalConsoleEle: HTMLElement,
            terminalContentEle: HTMLElement;
        const SPACING_SIZE = '8px';

        scope.insightCtrl = ctrl[0];

        scope.terminal.upload = {
            open: false,
            flow: undefined,
            comment: '',
        };

        scope.terminal.save = {
            open: false,
            name: '',
            comment: '',
            selected: {},
        };

        scope.terminal.title = '';

        scope.terminal.updateTerminalMode = updateTerminalMode;
        scope.terminal.updateTerminalView = updateTerminalView;
        scope.terminal.addTerminalPanel = addTerminalPanel;
        scope.terminal.closeTerminal = closeTerminal;
        scope.terminal.openUpload = openUpload;
        scope.terminal.closeUpload = closeUpload;
        scope.terminal.saveUpload = saveUpload;
        scope.terminal.openSave = openSave;
        scope.terminal.closeSave = closeSave;
        scope.terminal.saveSave = saveSave;

        /**
         * @name updateTerminalMode
         * @desc update the mode of the editor
         * @param mode - mode to update
         */
        function updateTerminalMode(mode: string): void {
            // update it
            scope.terminal.options.mode = mode;

            // save it
            if (
                scope.terminal.location === 'workspace' ||
                scope.terminal.location === 'popup'
            ) {
                scope.insightCtrl.emit('change-workspace-terminal-options', {
                    mode: mode,
                });
            }
        }

        /**
         * @name updateTerminalView
         * @desc change the terminal type
         * @param view - set the view
         */
        function updateTerminalView(view: string): void {
            // update it
            scope.terminal.options.view = view;

            // save it
            if (
                scope.terminal.location === 'workspace' ||
                scope.terminal.location === 'popup'
            ) {
                scope.insightCtrl.emit('change-workspace-terminal-options', {
                    view: scope.terminal.options.view,
                });
            }
        }

        /**
         * @name addTerminalPanel
         * @desc add a panel to the current sheet
         * @param $event - DOM event
         */
        function addTerminalPanel($event: KeyboardEvent): void {
            let panelId: number = scope.insightCtrl.getShared('panelCounter'),
                worksheet = scope.insightCtrl.getWorkbook('worksheet'),
                pixelComponents: any = [];

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
                    components: ['terminal'],
                    terminal: true,
                },
            ]);

            // execute the pixel
            scope.insightCtrl.execute(pixelComponents, () => {
                closeTerminal();
            });
        }

        /**
         * @name closeTerminal
         * @desc close the terminal
         */
        function closeTerminal(): void {
            // close it
            scope.terminal.options.open = false;

            if (
                scope.terminal.location === 'workspace' ||
                scope.terminal.location === 'popup'
            ) {
                scope.insightCtrl.emit('close-workspace-terminal');
            }
        }

        /**
         * @name openUpload
         * @desc open the upload modal
         * @param flow - newly added file
         */
        function openUpload(flow: any): void {
            if (flow && flow.file) {
                $timeout(function () {
                    scope.terminal.upload.flow.addFile(flow.file);
                });
            }

            scope.terminal.upload = {
                open: true,
                flow: undefined,
                comment: `Uploading at ${new Date().toLocaleString('en-US')}`,
            };
        }

        /**
         * @name closeUpload
         * @desc open the upload modal
         */
        function closeUpload(): void {
            scope.terminal.upload = {
                open: false,
                flow: undefined,
                comment: '',
            };
        }

        /**
         * @name saveUpload
         * @desc actually perform the upload
         */
        function saveUpload(): void {
            let path = '',
                space = '';

            if (scope.terminal.upload.flow.files.length === 0) {
                scope.insightCtrl.alert(
                    'warn',
                    'Please select files to upload.'
                );
                return;
            }

            if (!scope.terminal.upload.comment) {
                scope.insightCtrl.alert(
                    'warn',
                    'Please include a comment to describe your newly added file(s).'
                );
                return;
            }

            semossCoreService.emit('start-polling', {
                id: scope.insightCtrl.insightID,
                listeners: [scope.insightCtrl.insightID],
            });

            scope.$broadcast('browser--get', function (p: string) {
                path = p;
            });

            if (path.length > 0) {
                path += '/';
            }

            scope.$broadcast(
                'browser-asset--get-workspace',
                function (s: string) {
                    space = s;
                }
            );

            monolithService
                .uploadFile(
                    scope.terminal.upload.flow.files,
                    scope.insightCtrl.insightID,
                    space,
                    path
                )
                .then(
                    function (upload) {
                        const components: PixelCommand[] = [];

                        semossCoreService.emit('stop-polling', {
                            id: scope.insightCtrl.insightID,
                            listeners: [scope.insightCtrl.insightID],
                        });

                        for (
                            let uploadIdx = 0, uploadLen = upload.length;
                            uploadIdx < uploadLen;
                            uploadIdx++
                        ) {
                            components.push({
                                meta: true,
                                type: 'Pixel',
                                components: [
                                    `CommitAsset(filePath=["${`${path}${upload[uploadIdx].fileName}`}"], comment=["${
                                        scope.terminal.upload.comment
                                    }"], space=[${space ? `"${space}"` : ''}])`,
                                ],
                                terminal: true,
                            });
                        }

                        if (components.length === 0) {
                            // close
                            closeUpload();

                            // rerender
                            scope.$broadcast('browser--render');

                            return;
                        }

                        const callback = function (
                            response: PixelReturnPayload
                        ) {
                            const type =
                                response.pixelReturn[0].operationType[0];

                            if (type.indexOf('ERROR') > -1) {
                                return;
                            }

                            // close
                            closeUpload();

                            // rerender
                            scope.$broadcast('browser--render');
                        };

                        scope.insightCtrl.meta(components, callback);
                    },
                    function (error) {
                        semossCoreService.emit('stop-polling', {
                            id: scope.insightCtrl.insightID,
                            listeners: [scope.insightCtrl.insightID],
                        });

                        scope.insightCtrl.alert(
                            'error',
                            error.data.errorMessage
                        );
                    }
                );
        }

        /**Save */
        /**
         * @name openSave
         * @desc open the save modal
         */
        function openSave(selected: Selected): void {
            let name = '';

            if (selected.new) {
                name = `${selected.name}.${selected.ext}`;
            } else {
                name = selected.name;
            }

            scope.terminal.save = {
                open: true,
                name: name,
                comment: `Saving at ${new Date().toLocaleString('en-US')}`,
                selected: selected,
            };
        }

        /**
         * @name closeSave
         * @desc close the save modal
         */
        function closeSave(): void {
            scope.terminal.save = {
                open: false,
                name: '',
                comment: '',
                selected: {},
            };
        }

        /**
         * @name saveSave
         * @desc actually perform the save
         */
        function saveSave(): void {
            if (!scope.terminal.save.name) {
                scope.insightCtrl.alert('warn', 'File needs a name.');
                return;
            }

            if (!scope.terminal.save.comment) {
                scope.insightCtrl.alert(
                    'warn',
                    'Please include a comment to describe your changes.'
                );
                return;
            }

            let path = '';
            const callback = function (response: PixelReturnPayload) {
                const type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // update the info
                scope.terminal.updateFile({
                    new: false,
                    name: scope.terminal.save.name,
                    path: path,
                    content: scope.terminal.save.selected.updated,
                });

                // re render the directory
                scope.$broadcast('browser--render');

                // close save
                closeSave();
            };

            // if it is new we save it relative
            if (scope.terminal.save.selected.new) {
                scope.$broadcast('browser--get', function (p) {
                    path = p;
                });

                if (path.length > 0) {
                    path += '/';
                }
                path += scope.terminal.save.name;

                scope.$broadcast('browser-asset--get-workspace', function (s) {
                    scope.terminal.save.selected.space = s;
                });
            } else {
                path = scope.terminal.save.selected.path;
            }

            scope.insightCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `SaveAsset(fileName=["${path}"], content=["<encode>${
                                scope.terminal.save.selected.updated
                            }</encode>"], space=[${
                                scope.terminal.save.selected.space
                                    ? `"${scope.terminal.save.selected.space}"`
                                    : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `CommitAsset(filePath=["${path}"], comment=["${
                                scope.terminal.save.comment
                            }"], space=[${
                                scope.terminal.save.selected.space
                                    ? `"${scope.terminal.save.selected.space}"`
                                    : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Updates */
        /**
         * @name updateTerminal
         * @desc called to update when the terminal information changes
         */
        function updateTerminal(): void {
            scope.terminal.options = scope.insightCtrl.getWorkspace('terminal');
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            let browserResizable: any,
                fileResizable: any,
                updatedWorkspaceListener: () => {},
                updatedWorkspaceTerminalListener: () => {};

            // get elements
            terminalContentEle = ele[0].querySelector('#terminal__content');
            terminalBrowserEle = ele[0].querySelector('#terminal__browser');
            terminalFileEle = ele[0].querySelector('#terminal__file');
            terminalConsoleEle = ele[0].querySelector('#terminal__console');

            // set up the resizable
            browserResizable = Resizable({
                available: ['E'],
                unit: '%',
                content: terminalBrowserEle,
                container: terminalContentEle,
                restrict: {
                    minimumWidth: '10%',
                    maximumWidth: '70%',
                },
                on: (
                    top: number,
                    left: number,
                    height: number,
                    width: number
                ) => {
                    // trigger the digest if we wait (to repaint)
                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    resizeTimer = $timeout(function () {
                        $timeout.cancel(resizeTimer);
                    }, 500);
                },
                stop: (
                    top: number,
                    left: number,
                    height: number,
                    width: number
                ) => {
                    terminalFileEle.style.left = `calc(${width}% + ${SPACING_SIZE})`;
                    terminalConsoleEle.style.left = `calc(${width}% + ${SPACING_SIZE})`;

                    // trigger the digest again (to repaint)
                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    resizeTimer = $timeout(function () {
                        $timeout.cancel(resizeTimer);
                    });
                },
            });

            fileResizable = Resizable({
                available: ['S'],
                unit: '%',
                content: terminalFileEle,
                container: terminalContentEle,
                restrict: {
                    minimumHeight: '20%',
                    maximumHeight: '90%',
                },
                on: (
                    top: number,
                    left: number,
                    height: number,
                    width: number
                ) => {
                    // trigger the digest if we wait (to repaint)
                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    resizeTimer = $timeout(function () {
                        $timeout.cancel(resizeTimer);
                    }, 500);
                },
                stop: (
                    top: number,
                    left: number,
                    height: number,
                    width: number
                ) => {
                    terminalConsoleEle.style.height = `calc(${
                        100 - height
                    }% - ${SPACING_SIZE})`;

                    // trigger the digest again (to repaint)
                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    resizeTimer = $timeout(function () {
                        $timeout.cancel(resizeTimer);
                    });
                },
            });

            // add listeners
            if (
                scope.terminal.location === 'workspace' ||
                scope.terminal.location === 'popup'
            ) {
                updatedWorkspaceListener = scope.insightCtrl.on(
                    'updated-workspace',
                    updateTerminal
                );
                updatedWorkspaceTerminalListener = scope.insightCtrl.on(
                    'updated-workspace-terminal',
                    updateTerminal
                );
            }

            scope.$on('$destroy', function () {
                browserResizable.destroy();
                fileResizable.destroy();

                if (
                    scope.terminal.location === 'workspace' ||
                    scope.terminal.location === 'popup'
                ) {
                    updatedWorkspaceListener();
                    updatedWorkspaceTerminalListener();
                }
            });

            // update logic
            if (
                scope.terminal.location === 'workspace' ||
                scope.terminal.location === 'popup'
            ) {
                updateTerminal();
            } else if (scope.terminal.location === 'pipeline') {
                // only thing that matters if it is pipeilne
                scope.terminal.options = {
                    mode: 'asset',
                };
            } else {
                // only thing that matters if it isn't in the workspace
                scope.terminal.options = {
                    mode: 'repl',
                };
            }
        }

        initialize();
    }
}
