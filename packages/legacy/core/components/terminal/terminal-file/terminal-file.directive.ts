'use strict';

import angular from 'angular';

import './terminal-file.scss';

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
    .module('app.terminal.terminal-file', [])
    .directive('terminalFile', terminalFileDirective);

terminalFileDirective.$inject = ['$timeout'];

function terminalFileDirective($timeout) {
    terminalFileCtrl.$inject = [];
    terminalFileLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./terminal-file.directive.html'),
        scope: {},
        require: ['^insight', '^terminal', '?^pipelineComponent'],
        controller: terminalFileCtrl,
        controllerAs: 'terminalFile',
        bindToController: {},
        link: terminalFileLink,
    };

    function terminalFileCtrl() {}

    function terminalFileLink(scope, ele, attrs, ctrl) {
        let ace, editorEle: HTMLElement, editor, editorTimeout;

        scope.insightCtrl = ctrl[0];
        scope.terminalCtrl = ctrl[1];
        scope.pipelineComponentCtrl = ctrl[2];

        scope.terminalFile.files = {
            options: [],
            selected: -1,
        };

        scope.terminalFile.newFile = newFile;
        scope.terminalFile.selectFile = selectFile;
        scope.terminalFile.closeFile = closeFile;
        scope.terminalFile.downloadFile = downloadFile;
        scope.terminalFile.deleteFile = deleteFile;
        scope.terminalFile.runFile = runFile;
        scope.terminalFile.openSave = openSave;
        scope.terminalFile.execute = execute;
        scope.terminalFile.preview = preview;

        /*** General */
        /**
         * @name resetPanel
         * @desc reset the initial options for the panel
         */
        function resetPanel(): void {
            if (scope.terminalCtrl.location === 'pipeline') {
                const parameters =
                    scope.pipelineComponentCtrl.getComponent('parameters');

                // set pipeline's default 'mode' to be editor instead of the default REPL
                scope.terminalCtrl.updateTerminalMode('asset');

                if (parameters.hasOwnProperty('SOURCE')) {
                    if (!parameters.SOURCE.value) {
                        scope.pipelineComponentCtrl.closeComponent();

                        return;
                    }

                    scope.terminalCtrl.title = `Modify Frame: ${parameters.SOURCE.value.name}`;

                    preview(true);
                } else {
                    scope.terminalCtrl.title = 'Create Frame';
                }

                if (
                    parameters.FILES &&
                    parameters.FILES.value &&
                    Object.keys(parameters.FILES.value).length > 0
                ) {
                    scope.terminalFile.files = parameters.FILES.value;
                    selectFile(scope.terminalFile.files.selected);
                } else {
                    newFile();

                    if (parameters.CODE && parameters.CODE.value) {
                        let script = parameters.CODE.value;
                        // check to see if script starts with Py or R, if so we know to do a regex match for the script inside <encode> </encode>
                        if (
                            /^Py\s*\(/.test(parameters.CODE.value) ||
                            /^R\s*\(/.test(parameters.CODE.value)
                        ) {
                            // || /^Command\s*\(/.test(parameters.CODE.value))) {
                            const matchedScript = parameters.CODE.value.match(
                                /<encode>([\s\S]*?)<\/encode>/
                            );
                            script = matchedScript
                                ? matchedScript[1]
                                : parameters.CODE.value;
                        }

                        updateFile({
                            content: script,
                            updated: script,
                        });
                    }
                }

                if (parameters.hasOwnProperty('LANGUAGE')) {
                    if (parameters.LANGUAGE.value) {
                        scope.terminalFile.files.options[
                            scope.terminalFile.files.selected
                        ].ext = parameters.LANGUAGE.value;
                    }
                }
            } else {
                const files = scope.insightCtrl.getWorkspace('terminal.files');
                if (files) {
                    scope.terminalFile.files = files;
                    selectFile(scope.terminalFile.files.selected);
                } else {
                    newFile();
                }
            }
        }

        /*** File */
        /**
         * @name newFile
         * @desc add a new file
         * @param options - options for the script
         */
        function newFile(): void {
            const selected: Selected = {
                name: 'New',
                path: '',
                date: '',
                split: [],
                content: '',
                open: false,
                history: [],
                new: true,
                space: '',
                updated: '',
                ext: 'pixel',
            };

            // add it
            scope.terminalFile.files.options.push(selected);

            selectFile(scope.terminalFile.files.options.length - 1);
        }

        /**
         * @name selectFile
         * @desc select a new file
         * @param idx - idx to select
         */
        function selectFile(idx: number): void {
            scope.terminalFile.files.selected = idx;

            // tell the browser that a new file was selected
            scope.terminalCtrl.selectFile(
                scope.terminalFile.files.options[
                    scope.terminalFile.files.selected
                ] || {}
            );

            // render it
            renderFile();
        }

        /**
         * @name renderFile
         * @desc render the selected file
         * @param file - file to switch from
         */
        function renderFile(): void {
            const selected =
                scope.terminalFile.files.options[
                    scope.terminalFile.files.selected
                ];

            const modelist = ace.require('ace/ext/modelist');

            const mode = modelist.getModeForPath(selected.name).mode;
            if (
                mode === 'pixel' ||
                mode === 'r' ||
                mode === 'python' ||
                mode === 'html'
            ) {
                // || mode === 'shell') {
                editor.session.setMode(mode);
            } else {
                editor.session.setMode('');
            }

            editor.setValue(selected.updated);
        }

        /**
         * @name openFile
         * @desc open a new file (render it or switch to it)
         * @param selected - file to open
         */
        function openFile(selected: Selected): void {
            // select the opened file
            for (
                let optionIdx = 0,
                    optionLen = scope.terminalFile.files.options.length;
                optionIdx < optionLen;
                optionIdx++
            ) {
                if (
                    selected.path ===
                    scope.terminalFile.files.options[optionIdx].path
                ) {
                    // update that file
                    scope.terminalFile.files.options[optionIdx] = selected;

                    selectFile(optionIdx);
                    return;
                }
            }

            // doesn't exist add it
            scope.terminalFile.files.options.push(selected);
            selectFile(scope.terminalFile.files.options.length - 1);
        }

        /**
         * @name closeFile
         * @desc close the selected file
         * @param idx - idx to close
         */
        function closeFile(idx: number): void {
            if (
                scope.terminalFile.files.options[idx].content !==
                scope.terminalFile.files.options[idx].updated
            ) {
                console.warn(
                    'TODO: thrown an error that the content has updated'
                );
            }

            scope.terminalFile.files.options.splice(idx, 1);

            if (scope.terminalFile.files.options.length === 0) {
                newFile();
                return;
            }

            if (scope.terminalFile.files.selected === idx) {
                if (scope.terminalFile.files.options[idx]) {
                    selectFile(idx);
                } else {
                    selectFile(idx - 1);
                }
            }
        }

        /**
         * @name updateFile
         * @desc update an opened file
         * @param selected - file to open
         */
        function updateFile(selected: any): void {
            // update the selected file
            scope.terminalFile.files.options[
                scope.terminalFile.files.selected
            ] = angular.merge(
                {},
                scope.terminalFile.files.options[
                    scope.terminalFile.files.selected
                ],
                selected
            );

            // render it
            renderFile();
        }

        /**
         * @name downloadFile
         * @desc download the file
         */
        function downloadFile(): void {
            const selected: Selected =
                scope.terminalFile.files.options[
                    scope.terminalFile.files.selected
                ];

            if (selected.new) {
                scope.insightCtrl.alert(
                    'warn',
                    `${selected.name} is not saved. It must be saved before downloading.`
                );
                return;
            }

            scope.insightCtrl.execute([
                {
                    meta: true,
                    type: 'Pixel',
                    components: [
                        `DownloadAsset(filePath=["${selected.path}"], space=[${
                            selected.space ? `"${selected.space}"` : ''
                        }])`,
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name deleteFile
         * @desc delete the file
         */
        function deleteFile(): void {
            const selected: Selected =
                scope.terminalFile.files.options[
                    scope.terminalFile.files.selected
                ];

            if (selected.new) {
                scope.insightCtrl.alert(
                    'warn',
                    `${selected.name} is not saved. It must be saved before deleted.`
                );
                return;
            }

            const callback = function (response: PixelReturnPayload) {
                const type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // clsoe the script
                closeFile(scope.terminalFile.files.selected);

                // rerender
                scope.$broadcast('browser--render');
            };

            scope.insightCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `DeleteAsset(filePath=["${
                                selected.path
                            }"], comment=["Deleting ${
                                selected.name
                            }"], space=[${
                                selected.space ? `"${selected.space}"` : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getFilePixel
         * @desc gets pixel code to run based on editor meta data
         * @return the code to run
         */
        function getFilePixel(): string {
            let pixel = '';

            const selected =
                scope.terminalFile.files.options[
                    scope.terminalFile.files.selected
                ];
            if (selected.ext === 'r') {
                if (
                    selected.content !== selected.updated ||
                    !selected.selectedPath
                ) {
                    pixel = `R("<encode>${selected.updated}</encode>")`;
                } else {
                    pixel = `RSource(filePath=["${selected.path}"], space=[${
                        selected.space ? `"${selected.space}"` : ''
                    }])`;
                }
            } else if (selected.ext === 'py') {
                if (
                    selected.content !== selected.updated ||
                    !selected.selectedPath
                ) {
                    pixel = `Py("<encode>${selected.updated}</encode>")`;
                } else {
                    pixel = `PySource(filePath=["${selected.path}"], space=[${
                        selected.space ? `"${selected.space}"` : ''
                    }])`;
                }
                // } else if (selected.ext === 'shell') {
                //         pixel = `Command("${selected.updated}")`;
            } else if (selected.ext === 'pixel') {
                pixel = selected.updated;

                if (
                    selected.content !== selected.updated ||
                    !selected.selectedPath
                ) {
                    pixel = selected.updated;
                } else {
                    pixel = `PixelSource(filePath=["${
                        selected.path
                    }"], space=[${
                        selected.space ? `"${selected.space}"` : ''
                    }])`;
                }
            }

            return pixel;
        }

        /**
         * @name runFile
         * @param visualize - if true, visualize component
         * @desc switch the file to a new commit
         */
        function runFile(visualize: boolean): void {
            const selected =
                scope.terminalFile.files.options[
                    scope.terminalFile.files.selected
                ];

            if (scope.terminalCtrl.location === 'pipeline') {
                execute(visualize);
                return;
            }

            const pixel = getFilePixel();

            if (!pixel) {
                scope.insightCtrl.alert(
                    'warn',
                    `${selected.name} could not be run. Please validate the script.`
                );
                return;
            }

            scope.insightCtrl.execute([
                {
                    type: 'Pixel',
                    components: [pixel],
                    terminal: true,
                },
            ]);
        }

        /*** Editor */
        /**
         * @name initializeEditor
         * @desc initialize the editor that we will use to edit the file
         */
        function initializeEditor(): void {
            editor = ace.edit(editorEle);
            editor.setTheme('ace/theme/chrome');
            editor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
                autoScrollEditorIntoView: true,
                wrap: true,
                useWorker: false,
            });
            // need this to turn off an ace message clogging up console
            editor.$blockScrolling = Infinity;

            // set the mode based on the type of file
            editor.session.setMode(null);

            editor.session.on('change', function () {
                if (editorTimeout) {
                    $timeout(editorTimeout);
                }

                editorTimeout = $timeout(
                    function (selectedIdx) {
                        const selected =
                            scope.terminalFile.files.options[selectedIdx];

                        selected.updated = editor.getValue();
                    }.bind(null, scope.terminalFile.files.selected),
                    300
                );
            });

            // add commands
            editor.commands.addCommand({
                name: 'Ctrl-Enter',
                bindKey: {
                    win: 'Ctrl-Enter',
                    mac: 'Command-Enter',
                },
                exec: function () {
                    if (editorTimeout) {
                        $timeout(editorTimeout);
                    }

                    editorTimeout = $timeout(
                        function (selectedIdx) {
                            const selected =
                                scope.terminalFile.files.options[selectedIdx];

                            selected.updated = editor.getValue();

                            runFile(false);
                        }.bind(null, scope.terminalFile.files.selected),
                        300
                    );
                },
            });

            $timeout(() => {
                // there is a bug need to call resize manually
                editor.resize(true);

                editor.focus();
            });
        }

        /*** Save */
        /**
         * @name openSave
         * @desc open the save modal
         */
        function openSave(): void {
            const selected =
                scope.terminalFile.files.options[
                    scope.terminalFile.files.selected
                ];

            // open with a broadcast
            scope.terminalCtrl.openSave(selected);
        }

        /**
         * @name keyDownSave
         * @desc open the save modal
         */
        function keyDownSave($event: KeyboardEvent): void {
            if (!($event.keyCode === 83 && $event.ctrlKey)) {
                return;
            }

            $event.stopPropagation();
            $event.preventDefault();

            openSave();

            $timeout();
        }

        /** Pipeline */
        /**
         * @name execute
         * @param  visualize -  if true, visualize component
         * @desc runs logic to execute in pipeline
         */
        function execute(visualize: boolean): void {
            const parameters = buildParameters();

            let callback;
            if (visualize) {
                callback = scope.pipelineComponentCtrl.visualizeComponent;
            }

            scope.pipelineComponentCtrl.executeComponent(
                parameters,
                {},
                callback
            );
        }

        /**
         * @name preview
         * @param initial - if true, first preivew just do it
         * @desc previews component
         */
        function preview(initial: boolean): void {
            let parameters = {};

            if (!initial) {
                parameters = buildParameters();
            }

            scope.pipelineComponentCtrl.previewComponent(parameters, {});
        }

        /**
         * @name getFrame
         * @param accessor - what to access on frame object
         * @desc gets the component frame and desired properties
         * @return frame data
         */
        function getFrame(accessor?: string): any {
            return scope.pipelineComponentCtrl.getComponent(
                accessor
                    ? 'parameters.SOURCE.value.' + accessor
                    : 'parameters.SOURCE.value'
            );
        }

        /**
         * @name buildParameters
         * @desc build parameters for the component
         * @return {object} params
         */
        function buildParameters(): {
            SOURCE?: any;
            CODE: string;
            FILES: any[];
        } {
            const parameters: {
                SOURCE?: any;
                CODE: string;
                FILES: any[];
                LANGUAGE: string;
            } = {
                CODE: getFilePixel(),
                FILES: scope.terminalFile.script,
                LANGUAGE:
                    scope.terminalFile.files.options[
                        scope.terminalFile.files.selected
                    ].ext,
            };

            // add the source if it is there
            const frame = getFrame();
            if (frame) {
                parameters.SOURCE = frame;
            }

            return parameters;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize(): void {
            editorEle = ele[0].querySelector('#terminal-file__content__editor');

            scope.$watch(
                function () {
                    return editorEle.offsetHeight + '-' + editorEle.offsetWidth;
                },
                function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        if (editor) {
                            editor.resize(true);
                        }
                    }
                }
            );

            ele[0].addEventListener('keydown', keyDownSave);

            if (scope.terminalCtrl.location === 'popup') {
                window.addEventListener('beforeunload', () => {
                    scope.insightCtrl.emit(
                        'change-workspace-terminal-options',
                        {
                            files: JSON.parse(
                                JSON.stringify(scope.terminalFile.files)
                            ),
                        }
                    );
                });
            }

            // overwrite
            scope.terminalCtrl.openFile = openFile;
            scope.terminalCtrl.updateFile = updateFile;

            // cleanup
            scope.$on('$destroy', function () {
                ele[0].removeEventListener('keydown', keyDownSave);

                scope.terminalCtrl.title = '';
                scope.terminalCtrl.openFile = (selected: Selected) => {
                    console.log(selected);
                }; // reset
                scope.terminalCtrl.updateFile = (selected: Selected) => {
                    console.log(selected);
                }; //reset

                scope.insightCtrl.emit('change-workspace-terminal-options', {
                    files: JSON.parse(JSON.stringify(scope.terminalFile.files)),
                });
            });

            import(
                /* webpackChunkName: "ace"  */ /* webpackPrefetch: true */ '../ace'
            )
                .then((module) => {
                    ace = module.ace;

                    // initialize the editor
                    initializeEditor();

                    // reset the panel
                    resetPanel();
                })
                .catch((err) => {
                    console.error('Error: ', err);
                });
        }

        initialize();
    }
}
