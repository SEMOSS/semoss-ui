import { observer } from 'mobx-react-lite';
import { styled, Button } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { ActionMessages, NewCellAction, QueryState } from '@/stores';
import { DefaultCellTypes } from '@/components/cell-defaults';
import { Add } from '@mui/icons-material';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: 'unset!important',
}));

export const NotebookAddCellButton = observer(
    (props: { query: QueryState; previousCellId?: string }): JSX.Element => {
        const { query, previousCellId = '' } = props;
        const { state, notebook } = useBlocks();

        /**
         * Append a new step after the current step
         * @param config - config to add
         */
        const appendCell = (config: NewCellAction['payload']['config']) => {
            try {
                const newCellId = `${Math.floor(
                    Math.random() * 1000000000000,
                )}`;
                // copy and add the step to the end
                state.dispatch({
                    message: ActionMessages.NEW_CELL,
                    payload: {
                        queryId: query.id,
                        cellId: newCellId,
                        previousCellId: previousCellId,
                        config: config,
                    },
                });
                notebook.selectCell(query.id, newCellId);
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
                    appendCell({
                        widget: DefaultCellTypes['code'].widget,
                        parameters: DefaultCellTypes['code'].parameters,
                    });
                }}
                startIcon={<Add />}
            >
                Add Cell
            </StyledButton>
        );
    },
);
