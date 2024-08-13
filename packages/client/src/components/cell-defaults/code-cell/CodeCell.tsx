import { useRef, useState } from 'react';
import Editor, { DiffEditor, Monaco } from '@monaco-editor/react';
import { observer } from 'mobx-react-lite';
import { styled, Button, Stack } from '@semoss/ui';
import { Code, KeyboardArrowDown } from '@mui/icons-material';
import { CellDef, Variable } from '@/stores';
import { runPixel } from '@/api';
import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks, useLLM, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { StyledSelect, StyledSelectItem } from '../shared';

import { PythonIcon, RIcon } from './icons';
import { editor } from 'monaco-editor';

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
        icon: Code,
    },
} as const;

export interface CodeCellDef extends CellDef<'code'> {
    widget: 'code';
    parameters: {
        /** Type of code in the cell */
        type: 'r' | 'py' | 'pixel';

        /** Code rendered in the cell */
        code: string | string[];
    };
}

// best documentation on component versions of monaco editor and diffeditor
// https://www.npmjs.com/package/@monaco-editor/react
const StyledContent = styled('div')(({ theme }) => ({
    position: 'relative',
    width: '100%',
}));

const StyledContainer = styled('div')(({ theme }) => ({
    width: '98%',
}));

// track completion providers outside of render context
let completionItemProviders = {};
const EditorLanguages = {
    py: 'python',
    pixel: 'pixel',
    r: 'r',
};

