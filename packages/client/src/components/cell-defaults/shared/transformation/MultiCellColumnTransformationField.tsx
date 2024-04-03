import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { TextField } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { runPixel } from '@/api';
import { CellState } from '@/stores';
import { TransformationTargetCell, ColumnInfo } from './transformation.types';
import { useBlocksPixel } from '@/hooks/useBlocksPixel';

interface FrameHeaderInfo {
    headers: {
        alias: string;
        dataType: string;
    }[];
}

export type MultiCellColumnTransformationFieldComponent = (props: {
    cell: CellState;
    cellTarget: unknown;
    selectedColumns: ColumnInfo[] | ColumnInfo;
    columnTypes?: string[];
    multiple?: boolean;
    label?: string;
    disabled?: boolean;
    onChange: (newColumns: ColumnInfo[] | ColumnInfo) => void;
}) => JSX.Element;

export const MultiCellColumnTransformationField: MultiCellColumnTransformationFieldComponent =
    observer((props) => {
        const {
            cell,
            cellTarget,
            selectedColumns,
            columnTypes = undefined,
            multiple = false,
            label = undefined,
            disabled = false,
            onChange,
        } = props;

        const frameVariableName = computed(() => {
            return (cellTarget as TransformationTargetCell).frameVariableName;
        }).get();

        const targetCell: CellState = computed(() => {
            return cell.query.cells[
                (cellTarget as TransformationTargetCell).id
            ];
        }).get();

        const [frameHeaders, setFrameHeaders] = useState<{
            loading: boolean;
            columns: ColumnInfo[];
        }>({
            loading: true,
            columns: [],
        });

        const frameHeaderPixelReturn = useBlocksPixel<{
            headerInfo: FrameHeaderInfo;
        }>(
            `META | ${frameVariableName} | FrameHeaders (${
                columnTypes
                    ? `headerTypes = ${JSON.stringify(columnTypes)}`
                    : ''
            });`,
        );

        useEffect(() => {
            if (frameHeaderPixelReturn.status !== 'SUCCESS') {
                return;
            }

            const columns = frameHeaderPixelReturn.data.headerInfo.headers.map(
                (header) => ({
                    name: header.alias,
                    dataType: header.dataType,
                }),
            );

            setFrameHeaders({
                loading: false,
                columns: columns,
            });
        }, [frameHeaderPixelReturn.status, frameHeaderPixelReturn.data]);

        useEffect(() => {
            if (targetCell && targetCell.output) {
                frameHeaderPixelReturn.refresh();
            }
        }, [targetCell ? targetCell.output : null]);

        return (
            <Autocomplete
                disabled={disabled}
                disableClearable
                size="small"
                loading={frameHeaders.loading}
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
                options={frameHeaders?.columns ?? []}
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
