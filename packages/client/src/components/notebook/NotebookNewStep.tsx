import { observer } from 'mobx-react-lite';
import { styled, ButtonGroup } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { StepState, ActionMessages, NewStepAction } from '@/stores';
import { DefaultCells } from '@/components/cell-defaults';

const StyledNewStep = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(2),
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
}));

interface NotebookNewStepProps {
    /** Step to add the new step relative to */
    step: StepState | null;
}

/**
 * Render the content of a step in the notebook
 */
export const NotebookNewStep = observer(
    (props: NotebookNewStepProps): JSX.Element => {
        const { step = null } = props;
        const { state, notebook } = useBlocks();

        /**
         * Append a new step after the current step
         * @param config - config to add
         */
        const appendStep = (config: NewStepAction['payload']['config']) => {
            try {
                // copy and add the step to the end
                state.dispatch({
                    message: ActionMessages.NEW_STEP,
                    payload: {
                        queryId: step
                            ? step.query.id
                            : notebook.selectedQuery.id,
                        stepId: `${Math.floor(Math.random() * 1000000000000)}`,
                        previousStepId: step ? step.id : '',
                        config: config,
                    },
                });
            } catch (e) {
                console.error(e);
            }
        };

        return (
            <StyledNewStep>
                <ButtonGroup size="small">
                    <ButtonGroup.Item
                        title="Add a new code cell"
                        variant="outlined"
                        onClick={() => {
                            appendStep({
                                widget: DefaultCells['code'].widget,
                                parameters: DefaultCells['code'].parameters,
                            });
                        }}
                    >
                        Add Cell
                    </ButtonGroup.Item>
                    <ButtonGroup.Item
                        title="Add a new Py cell"
                        variant="outlined"
                        onClick={() => {
                            appendStep({
                                widget: DefaultCells['code'].widget,
                                parameters: {
                                    ...DefaultCells['code'].parameters,
                                    type: 'py',
                                },
                            });
                        }}
                    >
                        Py
                    </ButtonGroup.Item>
                    <ButtonGroup.Item
                        title="Add a new R cell"
                        variant="outlined"
                        onClick={() => {
                            appendStep({
                                widget: DefaultCells['code'].widget,
                                parameters: {
                                    ...DefaultCells['code'].parameters,
                                    type: 'r',
                                },
                            });
                        }}
                    >
                        R
                    </ButtonGroup.Item>
                </ButtonGroup>
            </StyledNewStep>
        );
    },
);