const EditorLineHeight = 19;
// TODO:: Refactor height to account for Layout
export const CodeCell: CellComponent<CodeCellDef> = observer((props) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
    const monacoRef = useRef(null);
    const selectionRef = useRef(null);
    const LLMReturnRef = useRef('');

    const diffEditorRef = useRef<editor.IStandaloneDiffEditor>(null);

    const { cell, isExpanded } = props;
    const { state } = useBlocks();
    const { configStore } = useRootStore();

    const [editorHeight, setEditorHeight] = useState<number>(null);

    const [LLMLoading, setLLMLoading] = useState(false);
    const [diffEditMode, setDiffEditMode] = useState(false);
    const wordWrapRef = useRef(true);

    const [oldContentDiffEdit, setOldContentDiffEdit] = useState('');
    const [newContentDiffEdit, setNewContentDiffEdit] = useState('');

    const [isLLMRejected, setIsLLMRejected] = useState(false);
    const [count, setCount] = useState(0);
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

    const handleMount = (editor, monaco) => {
        // if diffedit code has been rejected set to old editor content
        if (isLLMRejected) {
            editor.getModel().setValue(oldContentDiffEdit);
            setIsLLMRejected(false);
        }

        // first time you set the height based on content Height
        editorRef.current = editor;
        monacoRef.current = monaco;
        const contentHeight = editor.getContentHeight();
        setEditorHeight(contentHeight);
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
            Object.entries(state.variables).forEach((keyValue) => {
                const id = keyValue[0];
                const variable = keyValue[1] as Variable;

                suggestions.push({
                    label: {
                        label: `{{${id}}}`,
                        description: `${state.getVariable(
                            variable.to,
                            variable.type,
                        )}`,
                    },
                    kind: monaco.languages.CompletionItemKind.Variable,
                    documentation: `This returns the value of ${id}, which is a ${variable.type}.  Feel free to change reference value in the variables panel on the left.`,
                    insertText: `{{${id}}}`,
                    range: range,
                });
            });

            return suggestions;
        };

        monaco.editor.defineTheme('custom-theme', {
            base: 'vs',
            inherit: false,
            rules: [],
            colors: {
                'editor.background': '#FAFAFA', // Background color
                // 'editor.lineHighlightBorder': '#FFF', // Border around selected line
            },
        });

        monaco.editor.setTheme('custom-theme');

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

            //define completion item providers by language
            if (language == 'pixel') {
                completionItemProviders = {
                    ...completionItemProviders,
                    pixel: monaco.languages.registerCompletionItemProvider(
                        language,
                        {
                            provideCompletionItems: async (model, position) => {
                                // getWordUntilPosition doesn't track when words are led by special characters
                                // we need to chack for wrapping curly brackets manually to know what to replace
                                const word =
                                    model.getWordUntilPosition(position);

                                //trigger reactor suggestions
                                if (word.word !== '') {
                                    const suggestions =
                                        configStore.generalReactors.map(
                                            (reactor) => ({
                                                label: {
                                                    label: reactor,
                                                    description:
                                                        'General Reactor',
                                                },
                                                kind: monaco.languages
                                                    .CompletionItemKind
                                                    .Function,
                                                insertText: reactor,
                                                range: {
                                                    startLineNumber:
                                                        position.lineNumber,
                                                    endLineNumber:
                                                        position.lineNumber,
                                                    startColumn:
                                                        word.startColumn,
                                                    endColumn: word.startColumn,
                                                },
                                            }),
                                        );

                                    return {
                                        suggestions: suggestions,
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
            } else {
                completionItemProviders = {
                    ...completionItemProviders,
                    [language]: monaco.languages.registerCompletionItemProvider(
                        language,
                        {
                            provideCompletionItems: async (model, position) => {
                                const word =
                                    model.getWordUntilPosition(position);

                                // word is not empty, completion was triggered by a non-special character
                                if (word.word !== '') {
                                    // return empty suggestions to trigger built in typeahead
                                    return {
                                        suggestions: [],
                                    };
                                }

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

                                const replaceRange = {
                                    startLineNumber: position.lineNumber,
                                    endLineNumber: position.lineNumber,
                                    startColumn:
                                        word.startColumn -
                                        replaceRangeStartBuffer,
                                    endColumn:
                                        word.endColumn + replaceRangeEndBuffer,
                                };

                                const variableSuggestions =
                                    generateSuggestions(replaceRange);

                                return { suggestions: variableSuggestions };
                            },
                            triggerCharacters: ['{'],
                        },
                    ),
                };
            }
        });

        const lines = editor.getModel().getLineCount();
        const lineContentHeight = lines * EditorLineHeight;
        const singleLineNoOverflow =
            lines === 1 && lineContentHeight == editor.getContentHeight();
        setEditorHeight(
            Math.max(
                (singleLineNoOverflow ? 1 : 2) * EditorLineHeight,
                lineContentHeight,
            ),
        );
    };

    const handleChange = (newValue: string) => {
        // set editor height to content height
        // set max height to equivalent of 25 lines
        const maxHeight = 25 * EditorLineHeight;
        setEditorHeight(
            Math.min(editorRef.current.getContentHeight(), maxHeight),
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
        setIsLLMRejected(true);
        setDiffEditMode(false);
    };

    const getHeight = () => {
        return isExpanded ? editorHeight : EditorLineHeight;
    };

    return (
        <StyledContent>
            {LLMLoading && (
                <LoadingScreen.Trigger description="Generating..." />
            )}

            <Stack direction="row" spacing={1}>
                <StyledContainer>
                    {!isExpanded ? (
                        <Editor
                            width="100%"
                            height={getHeight()}
                            language={
                                EDITOR_TYPE[cell.parameters.type].language
                            }
                            value={
                                typeof cell.parameters.code === 'string'
                                    ? cell.parameters.code
                                    : cell.parameters.code.join('\n')
                            }
                            options={{
                                scrollbar: { alwaysConsumeMouseWheel: false },
                                lineNumbers: 'on',
                                readOnly: false,
                                minimap: { enabled: false },
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                lineHeight: EDITOR_LINE_HEIGHT,
                                overviewRulerBorder: false,
                                wordWrap: 'on',
                                glyphMargin: false,
                                folding: false,
                                lineNumbersMinChars: 2,
                            }}
                            onChange={handleChange}
                            onMount={handleMount}
                        />
                    ) : diffEditMode ? (
                        <>
                            <DiffEditor
                                original={oldContentDiffEdit}
                                modified={newContentDiffEdit}
                                language={
                                    EDITOR_TYPE[cell.parameters.type].value
                                }
                                options={{
                                    // lineNumbers: 'on',
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
                    ) : (
                        <Editor
                            width="100%"
                            height={getHeight()}
                            language={
                                EDITOR_TYPE[cell.parameters.type].language
                            }
                            value={
                                typeof cell.parameters.code === 'string'
                                    ? cell.parameters.code
                                    : cell.parameters.code.join('\n')
                            }
                            options={{
                                scrollbar: { alwaysConsumeMouseWheel: false },
                                lineNumbers: 'on',
                                readOnly: false,
                                minimap: { enabled: false },
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                lineHeight: EDITOR_LINE_HEIGHT,
                                overviewRulerBorder: false,
                                wordWrap: 'on',
                                glyphMargin: false,
                                folding: false,
                                lineNumbersMinChars: 2,
                            }}
                            onChange={handleChange}
                            onMount={handleMount}
                        />
                    )}
                </StyledContainer>
                {/* {isExpanded && ( */}
                <Stack direction="row" sx={{ paddingLeft: '10px' }}>
                    <StyledSelect
                        size={'small'}
                        title={'Select Language'}
                        variant="standard"
                        value={EDITOR_TYPE[cell.parameters.type].value}
                        InputProps={{
                            disableUnderline: true,
                        }}
                        SelectProps={{
                            IconComponent: KeyboardArrowDown,
                        }}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (
                                value !==
                                EDITOR_TYPE[cell.parameters.type].value
                            ) {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.type',
                                        value: value,
                                    },
                                });

                                setCount(count + 1);
                            }
                        }}
                    >
                        {Array.from(
                            Object.values(EDITOR_TYPE),
                            (language, i) => (
                                <StyledSelectItem
                                    key={`${i}-${cell.id}-${language.name}`}
                                    value={language.value}
                                    // title={language.name} // throwing ts error
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
                {/* )} */}
            </Stack>
        </StyledContent>
    );
});
