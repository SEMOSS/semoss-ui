import { useBlocks } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { CellComponent, ActionMessages } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
import { CleanRoutineCellDef } from '../config';
import { ColumnCleanRoutineField } from '../input-fields';

export const UppercaseCleanRoutineCellInput: CellComponent<CleanRoutineCellDef> =
    observer((props) => {
        const { cell } = props;
        const { state } = useBlocks();

        return (
            <Stack width="100%" paddingY={0.75}>
                <Typography variant="caption">
                    Change the values of the selected columns to uppercase.
                </Typography>
                <ColumnCleanRoutineField
                    cell={cell}
                    selectedColumns={
                        (cell.parameters.cleanRoutine.parameters
                            ?.columns as string[]) ?? []
                    }
                    insightId={state.insightId}
                    columnTypes={['STRING']}
                    onChange={(newColumns) => {
                        state.dispatch({
                            message: ActionMessages.UPDATE_CELL,
                            payload: {
                                queryId: cell.query.id,
                                cellId: cell.id,
                                path: 'parameters.cleanRoutine.parameters.columns',
                                value: newColumns,
                            },
                        });
                    }}
                />
            </Stack>
        );
    });
