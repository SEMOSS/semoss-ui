import Editor from '@monaco-editor/react';
import { styled } from '@semoss/ui';

import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks } from '@/hooks';
import { CodeCellDef } from './config';

const StyledContent = styled('div')(() => ({
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
}));

export const CodeCellInput: CellComponent<CodeCellDef> = (props) => {
    const { step } = props;
    const { state } = useBlocks();

    return (
        <StyledContent>
            <Editor
                width={'100%'}
                height={'100%'}
                value={step.parameters.code}
                language={step.parameters.type}
                options={{
                    lineNumbers: 'off',
                    readOnly: false,
                    minimap: { enabled: false },
                }}
                onChange={(newValue) => {
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
                }}
                onMount={(editor, monaco) => {
                    // update the action
                    editor.addAction({
                        id: 'run',
                        label: 'Run',
                        keybindings: [
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                        ],
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
                }}
            ></Editor>
        </StyledContent>
    );
};
