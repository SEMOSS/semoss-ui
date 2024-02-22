import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
import {
    Transformation,
    ColumnInfo,
    ColumnTransformationField,
    TransformationCellInput,
} from '../shared';
import {
    UppercaseTransformationCellDef,
    UppercaseTransformationDef,
} from './config';
import { QueryImportCellDef } from '../query-import-cell';
import { FontDownload } from '@mui/icons-material';

export const UppercaseTransformationCellInput: CellComponent<
    UppercaseTransformationCellDef
> = (props) => {
    const { cell, isExpanded } = props;
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
        return !!targetCell && (targetCell.isExecuted || !!targetCell.output);
    }).get();

    const helpText = cell.parameters.targetCell.id
        ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
        : 'A Python or R target frame variable must be defined in order to apply a transformation.';

    if (!doesFrameExist && !cellTransformation.parameters.columns.length) {
        return (
            <TransformationCellInput
                isExpanded={isExpanded}
                display="Uppercase"
                Icon={FontDownload}
            >
                <Stack width="100%" paddingY={0.75}>
                    <Typography variant="caption">
                        <em>{helpText}</em>
                    </Typography>
                </Stack>
            </TransformationCellInput>
        );
    }

    return (
        <TransformationCellInput
            isExpanded={isExpanded}
            display="Uppercase"
            Icon={FontDownload}
        >
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
        </TransformationCellInput>
    );
};
