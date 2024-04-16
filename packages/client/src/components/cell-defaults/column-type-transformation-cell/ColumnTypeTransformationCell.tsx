import { useMemo } from 'react';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, TextField, Typography } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import {
    ColumnInfoTwo,
    dataTypes,
    ColumnTransformationField2,
    TransformationCellInput2,
    Transformations,
    transformationColumnTypes2,
} from '../shared';
import { QueryImportCellDef } from '../query-import-cell';
import { observer } from 'mobx-react-lite';

export interface ColumnTypeTransformationCellDef {
    widget: 'column-type-transformation';
    parameters: {
        frame: string;
        column: ColumnInfoTwo;
        dataType: {
            type: string;
            value: dataTypes;
        };
    };
}

export const ColumnTypeTransformationCell: CellComponent<ColumnTypeTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const cellTransformation = computed(() => {
            return cell.widget;
        }).get();

        return (
            <TransformationCellInput2
                isExpanded={isExpanded}
                display={Transformations[cellTransformation].display}
                Icon={Transformations[cellTransformation].icon}
                cell={cell}
            >
                <Stack spacing={2}>
                    <ColumnTransformationField2
                        cell={cell}
                        selectedColumns={cell.parameters.column}
                        onChange={(newColumn: ColumnInfoTwo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.column',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <Autocomplete
                        disableClearable
                        size="small"
                        value={cell.parameters.dataType}
                        fullWidth
                        onChange={(
                            _,
                            newOperation: { type: string; value: dataTypes },
                        ) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.dataType',
                                    value: newOperation,
                                },
                            });
                        }}
                        getOptionLabel={(option) => option.value}
                        options={transformationColumnTypes2}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Operation"
                            />
                        )}
                    />
                </Stack>
            </TransformationCellInput2>
        );
    });
