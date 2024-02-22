import { useEffect, useRef, useState } from 'react';

import Editor from '@monaco-editor/react';
import { DiffEditor } from '@monaco-editor/react';

import { styled } from '@semoss/ui';
import { ActionMessages, Block, CellComponent, QueryState } from '@/stores';
import { useBlocks } from '@/hooks';
import { CodeCellDef } from './config';
import { DefaultBlocks } from '@/components/block-defaults';
import { BLOCK_TYPE_INPUT } from '@/components/block-defaults/block-defaults.constants';

import { useLLM } from '@/hooks';
import { runPixel } from '@/api';

import { LoadingScreen } from '@/components/ui';

import * as monaco from 'monaco-editor';

// best documentation on component versions of monaco editor and diffeditor
// https://www.npmjs.com/package/@monaco-editor/react

const EditorLineHeight = 19;

const StyledContent = styled('div', {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled: boolean }>(({ theme, disabled }) => ({
    paddingTop: theme.spacing(0.75),
    margin: '0!important',
    width: '100%',
    position: 'relative',
    display: 'flex',
    '.monaco-editor': {
        overflow: 'visible',
    },
    pointerEvents: disabled ? 'none' : 'unset',

    // // optional solution to scrolling bugginess
    // maxHeight: "50vh",
    // overflowY: "auto",
}));

const EditorLanguages = {
    py: 'python',
    pixel: 'pixel',
    r: 'r',
};

// track completion providers outside of render context
let completionItemProviders = {};

export const CodeCellInput: CellComponent<CodeCellDef> = (props) => {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const selectionRef = useRef(null);
    const LLMReturnRef = useRef('');
    const [editorHeight, setEditorHeight] = useState<number>(null);

    const { cell, isExpanded } = props;
    const { state, notebook } = useBlocks();

    const [LLMLoading, setLLMLoading] = useState(false);
    const [diffEditMode, setDiffEditMode] = useState(false);
    const wordWrapRef = useRef(false);

    const [oldContentDiffEdit, setOldContentDiffEdit] = useState('');
    const [newContentDiffEdit, setNewContentDiffEdit] = useState('');

    // // unclear how we want to manage model ID
    const modelIdRef = useRef('3def3347-30e1-4028-86a0-83a1e5ed619c');
    // const fileTypeRef = useRef('');
    // const { modelId } = useLLM(); // currently throwing error
    // useEffect(() => {
    //     modelIdRef.current = modelId;
    // }, [modelId]);

    const promptLLM = async (inputPrompt) => {
        setLLMLoading(true);
        const pixel = `LLM(engine = "${modelIdRef.current}", command = "${inputPrompt}", paramValues = [ {} ] );`;

        try {
            const res = await runPixel(pixel);
            setLLMLoading(false);

            const LLMResponse = res.pixelReturn[0].output['response'];
            let trimmedStarterCode = LLMResponse;
            trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ''); // trims off any triple quotes from backend

            trimmedStarterCode = trimmedStarterCode.substring(
                trimmedStarterCode.indexOf('\n') + 1,
            );

            return trimmedStarterCode;
        } catch {
            setLLMLoading(false);
            console.error('Failed response from AI Code Generator');
            return '';
        }
    };

    const handleDiffEditorMount = (editor, monaco) => {
        monaco.editor.addEditorAction({
            contextMenuGroupId: '1_modification',
            contextMenuOrder: 2,
            id: 'toggle-word-wrap',
            label: 'Toggle Word Wrap',
            keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ],

            run: async (editor) => {
                wordWrapRef.current = !wordWrapRef.current;
                editor.updateOptions({
                    wordWrap: wordWrapRef.current ? 'on' : 'off',
                });
            },
        });

        // monaco.editor.addEditorAction(toggleWordWrapAction);
        // // using defineTheme to apply limited custom styling
        // monaco.editor.defineTheme('default', {
        //     base: 'vs-dark',
        //     inherit: true,
        // rules: [
        //   {
        //     token: "identifier",
        //     foreground: "FF0000"
        //   },
        //   {
        //     token: "identifier.function",
        //     foreground: "DCDCAA"
        //   },
        //   {
        //     token: "type",
        //     foreground: "1AAFB0"
        //   },
        //   { token: 'added', foreground: '008000', fontStyle: 'bold' }, // Color for added lines
        //   { token: 'removed', foreground: 'FF0000', fontStyle: 'bold' }, // Color for removed lines
        //   { token: 'modified', foreground: '0000FF', fontStyle: 'bold' } // Color for modified lines
        // ],
        // colors: {}
        // });
        // monaco.editor.setTheme('default')
    };

    const handleMount = (editor, monaco) => {
        // if (selectionRef.current && LLMReturnRef.current) {
        //     monaco.editor.current.setSelection(
        //         new monaco.Range(
        //             selectionRef.current.endLineNumber + 2,
        //             1,
        //             selectionRef.current.endLineNumber +
        //                 3 +
        //                 LLMReturnRef.current.split('\n').length,
        //             1,
        //         ),
        //     );
        // }

        // first time you set the height based on content Height
        editorRef.current = editor;
        monacoRef.current = monaco;
        const contentHeight = editor.getContentHeight();
        setEditorHeight(contentHeight);
        // update the action

        monaco.editor.addEditorAction({
            contextMenuGroupId: '1_modification',
            contextMenuOrder: 2,
            id: 'toggle-word-wrap',
            label: 'Toggle Word Wrap',
            keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ],

            run: async (editor) => {
                wordWrapRef.current = !wordWrapRef.current;
                editor.updateOptions({
                    wordWrap: wordWrapRef.current ? 'on' : 'off',
                });
            },
        });

        editor.addAction({
            id: 'run',
            label: 'Run',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            run: (editor) => {
                const newValue = editor.getValue();

                // update with the new code
                state.dispatch({
                    message: ActionMessages.UPDATE_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                        path: 'parameters.code',
                        value: newValue,
                    },
                });

                state.dispatch({
                    message: ActionMessages.RUN_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                    },
                });
            },
        });

        editor.addAction({
            contextMenuGroupId: '1_modification',
            contextMenuOrder: 1,
            id: 'prompt-LLM',
            label: 'Generate Code',
            keybindings: [
                monaco.KeyMod.CtrlCmd |
                    monaco.KeyMod.Shift |
                    monaco.KeyCode.KeyG,
            ],

            run: async (editor) => {
                const selection = editor.getSelection();
                selectionRef.current = selection;
                const selectedText = editor
                    .getModel()
                    .getValueInRange(selection);

                const LLMReturnText = await promptLLM(
                    `Create code for a .${
                        EditorLanguages[cell.parameters.type]
                    } file with the user prompt: ${selectedText}`, // filetype should be sent as param to LLM
                );
                LLMReturnRef.current = LLMReturnText;

                setOldContentDiffEdit(editor.getModel().getValue());
                // set diffedit old content
                // set diffedit new content
                // go into diffedit mode

                editor.executeEdits('custom-action', [
                    {
                        range: new monaco.Range(
                            selection.endLineNumber + 2,
                            1,
                            selection.endLineNumber + 2,
                            1,
                        ),
                        text: `\n\n${LLMReturnText}\n`,
                        forceMoveMarkers: true,
                    },
                ]);

                setNewContentDiffEdit(editor.getModel().getValue());

                setDiffEditMode(true);

                // isnt retained after diffedit
                // editor.setSelection(
                //     new monaco.Range(
                //         selection.endLineNumber + 2,
                //         1,
                //         selection.endLineNumber +
                //             3 +
                //             LLMReturnText.split('\n').length,
                //         1,
                //     ),
                // );
            },
        });

        const exposedQueryParameterDescription = (
            exposedParameter: string,
            queryId: string,
        ): string => {
            switch (exposedParameter) {
                case 'id':
                case 'mode':
                    return `Returns the ${exposedParameter} of query ${queryId}`;
                case 'isExecuted':
                    return `Returns whether query ${queryId} has executed`;
                case 'isLoading':
                    return `Returns the loading state for query ${queryId}`;
                case 'isError':
                    return `Returns whether query ${queryId} has an error`;
                case 'error':
                    return `Returns the error for query ${queryId} if it exists`;
                case 'list':
                    return `Returns an ordered list of cell IDs for query ${queryId}`;
                default:
                    return `Reference the ${exposedParameter} parameter of query ${queryId}`;
            }
        };

        // add editor completion suggestions based on block values and query outputs
        const generateSuggestions = (range) => {
            const suggestions = [];
            Object.values(state.blocks).forEach((block: Block) => {
                // only input block types will have values
                const inputBlockWidgets = Object.keys(DefaultBlocks).filter(
                    (block) => DefaultBlocks[block].type === BLOCK_TYPE_INPUT,
                );
                if (inputBlockWidgets.includes(block.widget)) {
                    suggestions.push({
                        label: {
                            label: `{{block.${block.id}.value}}`,
                            description: block.data?.value
                                ? JSON.stringify(block.data?.value)
                                : '',
                        },
                        kind: monaco.languages.CompletionItemKind.Variable,
                        documentation: `Returns the value of block ${block.id}`,
                        insertText: `{{block.${block.id}.value}}`,
                        range: range,
                    });
                }
            });
            notebook.queriesList.forEach((query: QueryState) => {
                // don't push the query that the cell belongs to
                if (query.id !== cell.query.id) {
                    // push all exposed values
                    Object.keys(query._exposed).forEach(
                        (exposedParameter: string) => {
                            suggestions.push({
                                label: {
                                    label: `{{query.${query.id}.${exposedParameter}}}`,
                                    description: query._exposed[
                                        exposedParameter
                                    ]
                                        ? JSON.stringify(
                                              query._exposed[exposedParameter],
                                          )
                                        : '',
                                },
                                kind: monaco.languages.CompletionItemKind
                                    .Variable,
                                documentation: exposedQueryParameterDescription(
                                    exposedParameter,
                                    query.id,
                                ),
                                insertText: `{{query.${query.id}.${exposedParameter}}}`,
                                range: range,
                                detail: query.id,
                            });
                        },
                    );
                }
            });

            return suggestions;
        };

        // register custom pixel language
        monaco.languages.register({ id: 'pixel' });

        // add suggestions for each language
        Object.values(EditorLanguages).forEach((language) => {
            // if suggestion already exist, dispose and re-add
            // this may be superfluous at times but we re-add instead of setting up suggestions once
            // so that we are pulling more real-time values off of the blocks/queries
            if (completionItemProviders[language]) {
                completionItemProviders[language].dispose();
            }
            completionItemProviders = {
                ...completionItemProviders,
                [language]: monaco.languages.registerCompletionItemProvider(
                    language,
                    {
                        provideCompletionItems: (model, position) => {
                            const word = model.getWordUntilPosition(position);
                            // getWordUntilPosition doesn't track when words are led by special characters
                            // we need to chack for wrapping curly brackets manually to know what to replace

                            // word is not empty, completion was triggered by a non-special character
                            if (word.word !== '') {
                                // return empty suggestions to trigger built in typeahead
                                return {
                                    suggestions: [],
                                };
                            }

                            // triggerCharacters is triggered per character, so we need to check if the users has typed "{" or "{{"
                            const specialCharacterStartRange = {
                                startLineNumber: position.lineNumber,
                                endLineNumber: position.lineNumber,
                                startColumn: word.startColumn - 2,
                                endColumn: word.startColumn,
                            };
                            const preceedingTwoCharacters =
                                model.getValueInRange(
                                    specialCharacterStartRange,
                                );
                            const replaceRangeStartBuffer =
                                preceedingTwoCharacters === '{{' ? 2 : 1;
                            // python editor will automatically add closed bracket when you type a start one
                            // need to replace the closed brackets appropriately
                            const specialCharacterEndRange = {
                                startLineNumber: position.lineNumber,
                                endLineNumber: position.lineNumber,
                                startColumn: word.endColumn,
                                endColumn: word.endColumn + 2,
                            };
                            const followingTwoCharacters =
                                model.getValueInRange(specialCharacterEndRange);
                            const replaceRangeEndBuffer =
                                followingTwoCharacters === '}}'
                                    ? 2
                                    : followingTwoCharacters == '} ' ||
                                      followingTwoCharacters == '}'
                                    ? 1
                                    : 0;

                            // compose range that we want to replace with the suggestion
                            const replaceRange = {
                                startLineNumber: position.lineNumber,
                                endLineNumber: position.lineNumber,
                                startColumn:
                                    word.startColumn - replaceRangeStartBuffer,
                                endColumn:
                                    word.endColumn + replaceRangeEndBuffer,
                            };
                            return {
                                suggestions: generateSuggestions(replaceRange),
                            };
                        },
                        triggerCharacters: ['{'],
                    },
                ),
            };
        });
    };

    const handleChange = (newValue: string) => {
        // pad an extra line so autocomplete is visible
        setEditorHeight(
            editorRef.current.getModel().getLineCount() * EditorLineHeight,
        );
        if (cell.isLoading) {
            return;
        }

        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cell.query.id,
                cellId: cell.id,
                path: 'parameters.code',
                value: newValue,
            },
        });
    };

    const acceptDiffEditHandler = () => {
        setDiffEditMode(false);
    };

    const rejectDiffEditHandler = () => {
        setDiffEditMode(false);
    };

    return (
        <>
            <StyledContent disabled={!isExpanded}>
                {LLMLoading && (
                    <LoadingScreen.Trigger description="Generating..." />
                )}
                {/* may need to add switch statement here to render seperate diffEdit component */}

                {diffEditMode && (
                    <DiffEditor
                        // theme={customTheme}
                        width="100%"
                        // height={isExpanded ? editorHeight : EditorLineHeight}
                        height="500px"
                        // original={cell.parameters.code}
                        original={oldContentDiffEdit}
                        // modified={`some new text\n\n${cell.parameters.code}`}
                        modified={newContentDiffEdit}
                        language={EditorLanguages[cell.parameters.type]}
                        options={{
                            lineNumbers: 'on',
                            readOnly: true,
                            minimap: { enabled: false },
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            lineHeight: EditorLineHeight,
                            overviewRulerBorder: false,
                            // inDiffEditor: true, // this is valid but only seems to lock the editor
                        }}
                        // onChange={handleChange}
                        onMount={handleDiffEditorMount}
                    />
                )}

                {diffEditMode && (
                    <div>
                        <button onClick={acceptDiffEditHandler}>accept</button>
                        <button onClick={rejectDiffEditHandler}>reject</button>
                    </div>
                )}

                {!diffEditMode && (
                    <Editor
                        width="100%"
                        height={isExpanded ? editorHeight : EditorLineHeight}
                        value={cell.parameters.code}
                        language={EditorLanguages[cell.parameters.type]}
                        options={{
                            lineNumbers: 'on',
                            readOnly: false,
                            minimap: { enabled: false },
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            lineHeight: EditorLineHeight,
                            overviewRulerBorder: false,
                            // inDiffEditor: true, // this is valid but only seems to lock the editor
                        }}
                        onChange={handleChange}
                        onMount={handleMount}
                    />
                )}
            </StyledContent>
        </>
    );
};
