import { useBlocks } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
import { CleanRoutineCellDef } from '../config';
import { ColumnCleanRoutineField } from '../input-fields';
import { QueryImportCellDef } from '../../query-import-cell';
import { CleanRoutine, UppercaseCleanRoutineDef } from '../clean.types';

export const UppercaseCleanRoutineCellInput: CellComponent<CleanRoutineCellDef> =
    observer((props) => {
        const { cell } = props;
        const { state } = useBlocks();

        const helpText = `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a clean routine.`;

        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        if (
            targetCell &&
            (!targetCell.isExecuted || !targetCell.output) &&
            !(
                cell.parameters
                    .cleanRoutine as CleanRoutine<UppercaseCleanRoutineDef>
            ).parameters.columns.length
        ) {
            return (
                <Stack width="100%" paddingY={0.75}>
                    <Typography variant="caption">
                        <em>{helpText}</em>
                    </Typography>
                </Stack>
            );
        }

        return (
            <Stack width="100%" paddingY={0.75}>
                <Typography variant="caption">
                    {targetCell &&
                    (!targetCell.isExecuted || !targetCell.output)
                        ? helpText
                        : 'Change the values of the selected columns to uppercase.'}
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
