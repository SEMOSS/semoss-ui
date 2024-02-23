import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { styled } from '@semoss/ui';

import { ActionMessages, Block, CellComponent, QueryState } from '@/stores';
import { useBlocks } from '@/hooks';
import { CodeCellDef } from './config';
import { DefaultBlocks } from '@/components/block-defaults';
import { BLOCK_TYPE_INPUT } from '@/components/block-defaults/block-defaults.constants';

const EditorLineHeight = 19;

const StyledContent = styled('div', {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled: boolean }>(({ theme, disabled }) => ({
    paddingTop: theme.spacing(0.75),
    margin: '0!important',
    width: '100%',
    position: 'relative',
    display: 'flex',
    pointerEvents: disabled ? 'none' : 'unset',
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

    const { cell, isExpanded } = props;
    const { state, notebook } = useBlocks();

    const handleMount = (editor, monaco) => {
        editorRef.current = editor;
        // update the action
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

        const lineContentHeight =
            editor.getModel().getLineCount() * EditorLineHeight;
        setEditorHeight(Math.max(2 * EditorLineHeight, lineContentHeight));
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

    const getHeight = () => {
        return isExpanded ? editorHeight : EditorLineHeight;
    };

    return (
        <StyledContent disabled={!isExpanded}>
            <Editor
                width="100%"
                height={getHeight()}
                value={cell.parameters.code}
                language={EditorLanguages[cell.parameters.type]}
                options={{
                    lineNumbers: 'on',
                    readOnly: false,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineHeight: EditorLineHeight,
                    overviewRulerBorder: false,
                    wordWrap: 'on',
                }}
                onChange={handleChange}
                onMount={handleMount}
            />
        </StyledContent>
    );
};
