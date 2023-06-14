'use strict';

import angular from 'angular';

import './terminal-console.scss';

export default angular
    .module('app.terminal.terminal-console', [])
    .directive('terminalConsole', terminalConsoleDirective);

terminalConsoleDirective.$inject = ['$window', '$timeout', 'semossCoreService'];

function terminalConsoleDirective($window, $timeout, semossCoreService) {
    terminalConsoleCtrl.$inject = [];
    terminalConsoleLink.$inject = ['scope'];

    return {
        restrict: 'EA',
        template: require('./terminal-console.directive.html'),
        scope: {},
        require: ['^insight'],
        controller: terminalConsoleCtrl,
        controllerAs: 'terminalConsole',
        bindToController: {},

        link: terminalConsoleLink,
    };

    function terminalConsoleCtrl() {}

    function terminalConsoleLink(scope, ele, attrs, ctrl) {
        let AsciiTable,
            ace,
            editorEle: HTMLElement,
            editor,
            editorAutoComplete,
            editorLanguageTools,
            editorRange,
            editorPixelCompleter;

        const TOKENS = {
            ACTIONS: [
                'clear',
                'r',
                'p',
                'j',
                'multi',
                'raw',
                'R',
                'J',
                'P',
                '%r',
                '%p',
                '%j',
                '%R',
                '%J',
                '%P',
            ],
            CONTEXT: {
                PIXEL: 'Pixel',
                R: 'R',
                PYTHON: 'Python',
                SHELL: 'Shell',
            },
        };

        scope.insightCtrl = ctrl[0];

        // general
        scope.terminalConsole.frames = [];

        // state
        scope.terminalConsole.state = {}; // populated later

        // history
        scope.terminalConsole.history = {
            steps: [],
            step: '', // current step
            rows: {}, // map row to step
        };

        // input
        scope.terminalConsole.input = {
            // track where the input starts
            row: 0,
            column: 0,
        };

        // toolbar
        scope.terminalConsole.advanced = {
            refresh: '',
            variable: '',
        };

        scope.terminalConsole.changeState = changeState;
        scope.terminalConsole.changeContext = changeContext;
        scope.terminalConsole.changeWordWrap = changeWordWrap;
        scope.terminalConsole.refreshFrameHeaders = refreshFrameHeaders;
        scope.terminalConsole.generateFrameFromVariable =
            generateFrameFromVariable;
        scope.terminalConsole.copy = copy;
        scope.terminalConsole.execute = execute;

        /** * General */
        /**
         * @name resetPanel
         * @desc reset the initial options for the panel
         */
        function resetPanel(): void {
            // update the frame data
            updateFrame();
        }

        /** * Frame */
        /**
         * @name updateFrame
         * @desc update frame options
         */
        function updateFrame(): void {
            const frames = scope.insightCtrl.getShared('frames') || {};

            scope.terminalConsole.frames = [];
            for (const frame in frames) {
                if (frames.hasOwnProperty(frame)) {
                    scope.terminalConsole.frames.push(frames[frame].name);
                }
            }
        }

        /** * State */
        /**
         * @name updateState
         * @desc state has changed update it
         */
        function updateState(): void {
            scope.terminalConsole.state = angular.merge(
                {},
                {
                    context: TOKENS.CONTEXT.PIXEL,
                    rawOutput: false,
                    maxRecords: 10,
                    executeOnEnter: true,
                    wordWrap: false,
                },
                scope.insightCtrl.getOptions('terminal-console') || {}
            );
        }

        /**
         * @name changeState
         * @desc state has changed update it
         */
        function changeState(): void {
            scope.insightCtrl.setOptions(
                'terminal-console',
                scope.terminalConsole.state
            );
        }

        /**
         * @name changeContext
         * @desc update the context
         * @param context - context to switch to
         */

        function changeContext(context: string): void {
            scope.terminalConsole.state.context = context;

            // update the history + display
            // for (const row in scope.terminalConsole.history.rows) {
            //     if (scope.terminalConsole.history.rows.hasOwnProperty(row)) {
            //         const step = scope.terminalConsole.history.steps[scope.terminalConsole.history.rows[row]];

            //         if (step.executed) {
            //             // get the new input
            //             const input = extractContext(step.expression);
            //             // update the history
            //             step.context = (input !== step.expression) ? scope.terminalConsole.state.context : TOKENS.CONTEXT.PIXEL;
            //             step.input = input;

            //             // update the display
            //             editor.session.replace(new editorRange(row, 0, row, Infinity), input);
            //         } else {
            //             step.context = scope.terminalConsole.state.context;
            //         }
            //     }
            // }
            // editor.session.replace errors out when we have super long scripts...so we'll just wipe and then fill the editor content again via updateEditor
            updateEditor();

            if (scope.terminalConsole.state.context === TOKENS.CONTEXT.PIXEL) {
                editorLanguageTools.setCompleters([
                    editorLanguageTools.snippetCompleter,
                    editorLanguageTools.textCompleter,
                    editorLanguageTools.keyWordCompleter,
                    editorPixelCompleter,
                ]);
                editor.session.setMode('ace/mode/pixel');
                editor.setOptions({
                    enableLiveAutocompletion: false,
                });
            } else {
                let modeName =
                    scope.terminalConsole.state.context.toLowerCase();
                if (modeName === 'shell') {
                    // ace doesnt come with a 'git' mode so we will just use their standard text mode instead of trying to create our own mode
                    modeName = 'text';
                }
                editorLanguageTools.setCompleters([
                    editorLanguageTools.snippetCompleter,
                    editorLanguageTools.textCompleter,
                    editorLanguageTools.keyWordCompleter,
                ]);
                editor.session.setMode('ace/mode/' + modeName);
                editor.setOptions({
                    enableLiveAutocompletion: true,
                });
            }

            // save it
            changeState();

            // focus on the console
            editor.focus();
        }

        /**
         * @name extractContext
         * @desc extract from the input based on the context
         * @param input - pixel input
         * @returns updated input
         */
        function extractContext(input: string): string {
            let cleaned = input;

            if (scope.terminalConsole.state.context === TOKENS.CONTEXT.PIXEL) {
                // noop
            } else if (
                scope.terminalConsole.state.context === TOKENS.CONTEXT.R &&
                ((cleaned.search(/^(<j>(\s+)?<encode>(\s+)?runR\(\")/) > -1 &&
                    cleaned.search(
                        /(\"\);(\s+)?<\/encode>(\s+)?<\/j>(\s+)?);$/
                    ) > -1) ||
                    (cleaned.search(/^R(\s+)?\((\s+)?\"(\s+)?<encode>(\s+)?/) >
                        -1 &&
                        cleaned.search(
                            /(\s+)?<\/encode>(\s+)?(\")(\s+)?\)(\s+)?;$/
                        ) > -1))
            ) {
                // remove front
                cleaned = cleaned.replace(
                    /^(<j>(\s+)?<encode>(\s+)?runR\(\")/,
                    ''
                );
                // remove back
                cleaned = cleaned.replace(
                    /(\"\);(\s+)?<\/encode>(\s+)?<\/j>(\s+)?);$/,
                    ''
                );

                // clean the new syntax R("<encode>2+2</encode>");
                cleaned = cleaned.replace(
                    /^R(\s+)?\((\s+)?\"(\s+)?<encode>(\s+)?/,
                    ''
                );
                cleaned = cleaned.replace(
                    /(\s+)?<\/encode>(\s+)?(\")(\s+)?\)(\s+)?;$/,
                    ''
                );
            } else if (
                scope.terminalConsole.state.context === TOKENS.CONTEXT.PYTHON &&
                cleaned.search(/^Py(\s+)?\((\s+)?\"(\s+)?<encode>(\s+)?/) >
                    -1 &&
                cleaned.search(/(\s+)?<\/encode>(\s+)?(\")(\s+)?\)(\s+)?;$/) >
                    -1
            ) {
                // clean the new syntax Py("<encode>2+2</encode>");
                cleaned = cleaned.replace(
                    /^Py(\s+)?\((\s+)?\"(\s+)?<encode>(\s+)?/,
                    ''
                );
                cleaned = cleaned.replace(
                    /(\s+)?<\/encode>(\s+)?(\")(\s+)?\)(\s+)?;$/,
                    ''
                );
            } else if (
                scope.terminalConsole.state.context === TOKENS.CONTEXT.SHELL &&
                cleaned.search(/^Command(\s+)?\((\s+)?\"(\s+)?(\s+)?/) > -1 &&
                cleaned.search(/(\s+)?(\s+)?(\")(\s+)?\)(\s+)?;$/) > -1
            ) {
                // clean the new syntax Command("2+2");
                cleaned = cleaned.replace(
                    /^Command(\s+)?\((\s+)?\"(\s+)?(\s+)?/,
                    ''
                );
                cleaned = cleaned.replace(
                    /(\s+)?(\s+)?(\")(\s+)?\)(\s+)?;$/,
                    ''
                );
                cleaned = cleaned.replace(/\\/g, '');
            }

            return cleaned;
        }

        /**
         * @name addContext
         * @desc add to input based on the context
         * @param input - pixel input
         * @returns updated input
         */
        function addContext(input: string): string {
            let cleaned = input;

            if (scope.terminalConsole.state.context === TOKENS.CONTEXT.PIXEL) {
                cleaned = cleaned.trim();
            } else if (
                scope.terminalConsole.state.context === TOKENS.CONTEXT.R
            ) {
                cleaned = cleaned.trim();
                cleaned = `R("<encode>${cleaned}</encode>");`;
            } else if (
                scope.terminalConsole.state.context === TOKENS.CONTEXT.PYTHON
            ) {
                cleaned = cleaned.trim();
                cleaned = `Py("<encode>${cleaned}</encode>");`;
            } else if (
                scope.terminalConsole.state.context === TOKENS.CONTEXT.SHELL
            ) {
                cleaned = cleaned.trim();
                cleaned = cleaned.replace(/"/g, '\\"');
                cleaned = `Command("${cleaned}");`;
            }

            return cleaned;
        }

        /**
         * @name changeWordWrap
         * @desc toggles word wrap in the editor
         */
        function changeWordWrap(): void {
            // update
            editor
                .getSession()
                .setUseWrapMode(scope.terminalConsole.state.wordWrap);

            // save it
            changeState();
        }

        /** Editor */
        /**
         * @name initializeEditor
         * @desc sets up ace editor
         */
        function initializeEditor(): void {
            editorLanguageTools = ace.require('ace/ext/language_tools');
            editorRange = ace.require('ace/range').Range;
            editorAutoComplete = ace.require('ace/autocomplete').Autocomplete;
            editor = ace.edit(editorEle);
            editor.setTheme('ace/theme/chrome');
            editor.session.setMode('ace/mode/pixel');
            editor.session.setUseWrapMode(scope.terminalConsole.state.wordWrap);
            editor.setOptions({
                enableBasicAutocompletion: true,
                // enableSnippets: true,
                // enableLiveAutocompletion: true,
                autoScrollEditorIntoView: true,
                useWorker: false,
            });
            // need this to turn off an ace message clogging up console
            editor.$blockScrolling = Infinity;

            // this is for the >
            editor.session.gutterRenderer = {
                getWidth: function (session, lastLineNumber, config) {
                    // 9 comes from (Pixel) >
                    return 9 * config.characterWidth;
                },
                getText: function (session, row) {
                    if (
                        scope.terminalConsole.history.rows.hasOwnProperty(row)
                    ) {
                        const step =
                            scope.terminalConsole.history.steps[
                                scope.terminalConsole.history.rows[row]
                            ];
                        return `(${step.context}) >`;
                    }

                    return '';
                },
            };

            // we want to turn off auto selecting first option and making it more precise on matching for autocomplete
            editor.commands.on('afterExec', ({ command, editor }) => {
                const hasCompleter =
                    editor.completer && editor.completer.activated;

                if (command.name === 'insertstring' && !hasCompleter) {
                    const completer = editorAutoComplete.for(editor);

                    completer.autoSelect = false;
                    completer.exactMatch = true;

                    completer.keyboardHandler.bindKey('Tab', (editor) => {
                        editor.completer.goTo('down');
                    });

                    completer.keyboardHandler.bindKey('Shift-Tab', (editor) => {
                        editor.completer.goTo('up');
                    });

                    completer.showPopup(editor);
                }
            });

            // add commands
            editor.commands.addCommand({
                name: 'Ctrl-A',
                bindKey: {
                    win: 'Ctrl-A',
                    mac: 'Command-A',
                },
                exec: function () {
                    const row = editor.session.getLength() - 1,
                        col = editor.session.getLine(row).length;

                    editor.selection.setRange(
                        {
                            start: {
                                row: scope.terminalConsole.input.row,
                                column: scope.terminalConsole.input.column,
                            },
                            end: {
                                row: row,
                                column: col,
                            },
                        },
                        false
                    );
                },
            });
            editor.commands.addCommand({
                name: 'Ctrl-Enter',
                bindKey: {
                    win: 'Ctrl-Enter',
                },
                exec: onEditorEnter.bind(null, true),
            });
            editor.commands.addCommand({
                name: 'Enter',
                bindKey: {
                    win: 'Enter',
                    mac: 'Enter',
                },
                exec: onEditorEnter.bind(null, false),
            });
            editor.commands.addCommand({
                name: 'Ctrl-Up',
                bindKey: {
                    win: 'Ctrl-Up',
                    mac: 'Command-Up',
                },
                exec: onEditorUp.bind(null, true),
            });
            editor.commands.addCommand({
                name: 'Up',
                bindKey: {
                    win: 'Up',
                    mac: 'Up',
                },
                exec: onEditorUp.bind(null, false),
            });
            editor.commands.addCommand({
                name: 'Ctrl-Down',
                bindKey: {
                    win: 'Ctrl-Down',
                    mac: 'Command-Down',
                },
                exec: onEditorDown.bind(null, true),
            });
            editor.commands.addCommand({
                name: 'Down',
                bindKey: {
                    win: 'Down',
                    mac: 'Down',
                },
                exec: onEditorDown.bind(null, false),
            });
            editor.commands.addCommand({
                name: 'Esc',
                bindKey: {
                    win: 'Esc',
                    mac: 'Esc',
                },
                exec: function () {
                    const updated = editor.session.getTextRange({
                        start: {
                            row: 0,
                            column: 0,
                        },
                        end: {
                            row: scope.terminalConsole.input.row,
                            column: scope.terminalConsole.input.column,
                        },
                    });

                    editor.setValue(updated);

                    // go to that line
                    editor.gotoLine(editor.session.getLength(), Infinity);
                },
            });

            // anytime a user starts trying to input text, need to make sure they are not on a read only part of it
            editor.keyBinding.addKeyboardHandler({
                handleKeyboard: function (data, hash, keyString, keyCode) {
                    const range = editor.getSelectionRange();

                    // block these special scenarios
                    // pulled from https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts
                    if (
                        (hash === 1 && keyCode === 68) ||
                        (hash === 8 && keyCode === 68) || // Remove line
                        (hash === 6 && keyCode === 40) ||
                        (hash === 10 && keyCode === 40) || // Copy lines down
                        (hash === 6 && keyCode === 38) ||
                        (hash === 10 && keyCode === 38) || // Copy lines up
                        (hash === 2 && keyCode === 40) || // Copy lines down
                        (hash === 2 && keyCode === 38) || // Copy lines up
                        (hash === 1 && keyCode === 8) ||
                        (hash === 2 && keyCode === 8) ||
                        (hash === 3 && keyCode === 8) || // Remove word left
                        (hash === 3 && keyCode === 38) || // Add multi-cursor above
                        (hash === 3 && keyCode === 40) || // Add multi-cursor below
                        (hash === 3 && keyCode === 37) || // Add next occurrence to multi-selection
                        (hash === 3 && keyCode === 39) || // Add previous occurrence to multi-selection
                        (hash === 7 && keyCode === 38) || // Move multicursor from current line to the line above
                        (hash === 7 && keyCode === 40) || // Move multicursor from current line to the line below
                        (hash === 7 && keyCode === 37) || // Remove current occurrence from multi-selection and move to next
                        (hash === 7 && keyCode === 39) || // Remove current occurrence from multi-selection and move to previous
                        (hash === 5 && keyCode === 76) || // Select all from multi-selection
                        (hash === 1 && keyCode === 72) ||
                        (hash === 10 && keyCode === 70) || // Replace
                        (hash === 1 && keyCode === 188) ||
                        (hash === 8 && keyCode === 188) || // Show the settings menu
                        (hash === 5 && keyCode === 69) ||
                        (hash === 12 && keyCode === 69) || // Macros replay
                        (hash === 3 && keyCode === 69) // Macros recording
                    ) {
                        return {
                            command: 'null',
                            passEvent: false,
                        };
                    }

                    // we are behind, so only allow on special scenarios
                    if (
                        range.start.row < scope.terminalConsole.input.row ||
                        (range.start.row === scope.terminalConsole.input.row &&
                            range.start.column <
                                scope.terminalConsole.input.column)
                    ) {
                        if (
                            !(
                                (
                                    (hash === 1 && keyCode === 67) ||
                                    (hash === 8 && keyCode === 67) || // Copy - 1: ctrl [Windows], 8: cmd [Mac]
                                    keyCode === 37 || // left
                                    keyCode === 39 || // right
                                    keyCode === 38 || // top
                                    keyCode === 40 || // bottom
                                    (hash === 1 && keyCode === 65) || // Select All
                                    (hash === 4 && keyCode === 37) || // Select Left
                                    (hash === 4 && keyCode === 39) || // Select Right
                                    (hash === 5 && keyCode === 38) ||
                                    (hash === 6 && keyCode === 38) || // Select word left
                                    (hash === 5 && keyCode === 40) ||
                                    (hash === 6 && keyCode === 40) || // Select word right
                                    (hash === 4 && keyCode === 36) || // Select line start
                                    (hash === 4 && keyCode === 35) || // Select line end
                                    (hash === 6 && keyCode === 40) ||
                                    (hash === 12 && keyCode === 40) || // Select to line end
                                    (hash === 6 && keyCode === 38) ||
                                    (hash === 12 && keyCode === 38) || // Select to line start
                                    (hash === 4 && keyCode === 38) || // Select up
                                    (hash === 4 && keyCode === 40) || // Select down
                                    (hash === 4 && keyCode === 33) || // Select page up
                                    (hash === 4 && keyCode === 34) || // Select page down
                                    (hash === 5 && keyCode === 36) ||
                                    (hash === 12 && keyCode === 38) || // Select to line end
                                    (hash === 5 && keyCode === 35) ||
                                    (hash === 12 && keyCode === 40) || // Select to line start
                                    (hash === 5 && keyCode === 68) ||
                                    (hash === 12 && keyCode === 68) || // Duplicate selection
                                    (hash === 5 && keyCode === 80) || // Select to matching bracket
                                    keyCode === 13
                                ) // Enter (caught by something else)
                            )
                        ) {
                            return {
                                command: 'null',
                                passEvent: false,
                            };
                        }
                    }

                    // on the last character
                    if (
                        range.start.row === scope.terminalConsole.input.row &&
                        range.start.column ===
                            scope.terminalConsole.input.column
                    ) {
                        // null if nothing is selected
                        if (
                            range.start.row === range.end.row &&
                            range.start.column === range.end.column
                        ) {
                            if (
                                keyCode === 8 // backspace
                            ) {
                                return {
                                    command: 'null',
                                    passEvent: false,
                                };
                            }
                        }
                    }

                    return true;
                },
            });

            // get the pixel completer
            // lets not have to type this every time we want to access ace
            const callback = function (response: PixelReturnPayload) {
                const type = response.pixelReturn[0].operationType,
                    output = response.pixelReturn[0].output;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                let reactors = output.replace(/(\s\s)+/g, '  ').split('  '),
                    currentCategory,
                    reactorAutoComplete: {
                        name: string;
                        value: string;
                        meta: string;
                        score: number;
                    }[] = [];

                for (
                    let reactorIdx = 0, reactorLen = reactors.length;
                    reactorIdx < reactorLen;
                    reactorIdx++
                ) {
                    const reactor = reactors[reactorIdx].trim();
                    if (reactor[reactor.length - 1] === ':') {
                        currentCategory = reactor.substring(
                            0,
                            reactor.length - 1
                        );
                    } else {
                        reactorAutoComplete.push({
                            name: reactor,
                            value: reactor + '()',
                            meta: currentCategory,
                            score: 0,
                        });
                    }
                }

                editorPixelCompleter = {
                    id: 'pixel',
                    getCompletions: function (e, s, p, pre, cb) {
                        cb(null, reactorAutoComplete);
                    },
                };

                // set the completer if the state is pixel
                if (
                    scope.terminalConsole.state.context === TOKENS.CONTEXT.PIXEL
                ) {
                    editorLanguageTools.setCompleters([
                        editorLanguageTools.snippetCompleter,
                        editorLanguageTools.textCompleter,
                        editorLanguageTools.keyWordCompleter,
                        editorPixelCompleter,
                    ]);
                }
            };

            scope.insightCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: ['help()'],
                        terminal: true,
                        meta: true,
                    },
                ],
                callback
            );

            updateEditor();

            $timeout(() => {
                // there is a bug need to call resize manually
                editor.resize(true);

                editor.focus();

                scrollCursorIntoView(editor);
            });
        }

        /**
         * @name updateEditor
         * @desc update the editor with pieces from the store
         */
        function updateEditor(): void {
            // clear out steps
            scope.terminalConsole.history.steps = [];
            scope.terminalConsole.history.rows = {};

            // clear out the editor
            editor.setValue('');

            // set the initial data
            const steps = scope.insightCtrl.getShared('steps');

            if (steps) {
                for (
                    let stepIdx = 0, stepLen = steps.length;
                    stepIdx < stepLen;
                    stepIdx++
                ) {
                    const step = steps[stepIdx];

                    // process the step
                    processStep(step.expression, step.output, step.type[0]);
                }
            }

            // create a new line
            resetEditor();

            // focus on the editor
            editor.focus();
        }

        /**
         * @name resetEditor
         * @desc puts the cursor at the end of the prompt and reset input
         */
        function resetEditor(): void {
            const row = editor.session.getLength() - 1;

            // create a new line
            editor.session.insert(
                {
                    row: row,
                    column: 0,
                },
                ''
            );

            // mark it
            scope.terminalConsole.history.rows[row] =
                scope.terminalConsole.history.steps.length; // we are pusing it later, so this is correct
            scope.terminalConsole.history.step =
                scope.terminalConsole.history.steps.length;

            // add the empty to the history (this is useful for up/down navigation)
            scope.terminalConsole.history.steps.push({
                executed: false,
                expression: '',
                type: '',
                context: scope.terminalConsole.state.context,
                input: '',
                output: '',
            });

            // go to that line
            editor.gotoLine(editor.session.getLength(), Infinity);

            // save the place where we are inputing
            const pos = editor.getCursorPosition();
            scope.terminalConsole.input = {
                row: pos.row,
                column: pos.column,
            };

            editor.renderer.scrollCursorIntoView({
                row: pos.row,
                column: pos.column,
            });
        }

        /**
         * @name onEditorEnter
         * @desc up action for the editor
         * @param ctrl - was the ctrl button clicked?
         */
        function onEditorEnter(ctrl: boolean): void {
            // check if the position is earlier, bring it back
            const pos = editor.getCursorPosition();
            if (pos.row < scope.terminalConsole.input.row) {
                const range = editor.getSelectionRange(),
                    selected = editor.session.getTextRange(range); // selected text

                let updated = editor.getValue();
                if (selected) {
                    updated += selected;
                }

                editor.setValue(updated);

                // go to the end
                editor.gotoLine(editor.session.getLength(), Infinity);
                return;
            }

            if (
                (!ctrl && !scope.terminalConsole.state.executeOnEnter) ||
                (ctrl && scope.terminalConsole.state.executeOnEnter)
            ) {
                // if it this is true, we create a new line
                editor.splitLine();
                editor.navigateDown(1);
                return;
            }

            const input = getInput();

            if (!input) {
                // noop
            } else if (TOKENS.ACTIONS.indexOf(input) > -1) {
                runAction(input);
            } else {
                execute();
            }
        }

        /**
         * @name onEditorUp
         * @desc up action for the editor
         * @param ctrl - was the ctrl button clicked?
         */
        function onEditorUp(ctrl: boolean): void {
            // check if the position is earlier, do nothing if it is before
            const pos = editor.getCursorPosition();
            if (pos.row < scope.terminalConsole.input.row) {
                if (ctrl) {
                    editor.renderer.scrollBy(
                        0,
                        -2 * editor.renderer.layerConfig.lineHeight
                    );
                } else {
                    editor.navigateUp(1);
                }
                return;
            }

            if (scope.terminalConsole.history.steps.length === 0) {
                return;
            }

            scope.terminalConsole.history.step--;
            if (scope.terminalConsole.history.step < 0) {
                scope.terminalConsole.history.step = 0;
            }

            const replacement =
                scope.terminalConsole.history.steps[
                    scope.terminalConsole.history.step
                ].input;

            // replace the content
            editor.session.replace(
                new editorRange(
                    scope.terminalConsole.input.row,
                    0,
                    scope.terminalConsole.input.row,
                    Infinity
                ),
                replacement
            );

            // scroll to it, the column should be the same
            editor.gotoLine(scope.terminalConsole.input.row + 1, pos.column);
        }

        /**
         * @name onEditorDown
         * @desc down action for the editor
         * @param ctrl - was the ctrl button clicked?
         */
        function onEditorDown(ctrl: boolean): void {
            // check if the position is earlier, do nothing if it is before
            const pos = editor.getCursorPosition();
            if (pos.row < scope.terminalConsole.input.row) {
                if (ctrl) {
                    editor.renderer.scrollBy(
                        0,
                        2 * editor.renderer.layerConfig.lineHeight
                    );
                } else {
                    editor.navigateDown(1);
                }
                return;
            }

            scope.terminalConsole.history.step++;

            if (
                scope.terminalConsole.history.step >
                scope.terminalConsole.history.steps.length - 1
            ) {
                scope.terminalConsole.history.step =
                    scope.terminalConsole.history.steps.length - 1;
            }

            const replacement =
                scope.terminalConsole.history.steps[
                    scope.terminalConsole.history.step
                ].input;

            // replace the content
            editor.session.replace(
                new editorRange(
                    scope.terminalConsole.input.row,
                    0,
                    scope.terminalConsole.input.row,
                    Infinity
                ),
                replacement
            );

            // scroll to it, the column should be the same
            editor.gotoLine(scope.terminalConsole.input.row + 1, pos.column);
        }

        /**
         * @name processStep
         * @desc paints the appropriate step
         * @param expression - expression to paint
         * @param raw - output to paint
         * @param type - type to paint
         * @param initial true if we are initializing the terminal
         */
        function processStep(
            expression: string,
            raw: string,
            type: string
        ): void {
            let row;

            const input = extractContext(expression),
                history = {
                    executed: true,
                    expression: expression,
                    type: type,
                    context:
                        input !== expression
                            ? scope.terminalConsole.state.context
                            : TOKENS.CONTEXT.PIXEL,
                    input: input,
                    output: '',
                };

            if (raw) {
                if (scope.terminalConsole.state.rawOutput) {
                    history.output = String(raw);
                } else if (history.type === 'DATABASE_METAMODEL') {
                    buildDatabaseMetamodel(history, raw);
                } else if (history.type === 'FRAME_HEADERS') {
                    buildFrameHeaders(history, raw);
                } else if (history.type === 'TASK_DATA') {
                    buildTaskData(history, raw);
                } else if (history.type === 'CODE_EXECUTION') {
                    buildCodeExecution(history, raw);
                } else if (history.type === 'HELP') {
                    buildHelp(history, raw);
                } else if (history.type === 'INVALID_SYNTAX') {
                    buildInvalidSyntax(history, raw);
                } else if (history.type === 'ERROR') {
                    buildError(history, raw);
                } else {
                    buildUnknown(history, raw);
                }
            } else {
                history.output = 'No message returned from server';
            }

            // add to editor
            row = editor.session.getLength() - 1;

            // create a new line and add the input
            editor.session.insert(
                {
                    row: row,
                    column: 0,
                },
                `${history.input}\n`
            );

            // mark it
            scope.terminalConsole.history.rows[row] =
                scope.terminalConsole.history.steps.length; // we are pusing it later, so this is correct

            // it has been inserted, get the new row
            row = editor.session.getLength() - 1;

            let message = '';
            if (history.type === 'RECIPE_COMMENT') {
                // add a marker
                editor.session.addMarker(
                    new editorRange(row - 1, 0, row, 0),
                    'terminal-console__content__editor__highlight',
                    'line'
                );
            } else {
                message = `${history.output}\n`;
            }

            if (
                (history.type === 'CODE_EXECUTION' &&
                    history.output === 'Error with Code: no output') ||
                history.type === 'ERROR' ||
                history.type === 'INVALID_SYNTAX'
            ) {
                // add a marker
                editor.session.addMarker(
                    new editorRange(row, 0, row + 1, 0),
                    'terminal-console__content__editor__error',
                    'text'
                );
            }

            editor.session.insert(
                {
                    row: row,
                    column: 0,
                },
                `${message}\n`
            );

            // add to history
            scope.terminalConsole.history.steps.push(history);

            // scroll to it
            editor.gotoLine(editor.session.getLength(), Infinity);
        }

        /**
         * @name buildMetaModelTable
         * @param history - step to update
         * @param raw- raw output to process
         * @desc formats the response based on metamodel data
         * @return {void}
         */
        function buildDatabaseMetamodel(
            history: {
                executed: boolean;
                expression: string;
                type: string;
                context: string;
                input: string;
                output: string;
            },
            raw: string
        ): void {
            const output = JSON.parse(raw);

            if (!output) {
                return;
            }

            const edgeHeaders = ['Source', 'Target'],
                edgeRows = output.edges.map(function (edge) {
                    return [edge.source, edge.target];
                }),
                nodeHeaders = ['Conceptual Name', 'Property Set', 'Key Set'],
                nodeRows = output.nodes.map(function (node) {
                    return [
                        node.conceptualName,
                        JSON.stringify(node.propSet),
                        node.keySet,
                    ];
                });

            history.output = generateAscii('Nodes', nodeHeaders, nodeRows);
            history.output += '\n\n\n';
            history.output += generateAscii('Edges', edgeHeaders, edgeRows);
        }

        /**
         * @name buildFrameHeaders
         * @param history - step to update
         * @param raw- raw output to process
         * @desc formats the response based on frame header data
         * @return {void}
         */
        function buildFrameHeaders(
            history: {
                executed: boolean;
                expression: string;
                type: string;
                context: string;
                input: string;
                output: string;
            },
            raw: string
        ): void {
            const output = JSON.parse(raw);

            if (!output) {
                return;
            }

            const headers = [
                'Alias',
                'Data Type',
                'Display Name',
                'Header',
                'Is Derived',
                'Is Primary Key',
                'Parent Node',
                'QS Name',
            ];

            let rows = [['', '', '', '', '', '', '', '']];
            if (output.headerInfo && output.headerInfo.headers) {
                rows = output.headerInfo.headers.map(function (header) {
                    return [
                        header.alias,
                        header.dataType,
                        header.displayName,
                        header.header,
                        header.isDerived,
                        header.isPrim,
                        header.parentNode,
                        JSON.stringify(header.qsName),
                    ];
                });
            }

            history.output = generateAscii('Frame Headers', headers, rows);
        }

        /**
         * @name buildTaskData
         * @param history - step to update
         * @param raw- raw output to process
         * @desc formats the response based on task data
         */
        function buildTaskData(
            history: {
                executed: boolean;
                expression: string;
                type: string;
                context: string;
                input: string;
                output: string;
            },
            raw: string
        ): void {
            const output = JSON.parse(raw);

            if (!output) {
                return;
            }

            if (!output.headerInfo) {
                buildUnknown(history, output);
                return;
            }

            let headers: string[] = [],
                rows: string[] = [];

            if (output.format && output.format.type === 'GRAPH') {
                headers = ['Nodes', 'Edge Source', 'Edge Target'];

                if (output.data.edges.length < output.data.nodes.length) {
                    rows = output.data.edges.map(function (edge, idx) {
                        return [
                            output.data.nodes[idx].VERTEX_TYPE_PROPERTY,
                            edge.source,
                            edge.target,
                        ];
                    });
                } else if (output.data.nodes) {
                    rows = output.data.nodes.map(function (node, idx) {
                        return [
                            node.VERTEX_TYPE_PROPERTY,
                            output.data.edges[idx].source,
                            output.data.edges[idx].target,
                        ];
                    });
                }
            } else {
                output.headerInfo.forEach(function (header) {
                    headers.push(header.alias);
                });

                // pivot table returns a string...we dont want to process that
                if (
                    output.data.values &&
                    typeof output.data.values !== 'string'
                ) {
                    rows = output.data.values.map(function (value) {
                        return value;
                    });
                }
            }

            history.output = generateAscii('Task Data', headers, rows);
        }

        /**
         * @name buildCodeExecution
         * @param history - step to update
         * @param raw- raw output to process
         * @desc formats the response based on the code execution
         */
        function buildCodeExecution(
            history: {
                executed: boolean;
                expression: string;
                type: string;
                context: string;
                input: string;
                output: string;
            },
            raw: string
        ): void {
            const output = JSON.parse(raw);

            if (!output) {
                return;
            }

            if (output === 'no output') {
                history.output = 'Error with Code: No output';
            } else if (Array.isArray(output)) {
                history.output = output[0].output;
            } else if (typeof output === 'object') {
                history.output = JSON.stringify(output);
            } else {
                history.output = output;
            }
        }

        /**
         * @name buildHelp
         * @param history - step to update
         * @param raw- raw output to process
         * @desc formats the response based on help
         * @return {void}
         */
        function buildHelp(
            history: {
                executed: boolean;
                expression: string;
                type: string;
                context: string;
                input: string;
                output: string;
            },
            raw: string
        ): void {
            const output = JSON.parse(raw);

            if (!output) {
                return;
            }

            history.output = output;
        }

        /**
         * @name buildInvalidSyntax
         * @param history - step to update
         * @param raw- raw output to process
         * @desc formats the response based on invalid syntax
         * @return {void}
         */
        function buildInvalidSyntax(
            history: {
                executed: boolean;
                expression: string;
                type: string;
                context: string;
                input: string;
                output: string;
            },
            raw: string
        ): void {
            const output = raw;

            if (!output) {
                return;
            }

            history.output = `Invalid Syntax: ${output}`;
        }

        /**
         * @name buildError
         * @param history - step to update
         * @param raw- raw output to process
         * @desc formats the response based on invalid syntax
         * @return {void}
         */
        function buildError(
            history: {
                executed: boolean;
                expression: string;
                type: string;
                context: string;
                input: string;
                output: string;
            },
            raw: string
        ): void {
            const output = raw;

            if (!output) {
                return;
            }

            history.output = `Error: ${output}`;
        }

        /**
         * @name buildUnknown
         * @param history - step to update
         * @param raw- raw output to process
         * @desc formats the response based on an unknown type
         * @return {void}
         */
        function buildUnknown(
            history: {
                executed: boolean;
                expression: string;
                type: string;
                context: string;
                input: string;
                output: string;
            },
            raw: string
        ): void {
            const output = raw;

            if (!output) {
                return;
            }

            history.output = output
                .replace(/\t/g, '')
                .replace(/\n/g, '')
                .replace(/,/g, ', ');
        }

        /**
         * @name generateAscii
         * @param title - the title for the table
         * @param headers - array of the headers for the table
         * @param rows - array of values for the rows
         * @desc builds an ascii table with the given data
         * @return the table
         */
        function generateAscii(title: string, headers: any, rows: any): string {
            const table = new AsciiTable(title);
            // in order to call the table function with an array of args
            // need to use apply, can't use spread operator until we bundle embed
            table.setHeading.apply(table, headers);
            // add all rows if lower than maxRecords, otherwise add number of rows equal to maxRecords
            const len = Math.min(
                rows.length,
                scope.terminalConsole.state.maxRecords
            );
            for (let i = 0; i < len; i++) {
                if (typeof rows[i] === 'object') {
                    table.addRow.apply(table, rows[i]);
                }
            }
            table.removeBorder();

            return table.toString();
        }

        /**
         * @name getInput
         * @desc grabs text user has typed after the latest prompt
         * @return what the user has typed
         */
        function getInput(): string {
            let input = '';

            // get all of the lines. We will be using from the start of the current line
            const len = editor.session.getLength();
            for (let i = scope.terminalConsole.input.row; i <= len; i++) {
                const line = editor.session.getLine(i);

                // for the first one chop of
                if (scope.terminalConsole.input.row === i) {
                    input += line.substr(
                        scope.terminalConsole.input.column,
                        line.length
                    );
                } else {
                    input += line;
                }

                if (i !== len) {
                    input += '\n';
                }
            }

            return input.trim();
        }

        /**
         * @name runAction
         * @param input - what the user has entered into the prompt
         * @desc runs custom key, adds command to history
         * @return {void}
         */
        function runAction(input: string): void {
            if (input === 'clear') {
                editor.setValue('');
            } else {
                let output = '';

                if (
                    input === 'r' ||
                    input === '%r' ||
                    input === 'R' ||
                    input === '%R'
                ) {
                    changeContext(TOKENS.CONTEXT.R);
                    output += getActionEnterOutput(TOKENS.CONTEXT.R);
                } else if (
                    input === 'p' ||
                    input === '%p' ||
                    input === 'P' ||
                    input === '%P'
                ) {
                    changeContext(TOKENS.CONTEXT.PYTHON);
                    output += getActionEnterOutput(TOKENS.CONTEXT.PYTHON);
                } else if (input === 'multi') {
                    scope.terminalConsole.state.executeOnEnter =
                        !scope.terminalConsole.state.executeOnEnter;

                    // save it
                    changeState();

                    if (scope.terminalConsole.state.executeOnEnter) {
                        output += getActionExitOutput('Multi Line');
                    } else {
                        output += getActionEnterOutput(
                            'Multi Line',
                            'Use the multi command again to exit.'
                        );
                    }
                } else if (input === 'raw') {
                    scope.terminalConsole.state.rawOutput =
                        !scope.terminalConsole.state.rawOutput;

                    // save it
                    changeState();

                    if (scope.terminalConsole.state.rawOutput) {
                        output += getActionEnterOutput('Raw Output');
                    } else {
                        output += getActionExitOutput('Raw Output');
                    }
                }

                // clear it
                editor.session.replace(
                    new editorRange(
                        scope.terminalConsole.input.row,
                        0,
                        scope.terminalConsole.input.row,
                        Infinity
                    ),
                    ''
                );

                if (output) {
                    processStep(input, output, '');
                }
            }

            // create a new line
            resetEditor();

            // digest
            $timeout();
        }

        /**
         * @name getActionEnterOutput
         * @param  mode - mode user is entering
         * @param  description - additional information about the command that has been entered - will appear on a new line
         * @desc writes the output for when user enters a new mode
         * @return the output to display
         */
        function getActionEnterOutput(
            mode: string,
            description?: string
        ): string {
            let output = '\n You have entered ' + mode + ' Mode.';
            if (description) {
                output += ' \n ' + description;
            }

            output += '\n\n';
            return output;
        }

        /**
         * @name getActionExitOutput
         * @param  mode - mode user is entering
         * @param  description - additional information about the command that has been entered - will appear on a new line
         * @desc writes the output for when user enters a new mode
         * @return the output to display
         */
        function getActionExitOutput(mode: string, description?: string) {
            let output = '\n You have exited ' + mode + ' Mode.';
            if (description) {
                output += ' \n ' + description;
            }

            output += '\n\n';
            return '\n You have left ' + mode + ' Mode.\n\n > ';
        }

        /**
         * @name scrollCursorIntoView
         * @description Sets cursor to input row
         * @param {object} editor - Ace editor
         */
        function scrollCursorIntoView(editor: any): void {
            // scroll cursor into view;
            const { row, column } = editor.getCursorPosition();

            editor.renderer.scrollCursorIntoView(
                {
                    column,
                    row: row + 1,
                },
                0.5
            );
        }

        /** * Toolbar */
        /**
         * @name refreshFrameHeaders
         * @desc manually refresh the frame headers
         */
        function refreshFrameHeaders(): void {
            if (!scope.terminalConsole.advanced.refresh) {
                return;
            }

            const callback = function (response: PixelReturnPayload) {
                const type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.insightCtrl.alert(
                    'success',
                    `Successfully refreshed headers for ${scope.terminalConsole.state.context}.`
                );

                // clear out the variable
                scope.terminalConsole.advanced.refresh = '';
            };

            scope.insightCtrl.execute(
                [
                    {
                        type: 'variable',
                        components: [scope.terminalConsole.advanced.refresh],
                        terminal: false,
                    },
                    {
                        type: 'frameHeaders',
                        components: [],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name generateFrameFromVariable
         * @desc generate a new frame from R variable
         */
        function generateFrameFromVariable(): void {
            if (!scope.terminalConsole.advanced.variable) {
                return;
            }

            const worksheet = scope.insightCtrl.getWorkbook('worksheet');
            let newCloneId = scope.insightCtrl.getShared('panelCounter');
            newCloneId = ++newCloneId;
            newCloneId = String(newCloneId);

            const components = [
                    {
                        type:
                            scope.terminalConsole.state.context === 'R'
                                ? 'generateFrameFromRVariable'
                                : 'generateFrameFromPyVariable',
                        components: [scope.terminalConsole.advanced.variable],
                        terminal: true,
                    },
                    {
                        type: 'addPanel',
                        components: [newCloneId, worksheet],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: [newCloneId],
                        terminal: false,
                    },
                    {
                        type: 'setPanelView',
                        components: ['visualization'],
                        terminal: true,
                    },
                    {
                        type: 'frame',
                        components: [],
                        terminal: false,
                    },
                    {
                        type: 'queryAll',
                        components: [],
                        terminal: false,
                    },
                    {
                        type: 'autoTaskOptions',
                        components: [newCloneId, 'Grid'],
                        terminal: false,
                    },
                    {
                        type: 'collect',
                        components: [
                            scope.insightCtrl.getOptions('limit') || 2000,
                        ],
                        terminal: true,
                    },
                ],
                callback = function (response: PixelReturnPayload) {
                    const type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        scope.insightCtrl.alert(
                            'error',
                            `An error occurred. Please make sure the ${scope.terminalConsole.state.context} variable exists.`
                        );
                        return;
                    }

                    scope.insightCtrl.alert(
                        'success',
                        `Successfully generated frame from ${scope.terminalConsole.state.context} variable.`
                    );

                    // clear out the variable
                    scope.terminalConsole.advanced.variable = '';
                };

            scope.insightCtrl.execute(components, callback);
        }

        /**
         * @name copy
         * @param {string} content - pixel to copy
         */
        function copy(): void {
            let steps = scope.insightCtrl.getShared('steps') || [],
                config: any,
                content: string;

            config = semossCoreService.workspace.saveWorkspace(
                scope.insightCtrl.insightID
            );

            if (config && Object.keys(config).length !== 0) {
                steps.push({
                    type: '',
                    output: '',
                    expression: `META | SetInsightConfig(${JSON.stringify(
                        config
                    )});`,
                });
            }

            content = steps
                .map(function (step) {
                    return step.expression;
                })
                .join('\n');

            if (navigator && navigator.clipboard) {
                // successor to document.execCommand
                // will be able to copy large amount of text without issue
                // async copy
                navigator.clipboard
                    .writeText(content)
                    .then(() => {
                        scope.insightCtrl.alert(
                            'success',
                            'Recipe successfully copied to clipboard'
                        );
                        $timeout(); // digest
                    })
                    .catch((error) => {
                        scope.insightCtrl.alert(
                            'error',
                            'Recipe unsuccessfully copied to clipboard'
                        );
                    });
            } else if ($window.clipboardData) {
                // IE
                $window.clipboardData.setData('Text', content);
                scope.insightCtrl.alert(
                    'success',
                    'Recipe successfully copied to clipboard'
                );
            } else {
                const exportElement = angular.element(
                    "<textarea style='position:fixed;left:-1000px;top:-1000px;'>" +
                        content +
                        '</textarea>'
                );

                ele.append(exportElement);
                (exportElement as any).select();

                if (document.execCommand('copy')) {
                    exportElement.remove();

                    scope.insightCtrl.alert(
                        'success',
                        'Recipe successfully copied to clipboard'
                    );
                } else {
                    exportElement.remove();
                    scope.insightCtrl.alert(
                        'error',
                        'Recipe unsuccessfully copied to clipboard'
                    );
                }
            }
        }

        /**
         * @name execute
         * @desc when pressing submit button is pressed, run the pixel
         */
        function execute(): void {
            let input = getInput();

            if (input.length === 0) {
                return;
            }

            input = addContext(input);

            scope.insightCtrl.execute([
                {
                    type: 'Pixel',
                    components: [input],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            let updateFrameListener: () => {}, syncInsightListener: () => {};

            // get the
            editorEle = ele[0].querySelector(
                '#terminal-console__content__editor'
            );

            // resize event
            scope.$watch(
                function () {
                    return editorEle.clientWidth + '-' + editorEle.clientHeight;
                },
                function (newValue: string, oldValue: string) {
                    if (newValue !== oldValue) {
                        if (editor) {
                            editor.resize(true);
                            scrollCursorIntoView(editor);
                        }
                    }
                }
            );

            // add listeners
            updateFrameListener = scope.insightCtrl.on('update-frame', () => {
                if (editor) {
                    updateFrame();
                }
            });
            syncInsightListener = scope.insightCtrl.on('sync-insight', () => {
                if (editor) {
                    updateEditor();
                }
            });

            // cleanup
            scope.$on('$destroy', function () {
                updateFrameListener();
                syncInsightListener();
            });

            import(
                /* webpackChunkName: "ace"  */ /* webpackPrefetch: true */ '../ace'
            )
                .then((module) => {
                    ace = module.ace;
                    AsciiTable = module.AsciiTable;

                    // update the state
                    updateState();

                    // initialize the editor
                    initializeEditor();

                    resetPanel();
                })
                .catch((err) => {
                    console.error('Error: ', err);
                });
        }

        initialize();
    }
}
