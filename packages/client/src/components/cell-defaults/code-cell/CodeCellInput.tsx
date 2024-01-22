import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { styled } from '@semoss/ui';

import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks } from '@/hooks';
import { CodeCellDef } from './config';

const StyledContent = styled('div')(() => ({
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
}));

const EditorLineHeight = 19;

export const CodeCellInput: CellComponent<CodeCellDef> = (props) => {
    const editorRef = useRef(null);
    const [editorHeight, setEditorHeight] = useState<number>(null);

    const { step } = props;
    const { state } = useBlocks();

    const getEditorLanguage = (stepLanguage: string) => {
        switch (stepLanguage) {
            case 'py':
                return 'python';
            default:
                return stepLanguage;
        }
    };

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
    };

    const handleChange = (newValue: string) => {
        setEditorHeight(
            editorRef.current.getModel().getLineCount() * EditorLineHeight,
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
                language={getEditorLanguage(step.parameters.type)}
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
