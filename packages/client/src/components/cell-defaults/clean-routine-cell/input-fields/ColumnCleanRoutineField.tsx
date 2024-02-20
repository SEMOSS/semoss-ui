import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { getFrameHeaderTypesPipeline } from '../clean-routine-pipeline-utils';
import { TextField } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { runPixel } from '@/api';
import { CellState } from '@/stores';
import { CleanRoutineTargetCell, ColumnInfo } from '../clean.types';

interface FrameHeaderInfo {
    headers: {
        alias: string;
        dataType: string;
    }[];
}

export type ColumnCleanRoutineFieldComponent = (props: {
    cell: CellState;
    selectedColumns: ColumnInfo[] | ColumnInfo;
    columnTypes?: string[];
    insightId: string;
    multiple?: boolean;
    label?: string;
    onChange: (selectedColumns: ColumnInfo[] | ColumnInfo) => void;
}) => JSX.Element;

export const ColumnCleanRoutineField: ColumnCleanRoutineFieldComponent =
    observer((props) => {
        const {
            cell,
            selectedColumns,
            columnTypes = undefined,
            insightId,
            multiple = false,
            label = undefined,
            onChange,
        } = props;

        const frameVariableName = computed(() => {
            return (cell.parameters.targetCell as CleanRoutineTargetCell)
                .frameVariableName;
        }).get();

        const targetCell: CellState = computed(() => {
            return cell.query.cells[
                (cell.parameters.targetCell as CleanRoutineTargetCell).id
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
                try {
                    const response = await runPixel<
                        [{ headerInfo: FrameHeaderInfo }]
                    >(
                        getFrameHeaderTypesPipeline(
                            frameVariableName,
                            columnTypes,
                        ),
                        insightId,
                    );
                    const columns =
                        response.pixelReturn[0].output.headerInfo.headers.map(
                            (header) => ({
                                name: header.alias,
                                dataType: header.dataType,
                            }),
                        );
                    setFrameColumns({
                        loading: false,
                        columns: columns,
                    });
                } catch (e) {
                    console.log(e);
                    setFrameColumns({
                        loading: false,
                        columns: [],
                    });
                }
            };

            fetchHeaders();
        }, [targetCell.output]);

        return (
            <Autocomplete
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
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        label={label}
                        placeholder="Select columns"
                    />
                )}
            />
        );
    });
