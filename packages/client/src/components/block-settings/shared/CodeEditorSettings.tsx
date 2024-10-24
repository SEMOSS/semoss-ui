// CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON
import { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { getValueByPath } from '@/utility';
import { useBlockSettings, useBlocks, usePixel } from '@/hooks';
import { Block, BlockDef, QueryState } from '@/stores';
import { DefaultBlocks } from '@/components/block-defaults';
import { BLOCK_TYPE_INPUT } from '@/components/block-defaults/block-defaults.constants';
import { LoadingScreen } from '@/components/ui';
import { runPixel } from '@/api';
import { useNotification } from '@semoss/ui';

// Reduce Initial Bundle
const Editor = lazy(() => import('@monaco-editor/react'));

interface CodeEditorSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const CodeEditorSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
    }: CodeEditorSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const { state, notebook } = useBlocks();

        // track the value
        const [value, setValue] = useState('');
        const [language, setLanguage] = useState('');
        const [LLMLoading, setLLMLoading] = useState(false);
        const [modelId, setModelId] = useState<string>('');
        const myModels = usePixel<{ app_id: string; app_name: string }[]>(`
            MyEngines(engineTypes=['MODEL']);
        `);
        const notification = useNotification();
        const wordWrapRef = useRef(true);

        const [models, setModels] = useState<
            { app_id: string; app_name: string }[]
        >([]);

        const modelIdRef = useRef('');

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }

                const v = getValueByPath(data, path);

                // determine and set language type
                if (path == 'html') {
                    setLanguage('html');
                } else if (path == 'specJson') {
                    setLanguage('json');
                } else if (path == 'text') {
                    setLanguage('plaintext');
                }

                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue, data]);

        useEffect(() => {
            modelIdRef.current = modelId;
        }, [modelId]);

        useEffect(() => {
            if (myModels.status !== 'SUCCESS') {
                return;
            }

            setModels(
                myModels.data.map((d) => ({
                    app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
                    app_id: d.app_id,
                })),
            );

            setModelId(myModels.data[0].app_id);
        }, [myModels.status, myModels.data]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value
            setValue(value);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(path, value as PathValue<D['data'], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

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
                notification.add({
                    color: 'error',
                    message: 'Failed response from AI Code Generator',
                });
                return '';
            }
        };

        const handleMount = (editor, monaco) => {
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
                        (block) =>
                            DefaultBlocks[block].type === BLOCK_TYPE_INPUT,
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
                notebook.notebooksList.forEach((query: QueryState) => {
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
                });

                return suggestions;
            };

            monaco.languages.registerCompletionItemProvider('json', {
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
                    const preceedingTwoCharacters = model.getValueInRange(
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
                    const followingTwoCharacters = model.getValueInRange(
                        specialCharacterEndRange,
                    );
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
                        startColumn: word.startColumn - replaceRangeStartBuffer,
                        endColumn: word.endColumn + replaceRangeEndBuffer,
                    };
                    return {
                        suggestions: generateSuggestions(replaceRange),
                    };
                },
                triggerCharacters: ['{'],
            });

            // add LLM prompting and word-wrap actions to editor
            editor.addAction({
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
                    const selectedText = editor
                        .getModel()
                        .getValueInRange(selection);

                    let LLMReturnText = '';
                    switch (language) {
                        case 'html':
                            LLMReturnText = await promptLLM(
                                `Create code for an HTML file with the user prompt: ${selectedText}`, // filetype should be sent as param to LLM
                            );
                            break;
                        case 'json':
                            LLMReturnText = await promptLLM(
                                `Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure 'data' is a top-level key in the JSON object. Use the following user prompt: ${selectedText}`,
                            );
                            break;
                    }

                    // adds LLM return text after response
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

                    // highligts LLM return text after response
                    editor.setSelection(
                        new monaco.Range(
                            selection.endLineNumber + 3,
                            1,
                            selection.endLineNumber +
                                3 +
                                LLMReturnText.split('\n').length,
                            1,
                        ),
                    );
                },
            });
        };

        return (
            <>
                {LLMLoading && (
                    <LoadingScreen.Trigger description="Generating..." />
                )}
                <Suspense fallback={<>...</>}>
                    <Editor
                        width="100%"
                        height="100%"
                        value={value}
                        language={language}
                        options={{
                            lineNumbers: 'on',
                            readOnly: false,
                            minimap: { enabled: false },
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            lineHeight: 19,
                            overviewRulerBorder: false,
                        }}
                        onChange={(e) => {
                            onChange(e);
                        }}
                        onMount={handleMount}
                    />
                </Suspense>
            </>
        );
    },
);
