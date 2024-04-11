import { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { TextField } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { CellState } from '@/stores';
import { ColumnInfo } from './transformation.types';
import { useBlocksPixel } from '@/hooks/useBlocksPixel';

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
    multiple?: boolean;
    label?: string;
    disabled?: boolean;
    onChange: (newColumns: ColumnInfo[] | ColumnInfo) => void;
}) => JSX.Element;

export const ColumnTransformationField2: ColumnTransformationFieldComponent =
    observer((props) => {
        const {
            cell,
            selectedColumns,
            columnTypes = undefined,
            multiple = false,
            label = undefined,
            disabled = false,
            onChange,
        } = props;

        // Used to not clear previously saved columns
        const hasMounted = useRef(false);

        const frameVariableName = computed(() => {
            return cell.parameters.frame;
        }).get();

        // Go get the cell that executes the frame. In order to see if Frame can be used to execute
        // Need a eloquent way to check if frame is ready
        const executedFrame = computed(() => {
            const cellsWithFrames = [];
            Object.values(cell.query.cells).forEach((c) => {
                if (c.widget === 'query-import') {
                    cellsWithFrames.push(c);
                }
            });

            const cellFrameRelatives = [];
            cellsWithFrames.forEach((c) => {
                if (c.parameters.frameVariableName === cell.parameters.frame) {
                    cellFrameRelatives.push(c);
                }
            });

            let frameOutput = false;

            cellFrameRelatives.forEach((c) => {
                if (c.output) {
                    frameOutput = true;
                }
            });

            return frameOutput;
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
            executedFrame
                ? `META | ${frameVariableName} | FrameHeaders (${
                      columnTypes
                          ? `headerTypes = ${JSON.stringify(columnTypes)}`
                          : ''
                  });`
                : '',
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
            // Clear previously selected headers (only after first render)
            if (hasMounted.current) {
                debugger;
                onChange([]);
            }

            // Update flag on every render
            hasMounted.current = true;

            if (executedFrame) {
                frameHeaderPixelReturn.refresh();
            } else {
                debugger;
                setFrameHeaders({
                    loading: true,
                    columns: [],
                });
            }
        }, [executedFrame, cell.parameters.frame]);

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
