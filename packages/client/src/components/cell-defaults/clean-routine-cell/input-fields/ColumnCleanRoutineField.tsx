import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { getFrameHeaderTypesPipeline } from '../clean-routine-pipeline-utils';
import { TextField } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { runPixel } from '@/api';

interface FrameHeaderInfo {
    headers: {
        alias: string;
    }[];
}

export type ColumnCleanRoutineFieldComponent = (props: {
    selectedColumns: string[];
    frameVariableName: string;
    columnTypes?: string[];
    insightId: string;
    onChange: (selectedColumns: string[]) => void;
}) => JSX.Element;

export const ColumnCleanRoutineField: ColumnCleanRoutineFieldComponent =
    observer((props) => {
        const {
            selectedColumns,
            frameVariableName,
            columnTypes = undefined,
            insightId,
            onChange,
        } = props;

        const [frameColumns, setFrameColumns] = useState({
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
                            (header) => header.alias,
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
        }, []);

        return (
            <Autocomplete
                size="small"
                loading={frameColumns.loading}
                value={selectedColumns}
                fullWidth
                multiple
                onChange={(_, newValue: string[]) => {
                    onChange(newValue);
                }}
                options={frameColumns.columns}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        placeholder="Select columns"
                    />
                )}
            />
        );
    });
