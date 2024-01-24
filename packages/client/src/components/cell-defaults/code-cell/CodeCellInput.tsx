import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { styled } from '@semoss/ui';

import { ActionMessages, Block, CellComponent, QueryState } from '@/stores';
import { useBlocks } from '@/hooks';
import { CodeCellDef } from './config';
import { DefaultBlocks } from '@/components/block-defaults';
import { BLOCK_TYPE_INPUT } from '@/components/block-defaults/block-defaults.constants';

const EditorLineHeight = 19;

const StyledContent = styled('div')(() => ({
    position: 'relative',
    display: 'flex',
    '.monaco-editor': {
        overflow: 'visible',
    },
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
    const [editorHeight, setEditorHeight] = useState<number>(null);

    const { step } = props;
    const { state, notebook } = useBlocks();

    const handleMount = (editor, monaco) => {
        // first time you set the height based on content Height
        editorRef.current = editor;
        const contentHeight = editor.getContentHeight();
        setEditorHeight(contentHeight);
        // update the action
        editor.addAction({
            id: 'run',
            label: 'Run',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            run: (editor) => {
                const newValue = editor.getValue();

                // update with the new code
                state.dispatch({
                    message: ActionMessages.UPDATE_STEP,
                    payload: {
                        queryId: step.query.id,
                        stepId: step.id,
                        path: 'parameters.code',
                        value: newValue,
                    },
                });

                state.dispatch({
                    message: ActionMessages.RUN_STEP,
                    payload: {
                        queryId: step.query.id,
                        stepId: step.id,
                    },
                });
            },
        });

        // add editor completion suggestions based on block values and query outputs
        const generateSuggestions = (range) => {
            let suggestions = [];
            Object.values(state.blocks).forEach((block: Block) => {
                // only input block types will have values
                const inputBlockWidgets = Object.keys(DefaultBlocks).filter(
                    (block) => DefaultBlocks[block].type === BLOCK_TYPE_INPUT,
                );
                if (inputBlockWidgets.includes(block.widget)) {
                    suggestions.push({
                        label: {
                            label: `{{${block.id}.value}}`,
                            description: block.data?.value
                                ? JSON.stringify(block.data?.value)
                                : '',
                        },
                        kind: monaco.languages.CompletionItemKind.Variable,
                        documentation: `Reference the value of block ${block.id}`,
                        insertText: `{{${block.id}.value}}`,
                        range: range,
                    });
                }
            });
            notebook.queriesList.forEach((query: QueryState) => {
                // don't push the query that the step belongs to
                if (query.id !== step.query.id) {
                    suggestions.push({
                        label: {
                            label: `{{${query.id}.data}}`,
                            description: query.output
                                ? JSON.stringify(query.output)
                                : '',
                        },
                        kind: monaco.languages.CompletionItemKind.Variable,
                        documentation: `Reference the output of query ${query.id}`,
                        insertText: `{{${query.id}.data}}`,
                        range: range,
                        detail: query.id,
                    });
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
            if (!!completionItemProviders[language]) {
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

                            // triggerCharacters is triggered per character, so we need to check if the users has typed "{" or "{{"
                            var specialCharacterStartRange = {
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
                            var specialCharacterEndRange = {
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
            (editorRef.current.getModel().getLineCount() + 2) *
                EditorLineHeight,
        );
        if (step.isLoading) {
            return;
        }

        state.dispatch({
            message: ActionMessages.UPDATE_STEP,
            payload: {
                queryId: step.query.id,
                stepId: step.id,
                path: 'parameters.code',
                value: newValue,
            },
        });
    };

    return (
        <StyledContent>
            <Editor
                width="100%"
                height={editorHeight}
                value={step.parameters.code}
                language={EditorLanguages[step.parameters.type]}
                options={{
                    lineNumbers: 'on',
                    readOnly: false,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    lineHeight: EditorLineHeight,
                }}
                onChange={handleChange}
                onMount={handleMount}
            />
        </StyledContent>
    );
};
