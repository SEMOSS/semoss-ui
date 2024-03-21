import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { editor } from 'monaco-editor';
import Editor, { DiffEditor, Monaco } from '@monaco-editor/react';
import {
    Autocomplete,
    styled,
    Button,
    Menu,
    MenuProps,
    List,
    Stack,
    Select,
} from '@semoss/ui';
import { CodeOff, KeyboardArrowDown } from '@mui/icons-material';

import { runPixel } from '@/api';
import {
    ActionMessages,
    Block,
    CellComponent,
    QueryState,
    CellDef,
} from '@/stores';
import { useBlocks, useLLM } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { DefaultBlocks } from '@/components/block-defaults';
import { BLOCK_TYPE_INPUT } from '@/components/block-defaults/block-defaults.constants';

import { PythonIcon, RIcon } from './icons';

export interface CodeCellDef extends CellDef<'code'> {
    widget: 'code';
    parameters: {
        /** Type of code in the cell */
        type: 'r' | 'py' | 'pixel';

        /** Code rendered in the cell */
        code: string;
    };
}

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500; // ~25 lines

const EDITOR_TYPE = {
    py: {
        name: 'Python',
        value: 'py',
        language: 'python',
        icon: PythonIcon,
    },
    r: {
        name: 'R',
        value: 'r',
        language: 'r',
        icon: RIcon,
    },
    pixel: {
        name: 'Pixel',
        value: 'pixel',
        language: 'pixel',
        icon: CodeOff,
    },
} as const;

// best documentation on component versions of monaco editor and diffeditor
// https://www.npmjs.com/package/@monaco-editor/react
const StyledContent = styled('div', {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled: boolean }>(({ disabled }) => ({
    position: 'relative',
    width: '100%',
    pointerEvents: disabled ? 'none' : 'unset',
}));

const StyledContainer = styled('div')(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5),
}));

const StyledSelect = styled(Select)(({ theme }) => ({
    '& .MuiSelect-select': {
        color: theme.palette.text.secondary,
        display: 'flex',
        gap: theme.spacing(1),
        alignItems: 'center',
    },
}));

const StyledSelectItem = styled(Select.Item)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    color: theme.palette.text.secondary,
}));

// track completion providers outside of render context
let completionItemProviders = {};

