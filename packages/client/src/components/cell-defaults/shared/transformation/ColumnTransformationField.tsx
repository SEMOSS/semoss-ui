import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { TextField } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { runPixel } from '@/api';
import { CellState } from '@/stores';
import { TransformationTargetCell, ColumnInfo } from './transformation.types';

interface FrameHeaderInfo {
    headers: {
        alias: string;
        dataType: string;
    }[];
}

export type ColumnTransformationFieldComponent = (props: {
    cell: CellState;
    selectedColumns: ColumnInfo[] | ColumnInfo;
    columnTypes?: string[];
    insightId: string;
    multiple?: boolean;
    label?: string;
    disabled?: boolean;
    onChange: (newColumns: ColumnInfo[] | ColumnInfo) => void;
}) => JSX.Element;

export const ColumnTransformationField: ColumnTransformationFieldComponent =
    observer((props) => {
        const {
            cell,
            selectedColumns,
            columnTypes = undefined,
            insightId,
            multiple = false,
            label = undefined,
            disabled = false,
            onChange,
        } = props;

        const frameVariableName = computed(() => {
            return (cell.parameters.targetCell as TransformationTargetCell)
                .frameVariableName;
        }).get();

        const targetCell: CellState = computed(() => {
            return cell.query.cells[
                (cell.parameters.targetCell as TransformationTargetCell).id
            ];
        }).get();

        const [frameColumns, setFrameColumns] = useState<{
            loading: boolean;
            columns: ColumnInfo[];
        }>({
            loading: true,
            columns: [],
        });

        useEffect(() => {
            const fetchHeaders = async () => {
                let columns = [];
                try {
                    const response = await runPixel<
                        [{ headerInfo: FrameHeaderInfo }]
                    >(
                        `META | ${frameVariableName} | FrameHeaders (${
                            columnTypes
                                ? `headerTypes = ${JSON.stringify(columnTypes)}`
                                : ''
                        });`,
                        insightId,
                    );
                    columns =
                        response.pixelReturn[0].output.headerInfo.headers.map(
                            (header) => ({
                                name: header.alias,
                                dataType: header.dataType,
                            }),
                        );
                } catch (e) {
                    console.log(e);
                } finally {
                    setFrameColumns({
                        loading: false,
                        columns: columns,
                    });
                }
            };

            if (targetCell && targetCell.output) {
                fetchHeaders();
            }
        }, [targetCell ? targetCell.output : null]);

        return (
            <Autocomplete
                disabled={disabled}
                disableClearable
                size="small"
                loading={frameColumns.loading}
                value={
                    multiple
                        ? (selectedColumns as ColumnInfo[])
                        : (selectedColumns as ColumnInfo)
                }
                fullWidth
                multiple={multiple}
                onChange={(_, newValue: ColumnInfo[] | ColumnInfo) => {
                    onChange(newValue);
                }}
                options={frameColumns.columns}
                isOptionEqualToValue={(
                    option: ColumnInfo,
                    value: ColumnInfo,
                ) => {
                    return option.name === value.name;
                }}
                getOptionLabel={(option: ColumnInfo) => option.name}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        label={label ?? `Column${multiple ? 's' : ''}`}
                    />
                )}
            />
        );
    });
