import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { styled } from '@semoss/ui';

import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks } from '@/hooks';
import { QueryImportCellDef } from './config';

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
}));

export const QueryImportCellInput: CellComponent<QueryImportCellDef> = (
    props,
) => {
    const editorRef = useRef(null);
    const [editorHeight, setEditorHeight] = useState<number>(null);

    const { cell, isExpanded } = props;
    const { state } = useBlocks();

    const handleMount = (editor, monaco) => {
        // first time you set the height based on content Height
        editorRef.current = editor;
        const contentHeight = editor.getContentHeight();
        setEditorHeight(contentHeight);
        // update the action
        editor.addAction({
            id: 'run',
            label: 'Run',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Enter],
            run: (editor) => {
                const newValue = editor.getValue();

                // update with the new code
                state.dispatch({
                    message: ActionMessages.UPDATE_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                        path: 'parameters.selectQuery',
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

    return (
        <StyledContent disabled={!isExpanded}>
            <Editor
                width="100%"
                height={isExpanded ? editorHeight : EditorLineHeight}
                value={cell.parameters.selectQuery}
                language="sql" /** todo: language support? can we tell this from the database type? */
                options={{
                    lineNumbers: 'on',
                    readOnly: false,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    lineHeight: EditorLineHeight,
                    overviewRulerBorder: false,
                }}
                onChange={handleChange}
                onMount={handleMount}
            />
        </StyledContent>
    );
};
