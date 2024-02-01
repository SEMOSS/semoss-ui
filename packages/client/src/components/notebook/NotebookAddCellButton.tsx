import { observer } from 'mobx-react-lite';
import { styled, Button } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import {
    ActionMessages,
    CellStateConfig,
    NewCellAction,
    QueryState,
} from '@/stores';
import { Add } from '@mui/icons-material';
import { DefaultCellTypes } from '../cell-defaults';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: 'unset!important',
}));

export const NotebookAddCellButton = observer(
    (props: { query: QueryState; previousCellId?: string }): JSX.Element => {
        const { query, previousCellId = '' } = props;
        const { state, notebook } = useBlocks();

        /**
         * Create a new cell
         */
        const appendCell = () => {
            try {
                const newCellId = `${Math.floor(Math.random() * 100000)}`;

                let config: NewCellAction['payload']['config'] = {
                    widget: DefaultCellTypes['code'].widget,
                    parameters: DefaultCellTypes['code'].parameters,
                };

                if (
                    previousCellId &&
                    state.queries[query.id].cells[previousCellId].cellType
                        .widget === 'code'
                ) {
                    const previousCellType =
                        state.queries[query.id].cells[previousCellId].parameters
                            ?.type ?? 'pixel';
                    config = {
                        widget: DefaultCellTypes['code'].widget,
                        parameters: {
                            ...DefaultCellTypes['code'].parameters,
                            type: previousCellType,
                        },
                    } as NewCellAction['payload']['config'];
                }

                // copy and add the step to the end
                state.dispatch({
                    message: ActionMessages.NEW_CELL,
                    payload: {
                        queryId: query.id,
                        cellId: newCellId,
                        previousCellId: previousCellId,
                        config: config as Omit<CellStateConfig, 'id'>,
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
                onClick={appendCell}
                startIcon={<Add />}
            >
                Add Cell
            </StyledButton>
        );
    },
);