// TODO:: Refactor height to account for Layout
export const CodeCell: CellComponent<CodeCellDef> = observer((props) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
    const diffEditorRef = useRef<editor.IStandaloneDiffEditor>(null);

    // track the popover menu
    const [menuAnchorEle, setMenuAnchorEle] = useState<null | HTMLElement>(
        null,
    );
    const isMenuOpen = Boolean(menuAnchorEle);

    const { cell, isExpanded } = props;
    const { state, notebook } = useBlocks();

    const [LLMLoading, setLLMLoading] = useState(false);
    const [diffEditMode, setDiffEditMode] = useState(false);
    const wordWrapRef = useRef(true);

    const [oldContentDiffEdit, setOldContentDiffEdit] = useState('');
    const [newContentDiffEdit, setNewContentDiffEdit] = useState('');

    const [isLLMRejected, setIsLLMRejected] = useState(false);
    const { modelId } = useLLM();

    /**
     * Ask a LLM a question to generate a response
     * @param prompt - prompt passed to the LLM
     * @returns LLM Response
     */
    const promptLLM = async (prompt: string) => {
        setLLMLoading(true);
        const pixel = `LLM(engine = "${modelId}", command = "${prompt}", paramValues = [ {} ] );`;

        try {
            const res = await runPixel(pixel);

            const LLMResponse = res.pixelReturn[0].output['response'];
            let trimmedStarterCode = LLMResponse;
            trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ''); // trims off any triple quotes from backend

            trimmedStarterCode = trimmedStarterCode.substring(
                trimmedStarterCode.indexOf('\n') + 1,
            );

            return trimmedStarterCode;
        } catch {
            console.error('Failed response from AI Code Generator');
            return '';
        } finally {
            setLLMLoading(false);
        }
    };

    /**
     * Handle mounting of the diff editor
     *
     * @param editor - editor that mounted
     * @param monaco - monaco instance
     */
    const handleDiffEditorMount = (
        editor: editor.IStandaloneDiffEditor,
        monaco: Monaco,
    ) => {
        // save the editor
        diffEditorRef.current = editor;

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

        // resize the editor
        resizeDiffEditor();
    };

    /**
     * Resize the diff editor
     */
    const resizeDiffEditor = () => {
        // set the height based ont the max content
        let height = Math.min(
            Math.max(
                diffEditorRef.current.getModifiedEditor().getContentHeight(),
                diffEditorRef.current.getOriginalEditor().getContentHeight(),
            ),
            EDITOR_MAX_HEIGHT,
        );

        // add the trailing line
        height += EDITOR_LINE_HEIGHT;

        // resize it
        diffEditorRef.current.layout({
            width: diffEditorRef.current.getContainerDomNode().clientWidth,
            height: height,
        });
    };

    /**
     * Handle mounting of the editor
     *
     * @param editor - editor that mounted
     * @param monaco - monaco instance
     */
    const handleEditorMount = (
        editor: editor.IStandaloneCodeEditor,
        monaco: Monaco,
    ) => {
        // if diffedit code has been rejected set to old editor content
        if (isLLMRejected) {
            editor.getModel().setValue(oldContentDiffEdit);
            setIsLLMRejected(false);
        }

        editorRef.current = editor;

        // add on change
        let ignoreResize = false;
        editor.onDidContentSizeChange(() => {
            try {
                // set the ignoreResize flag
                if (ignoreResize) {
                    return;
                }
                ignoreResize = true;

                resizeEditor();
            } finally {
                ignoreResize = false;
            }
        });

        // update the action
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
                const selectedText = editor
                    .getModel()
                    .getValueInRange(selection);

                const LLMReturnText = await promptLLM(
                    `Create a ${
                        EDITOR_TYPE[cell.parameters.type].name
                    } file with the user prompt: ${selectedText}`, // filetype should be sent as param to LLM
                );

                setOldContentDiffEdit(editor.getModel().getValue());

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
        Object.values(EDITOR_TYPE).forEach((language) => {
            // if suggestion already exist, dispose and re-add
            // this may be superfluous at times but we re-add instead of setting up suggestions once
            // so that we are pulling more real-time values off of the blocks/queries
            if (completionItemProviders[language.name]) {
                completionItemProviders[language.name].dispose();
            }
            completionItemProviders = {
                ...completionItemProviders,
                [language.name]:
                    monaco.languages.registerCompletionItemProvider(
                        language.name,
                        {
                            provideCompletionItems: (model, position) => {
                                const word =
                                    model.getWordUntilPosition(position);
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
                                    model.getValueInRange(
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
                                    startColumn:
                                        word.startColumn -
                                        replaceRangeStartBuffer,
                                    endColumn:
                                        word.endColumn + replaceRangeEndBuffer,
                                };
                                return {
                                    suggestions:
                                        generateSuggestions(replaceRange),
                                };
                            },
                            triggerCharacters: ['{'],
                        },
                    ),
            };
        });

        // resize the editor
        resizeEditor();
    };

    /**
     * Resize the editor
     */
    const resizeEditor = () => {
        // set the initial height
        let height = 0;

        // if expanded scale to lines, but do not go over the max height
        if (isExpanded) {
            height = Math.min(
                editorRef.current.getContentHeight(),
                EDITOR_MAX_HEIGHT,
            );
        }

        // add the trailing line
        height += EDITOR_LINE_HEIGHT;

        editorRef.current.layout({
            width: editorRef.current.getContainerDomNode().clientWidth,
            height: height,
        });
    };

    /**
     * Handle changes in the editor
     * @param newValue - newValue
     * @returns
     */
    const handleEditorChange = (newValue: string) => {
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
        setIsLLMRejected(true);
        setDiffEditMode(false);
    };

    return (
        <StyledContent disabled={!isExpanded}>
            {LLMLoading && (
                <LoadingScreen.Trigger description="Generating..." />
            )}

            <Stack direction="column" spacing={1}>
                <Stack direction="row">
                    <StyledSelect
                        size={'small'}
                        fullWidth
                        disabled={cell.isLoading}
                        title={'Select Language'}
                        value={EDITOR_TYPE[cell.parameters.type].value}
                        SelectProps={{
                            IconComponent: KeyboardArrowDown,
                            style: {
                                height: '30px',
                                width: '180px',
                            },
                        }}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (
                                value !==
                                EDITOR_TYPE[cell.parameters.type].value
                            ) {
                                console.log(value);

                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.type',
                                        value: value,
                                    },
                                });
                            }
                        }}
                    >
                        {Array.from(
                            Object.values(EDITOR_TYPE),
                            (language, i) => (
                                <StyledSelectItem
                                    key={`${i}-${cell.id}-${language.name}`}
                                    value={language.value}
                                >
                                    <language.icon
                                        color="inherit"
                                        fontSize="small"
                                    />
                                    {language.name}
                                </StyledSelectItem>
                            ),
                        )}
                    </StyledSelect>
                </Stack>
                <StyledContainer>
                    {diffEditMode && (
                        <>
                            <DiffEditor
                                original={oldContentDiffEdit}
                                modified={newContentDiffEdit}
                                language={
                                    EDITOR_TYPE[cell.parameters.type].value
                                }
                                options={{
                                    lineNumbers: 'on',
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    scrollBeyondLastLine: false,
                                    lineHeight: EDITOR_LINE_HEIGHT,
                                    overviewRulerBorder: false,
                                    wordWrap: 'on',
                                }}
                                onMount={handleDiffEditorMount}
                            />
                            <Stack
                                direction="row"
                                alignItems={'center'}
                                justifyContent={'center'}
                            >
                                <Button
                                    title="Accept changes"
                                    size="small"
                                    color="primary"
                                    variant="contained"
                                    onClick={acceptDiffEditHandler}
                                >
                                    Keep
                                </Button>
                                <Button
                                    title="Reject changes"
                                    size="small"
                                    color="primary"
                                    variant="text"
                                    onClick={rejectDiffEditHandler}
                                >
                                    Reject
                                </Button>
                            </Stack>
                        </>
                    )}

                    {!diffEditMode && (
                        <Editor
                            value={cell.parameters.code}
                            language={
                                EDITOR_TYPE[cell.parameters.type].language
                            }
                            options={{
                                lineNumbers: 'on',
                                readOnly: false,
                                minimap: { enabled: false },
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                lineHeight: EDITOR_LINE_HEIGHT,
                                overviewRulerBorder: false,
                                wordWrap: 'on',
                            }}
                            onChange={handleEditorChange}
                            onMount={handleEditorMount}
                        />
                    )}
                </StyledContainer>
            </Stack>
        </StyledContent>
    );
});
