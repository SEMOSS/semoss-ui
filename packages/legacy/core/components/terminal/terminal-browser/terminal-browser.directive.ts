'use strict';

import angular from 'angular';

import './terminal-browser.scss';

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
    .module('app.terminal.terminal-browser', [])
    .directive('terminalBrowser', terminalBrowserDirective);

terminalBrowserDirective.$inject = [];

function terminalBrowserDirective() {
    terminalBrowserCtrl.$inject = [];
    terminalBrowserLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./terminal-browser.directive.html'),
        scope: {},
        require: ['^insight', '^terminal'],
        controller: terminalBrowserCtrl,
        controllerAs: 'terminalBrowser',
        bindToController: {},
        link: terminalBrowserLink,
    };

    function terminalBrowserCtrl() {}

    function terminalBrowserLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.terminalCtrl = ctrl[1];

        scope.terminalBrowser.tab = 'Files';
        scope.terminalBrowser.space = {
            selected: 'Insight',
            options: ['Insight', 'Project', 'User'],
            app: {
                options: [],
                selected: '',
            },
        };

        scope.terminalBrowser.flow = undefined;

        scope.terminalBrowser.selected = {};

        scope.terminalBrowser.directory = {
            options: [],
            split: [],
        };

        scope.terminalBrowser.changeTab = changeTab;
        scope.terminalBrowser.openFile = openFile;
        scope.terminalBrowser.selectFile = selectFile;
        scope.terminalBrowser.switchHistory = switchHistory;
        scope.terminalBrowser.cutClipboard = cutClipboard;
        scope.terminalBrowser.copyClipboard = copyClipboard;
        scope.terminalBrowser.pasteClipboard = pasteClipboard;

        /**
         * @name changeTab
         * @desc change the tab and pull accordingly
         * @param tab - new tab to set
         */
        function changeTab(tab: string): void {
            scope.terminalBrowser.tab = tab;
            if (scope.terminalBrowser.tab === 'Files') {
                // should render automatically
            } else if (scope.terminalBrowser.tab === 'History') {
                renderHistory();
            }
        }

        /**
         * @name openFile
         * @desc open a file and view its content
         * @param file - the file to open
         */
        function openFile(file: {
            name: string;
            path: string;
            date: string;
            split: string[];
            space: string;
        }): void {
            const callback = function (response: PixelReturnPayload) {
                let output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (!output) {
                    scope.insightCtrl.alert(
                        'warn',
                        `${file.name} does not have any content`
                    );
                }

                const selected: Selected = {
                    name: file.name,
                    path: file.path,
                    date: file.date,
                    split: file.split,
                    content: output,
                    open: false,
                    history: [],
                    new: false,
                    space: file.space,
                    updated: output,
                    ext: '',
                };

                // get the extension
                const ext = selected.name.split('.').pop();
                if (typeof ext === 'string') {
                    selected.ext = ext.toLowerCase();
                }

                // set the file ext based on the ending.
                if (
                    selected.ext !== 'r' &&
                    selected.ext !== 'py' &&
                    selected.ext !== 'pixel'
                ) {
                    selected.ext = 'pixel';
                }

                // broadcast that file has been opened
                scope.terminalCtrl.openFile(selected);
            };

            scope.insightCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `GetAsset(filePath=["${file.path}"], space=[${
                                file.space ? `"${file.space}"` : ''
                            }]);`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name selectFile
         * @desc select a file
         * @param selected - the selected file
         */
        function selectFile(selected: Selected) {
            scope.terminalBrowser.selected = selected;

            if (scope.terminalBrowser.tab === 'History') {
                renderHistory();
            }
        }

        /**
         * @name renderHistory
         * @desc render the history of a file
         */
        function renderHistory(): void {
            const selected: Selected = scope.terminalBrowser.selected;

            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                // get the coments
                if (
                    type.indexOf('ERROR') > -1 ||
                    type.indexOf('WARNING') > -1
                ) {
                    return;
                }

                selected.history = output;

                // message for other components
                scope.terminalCtrl.updateFile({
                    history: output,
                });
            };

            scope.insightCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `GetAssetComment(filePath=["${
                                selected.path
                            }"], space=[${
                                selected.space ? `"${selected.space}"` : ''
                            }]);`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name switchHistory
         * @desc switch the file to a new commit
         * @param step - step to switch to
         */
        function switchHistory(step: any): void {
            const selected: Selected = scope.terminalBrowser.selected;

            const callback = function (response: PixelReturnPayload) {
                let output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (!output) {
                    scope.insightCtrl.alert(
                        'warn',
                        `${selected.name} does not have any content`
                    );
                    return;
                }

                selected.updated = output;

                // message for other components
                scope.terminalCtrl.updateFile({
                    updated: output,
                });
            };

            scope.insightCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `GetAsset(filePath=["${
                                selected.path
                            }"], version=["${step.id}"], space=[${
                                selected.space ? `"${selected.space}"` : ''
                            }]);`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Clipboard */

        /**
         * @name cutClipboard
         * @desc cut the file and save it in the clipboard
         */
        function cutClipboard(): void {
            const selected: Selected = scope.terminalBrowser.selected;

            scope.insightCtrl.meta([
                {
                    meta: true,
                    type: 'Pixel',
                    components: [
                        `CtrlXAsset(filePath=["${selected.path}"], space=[${
                            selected.space ? `"${selected.space}"` : ''
                        }])`,
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name copyClipboard
         * @desc copy the file and save it in the clipboard
         */
        function copyClipboard(): void {
            const selected: Selected = scope.terminalBrowser.selected;

            scope.insightCtrl.meta([
                {
                    meta: true,
                    type: 'Pixel',
                    components: [
                        `CtrlCAsset(filePath=["${selected.path}"], space=[${
                            selected.space ? `"${selected.space}"` : ''
                        }])`,
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name pasteClipboard
         * @desc paste the file
         */
        function pasteClipboard(): void {
            let path = '',
                space = '';

            scope.$broadcast('browser--get', function (p) {
                path = p;
            });

            scope.$broadcast('browser-asset--get-workspace', function (s) {
                space = s;
            });

            const callback = function (response: PixelReturnPayload) {
                let type = response.pixelReturn[0].operationType[0];

                type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.$broadcast('browser--render');
            };

            scope.insightCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `CtrlVAsset(filePath=["${path}"], space=[${
                                space ? `"${space}"` : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize(): void {
            // overwrite
            scope.terminalCtrl.selectFile = selectFile;

            // cleanup
            scope.$on('$destroy', function () {
                scope.terminalCtrl.selectFile = (selected: Selected) => {
                    console.log(selected);
                }; // reset
            });
        }

        initialize();
    }
}
