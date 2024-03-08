import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, TextField, Typography } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import {
    Transformation,
    ColumnInfo,
    ColumnTransformationField,
    TransformationCellInput,
    transformationColumnTypes,
} from '../shared';
import {
    ColumnTypeTransformationCellDef,
    ColumnTypeTransformationDef,
} from './config';
import { QueryImportCellDef } from '../query-import-cell';
import { FontDownload } from '@mui/icons-material';

export const ColumnTypeTransformationCellInput: CellComponent<
    ColumnTypeTransformationCellDef
> = (props) => {
    const { cell, isExpanded } = props;
    const { state } = useBlocks();

    const targetCell: CellState<QueryImportCellDef> = computed(() => {
        return cell.query.cells[
            cell.parameters.targetCell.id
        ] as CellState<QueryImportCellDef>;
    }).get();

    const cellTransformation: Transformation<ColumnTypeTransformationDef> =
        computed(() => {
            return cell.parameters
                .transformation as Transformation<ColumnTypeTransformationDef>;
        }).get();

    const doesFrameExist: boolean = computed(() => {
        return !!targetCell && (targetCell.isExecuted || !!targetCell.output);
    }).get();

    const helpText = cell.parameters.targetCell.id
        ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
        : 'A Python or R target frame variable must be defined in order to apply a transformation.';

    if (!doesFrameExist && !cellTransformation.parameters.column) {
        return (
            <TransformationCellInput
                isExpanded={isExpanded}
                display="ColumnType"
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
            display="Column Type"
            Icon={FontDownload}
        >
            <Stack spacing={2}>
                <Typography variant="caption">
                    {!doesFrameExist ? (
                        <em>{helpText}</em>
                    ) : (
                        'Change the type of the selected column'
                    )}
                </Typography>
                <ColumnTransformationField
                    disabled={!doesFrameExist}
                    cell={cell}
                    selectedColumns={cellTransformation.parameters.column}
                    onChange={(newColumn: ColumnInfo) => {
                        state.dispatch({
                            message: ActionMessages.UPDATE_CELL,
                            payload: {
                                queryId: cell.query.id,
                                cellId: cell.id,
                                path: 'parameters.transformation.parameters.column',
                                value: newColumn,
                            },
                        });
                    }}
                />
                <Autocomplete
                    disableClearable
                    disabled={!doesFrameExist}
                    size="small"
                    value={cellTransformation.parameters.columnType}
                    fullWidth
                    onChange={(_, newOperation: string) => {
                        state.dispatch({
                            message: ActionMessages.UPDATE_CELL,
                            payload: {
                                queryId: cell.query.id,
                                cellId: cell.id,
                                path: 'parameters.transformation.parameters.columnType',
                                value: newOperation,
                            },
                        });
                    }}
                    options={transformationColumnTypes}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            label="Operation"
                        />
                    )}
                />
            </Stack>
        </TransformationCellInput>
    );
};
