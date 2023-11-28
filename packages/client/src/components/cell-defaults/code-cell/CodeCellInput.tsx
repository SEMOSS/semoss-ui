import Editor from '@monaco-editor/react';
import { styled } from '@semoss/ui';

import { CellComponent } from '@/stores';
import { useNotebook } from '@/hooks';
import { CodeCellDef } from './config';

const StyledContent = styled('div')(() => ({
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
}));

export const CodeCellInput: CellComponent<CodeCellDef> = (props) => {
    const { step } = props;
    const { notebook } = useNotebook();

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

                    notebook.updateStep(
                        step.query.id,
                        step.id,
                        'parameters.code',
                        newValue,
                    );
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
                            notebook.updateStep(
                                step.query.id,
                                step.id,
                                'parameters.code',
                                newValue,
                            );

                            // run it
                            notebook.runStep(step.query.id, step.id);
                        },
                    });
                }}
            ></Editor>
        </StyledContent>
    );
};
