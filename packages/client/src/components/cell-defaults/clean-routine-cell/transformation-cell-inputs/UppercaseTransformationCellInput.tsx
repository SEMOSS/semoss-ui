import { useBlocks } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
import { TransformationCellDef } from '../config';
import { ColumnTransformationField } from '../input-fields';
import { QueryImportCellDef } from '../../query-import-cell';
import {
    Transformation,
    ColumnInfo,
    UppercaseTransformationDef,
} from '../transformation.types';

export const UppercaseTransformationCellInput: CellComponent<TransformationCellDef> =
    observer((props) => {
        const { cell } = props;
        const { state } = useBlocks();

        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        const cellTransformation: Transformation<UppercaseTransformationDef> =
            computed(() => {
                return cell.parameters
                    .transformation as Transformation<UppercaseTransformationDef>;
            }).get();

        const doesFrameExist: boolean = computed(() => {
            return (
                !!targetCell && (targetCell.isExecuted || !!targetCell.output)
            );
        }).get();

        const helpText = cell.parameters.targetCell.id
            ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
            : 'A target frame variable must be defined in order to apply a transformation.';

        if (!doesFrameExist && !cellTransformation.parameters.columns.length) {
            return (
                <Stack width="100%" paddingY={0.75}>
                    <Typography variant="caption">
                        <em>{helpText}</em>
                    </Typography>
                </Stack>
            );
        }

        return (
            <Stack spacing={2}>
                <Typography variant="caption">
                    {!doesFrameExist ? (
                        <em>{helpText}</em>
                    ) : (
                        'Change the values of the selected columns to uppercase'
                    )}
                </Typography>
                <ColumnTransformationField
                    disabled={!doesFrameExist}
                    cell={cell}
                    selectedColumns={
                        cellTransformation.parameters.columns ?? []
                    }
                    multiple
                    insightId={state.insightId}
                    columnTypes={['STRING']}
                    onChange={(newColumns: ColumnInfo[]) => {
                        state.dispatch({
                            message: ActionMessages.UPDATE_CELL,
                            payload: {
                                queryId: cell.query.id,
                                cellId: cell.id,
                                path: 'parameters.transformation.parameters.columns',
                                value: newColumns,
                            },
                        });
                    }}
                />
            </Stack>
        );
    });
