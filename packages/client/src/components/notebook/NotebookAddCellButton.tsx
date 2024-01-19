import { observer } from 'mobx-react-lite';
import { styled, Button } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { ActionMessages, NewStepAction, QueryState } from '@/stores';
import { DefaultCells } from '@/components/cell-defaults';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.text.secondary}`,
}));

export const NotebookAddCellButton = observer(
    (props: { query: QueryState }): JSX.Element => {
        const { query } = props;
        const { state } = useBlocks();

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
                        queryId: query.id,
                        stepId: `${Math.floor(Math.random() * 1000000000000)}`,
                        previousStepId: '',
                        config: config,
                    },
                });
            } catch (e) {
                console.error(e);
            }
        };

        return (
            <StyledButton
                title="Add new cell"
                variant="outlined"
                size="small"
                disabled={query.isLoading}
                onClick={() => {
                    appendStep({
                        widget: DefaultCells['code'].widget,
                        parameters: DefaultCells['code'].parameters,
                    });
                }}
            >
                Add Cell
            </StyledButton>
        );
    },
);
