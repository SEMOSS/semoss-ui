import { observer } from 'mobx-react-lite';
import { styled, Button } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { ActionMessages, NewStepAction, QueryState } from '@/stores';
import { DefaultCells } from '@/components/cell-defaults';
import { Add } from '@mui/icons-material';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: 'unset!important',
}));

export const NotebookAddCellButton = observer(
    (props: { query: QueryState; previousStepId?: string }): JSX.Element => {
        const { query, previousStepId = '' } = props;
        const { state, notebook } = useBlocks();

        /**
         * Append a new step after the current step
         * @param config - config to add
         */
        const appendStep = (config: NewStepAction['payload']['config']) => {
            try {
                const newStepId = `${Math.floor(
                    Math.random() * 1000000000000,
                )}`;
                // copy and add the step to the end
                state.dispatch({
                    message: ActionMessages.NEW_STEP,
                    payload: {
                        queryId: query.id,
                        stepId: newStepId,
                        previousStepId: previousStepId,
                        config: config,
                    },
                });
                notebook.selectStep(query.id, newStepId);
            } catch (e) {
                console.error(e);
            }
        };

        return (
            <StyledButton
                title="Add new cell"
                variant="contained"
                size="small"
                disabled={query.isLoading}
                onClick={() => {
                    appendStep({
                        widget: DefaultCells['code'].widget,
                        parameters: DefaultCells['code'].parameters,
                    });
                }}
                startIcon={<Add />}
            >
                Add Cell
            </StyledButton>
        );
    },
);
