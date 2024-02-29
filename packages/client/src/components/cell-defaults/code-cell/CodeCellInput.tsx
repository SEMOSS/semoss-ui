import { useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { styled, Button, Menu, MenuProps, List, Stack } from '@semoss/ui';
import { KeyboardArrowDown, CodeOff } from '@mui/icons-material';

import { ActionMessages, Block, CellComponent, QueryState } from '@/stores';
import { useBlocks } from '@/hooks';
import { DefaultBlocks } from '@/components/block-defaults';
import { BLOCK_TYPE_INPUT } from '@/components/block-defaults/block-defaults.constants';

import { CodeCellDef } from './config';
import { PythonIcon, RIcon } from './icons';
import { editor } from 'monaco-editor';

const EDITOR_LINEHEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500; // ~25 lines

const EDITOR_OPTIONS = {
    py: {
        display: 'Python',
        value: 'py',
        icon: PythonIcon,
    },
    r: {
        display: 'R',
        value: 'r',
        icon: RIcon,
    },
    pixel: {
        display: 'Pixel',
        value: 'pixel',
        icon: CodeOff,
    },
};

const StyledContent = styled('div', {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled: boolean }>(({ disabled }) => ({
    position: 'relative',
    width: '100%',
    pointerEvents: disabled ? 'none' : 'unset',
}));

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.divider}`,
}));

const StyledButtonLabel = styled('span')(({ theme }) => ({
    width: theme.spacing(5.5),
    display: 'block',
    textAlign: 'start',
}));

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        marginTop: theme.spacing(1),
    },
    '.MuiList-root': {
        padding: 0,
    },
}));

const StyledListIcon = styled(List.Icon)(({ theme }) => ({
    width: theme.spacing(4),
    minWidth: 'unset',
}));

const StyledContainer = styled('div')(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5),
}));

// track completion providers outside of render context
let completionItemProviders = {};

// TODO:: Refactor height to account for Layout
export const CodeCellInput: CellComponent<CodeCellDef> = (props) => {
    const editorRef = useRef(null);
    const [editorHeight, setEditorHeight] = useState<number>(null);

    // track the popover menu
    const [menuAnchorEle, setMenuAnchorEle] = useState<null | HTMLElement>(
        null,
    );
    const isMenuOpen = Boolean(menuAnchorEle);

    const { cell, isExpanded } = props;
    const { state, notebook } = useBlocks();

    const handleMount = (
        editor: editor.IStandaloneCodeEditor,
        monaco: Monaco,
    ) => {
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
        Object.values(EDITOR_OPTIONS).forEach((language) => {
            // if suggestion already exist, dispose and re-add
            // this may be superfluous at times but we re-add instead of setting up suggestions once
            // so that we are pulling more real-time values off of the blocks/queries
            if (completionItemProviders[language.value]) {
                completionItemProviders[language.value].dispose();
            }
            completionItemProviders = {
                ...completionItemProviders,
                [language.value]:
                    monaco.languages.registerCompletionItemProvider(
                        language.value,
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

        // set the initial height
        let height = 0;

        // if expanded scale to lines, but do not go over the max height
        if (isExpanded) {
            height = Math.max(editor.getContentHeight(), EDITOR_MAX_HEIGHT);
        }

        // add the trailing line
        setEditorHeight(height + EDITOR_LINEHEIGHT);
    };

    const handleChange = (newValue: string) => {
        // TODO: we should probably disable when running

        // get the height
        const height = Math.min(
            editorRef.current.getContentHeight(),
            EDITOR_MAX_HEIGHT,
        );

        // add the trailing line
        setEditorHeight(height + EDITOR_LINEHEIGHT);

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
        return isExpanded ? editorHeight : EDITOR_LINEHEIGHT;
    };

    /**
     * Close the Language menu
     */
    const handleMenuClose = () => {
        setMenuAnchorEle(null);
    };

    return (
        <StyledContent disabled={!isExpanded}>
            <Stack direction="column" spacing={2}>
                <Stack direction="row">
                    <StyledButton
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen ? 'true' : undefined}
                        variant="outlined"
                        disableElevation
                        disabled={cell.isLoading}
                        size="small"
                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                            event.preventDefault();
                            setMenuAnchorEle(event.currentTarget);
                        }}
                        startIcon={
                            cell.parameters.type === 'py' ? (
                                <PythonIcon color="inherit" fontSize="small" />
                            ) : cell.parameters.type === 'r' ? (
                                <RIcon color="inherit" fontSize="small" />
                            ) : (
                                <CodeOff color="inherit" fontSize="small" />
                            )
                        }
                        endIcon={<KeyboardArrowDown />}
                        title="Select Language"
                    >
                        <StyledButtonLabel>
                            {EDITOR_OPTIONS[cell.parameters.type].display}
                        </StyledButtonLabel>
                    </StyledButton>
                </Stack>
                <StyledMenu
                    anchorEl={menuAnchorEle}
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                >
                    <List dense>
                        {Array.from(
                            Object.values(EDITOR_OPTIONS),
                            (language) => (
                                <List.Item
                                    disablePadding
                                    key={`${cell.id}-${language.value}`}
                                >
                                    <List.ItemButton
                                        onClick={() => {
                                            state.dispatch({
                                                message:
                                                    ActionMessages.UPDATE_CELL,
                                                payload: {
                                                    queryId: cell.query.id,
                                                    cellId: cell.id,
                                                    path: 'parameters.type',
                                                    value: language.value,
                                                },
                                            });
                                            handleMenuClose();
                                        }}
                                    >
                                        <StyledListIcon>
                                            <language.icon
                                                color="inherit"
                                                fontSize="small"
                                            />
                                        </StyledListIcon>
                                        <List.ItemText
                                            primary={language.display}
                                        />
                                    </List.ItemButton>
                                </List.Item>
                            ),
                        )}
                    </List>
                </StyledMenu>
                <StyledContainer>
                    <Editor
                        width="100%"
                        height={getHeight()}
                        value={cell.parameters.code}
                        language={EDITOR_OPTIONS[cell.parameters.type].value}
                        options={{
                            lineNumbers: 'on',
                            readOnly: false,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            lineHeight: EDITOR_LINEHEIGHT,
                            overviewRulerBorder: false,
                            wordWrap: 'on',
                        }}
                        onChange={handleChange}
                        onMount={handleMount}
                    />
                </StyledContainer>
            </Stack>
        </StyledContent>
    );
};
