import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { TextField, styled } from '@semoss/ui';
import {
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
} from '@mui/material';
import { CellState } from '@/stores';
import {
    TransformationTargetCell,
    ColumnInfoTwo,
    ColumnInfo,
} from './transformation.types';
import { useBlocksPixel } from '@/hooks/useBlocksPixel';

const StyledContainer = styled('div')({
    height: '210px',
    maxHeigh: '210px',
    overflowY: 'scroll',
    border: '1px solid rgba(0, 0, 0, 0.23)',
    borderRadius: '8px',
    padding: 0,
});
interface FrameHeaderInfo {
    headers: {
        alias: string;
        dataType: string;
    }[];
}

type ColumnStateType<T> = {
    [key: string]: T;
};

export type ColumnCheckboxTransformationFieldComponent = (props: {
    cell: CellState;
    selectedColumns: ColumnInfoTwo[];
    columnTypes?: string[];
    disabled?: boolean;
    onChange: (newColumns: ColumnInfoTwo[] | ColumnInfoTwo) => void;
}) => JSX.Element;

export const EncodeColumnCheckboxTransformationField: ColumnCheckboxTransformationFieldComponent =
    observer((props) => {
        const { cell, selectedColumns, disabled, onChange } = props;

        const [search, setSearch] = React.useState<string>('');
        const [columnState, setColumnState] = React.useState([]);
        const [selectAll, setSelectAll] = React.useState(false);

        //for selecting or deselecting all columns
        // const handleSelectAll = () => {
        //     setSelectAll(!selectAll);
        //     if (!selectAll) {
        //         for (const key of columnState) {
        //             const firstKey = Object.keys(key)[0];
        //             key[firstKey] = true;
        //         }
        //     } else {
        //         for (const key of columnState) {
        //             const firstKey = Object.keys(key)[0];
        //             key[firstKey] = false;
        //         }
        //     }
        //     setColumnState([...columnState]);
        // };

        const frame = computed(() => {
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

        const [frameHeaders, setFrameHeaders] = React.useState<{
            loading: boolean;
            columns: ColumnInfoTwo[];
        }>({
            loading: true,
            columns: [],
        });

        const frameHeaderPixelReturn = useBlocksPixel<{
            headerInfo: FrameHeaderInfo;
        }>(executedFrame ? `META | ${frame} | FrameHeaders ();` : '');

        React.useEffect(() => {
            if (frameHeaderPixelReturn.status !== 'SUCCESS') {
                return;
            }

            const columns = frameHeaderPixelReturn.data.headerInfo.headers.map(
                (header) => ({
                    value: header.alias,
                    type: header.dataType,
                }),
            );

            setFrameHeaders({
                loading: false,
                columns: columns,
            });

            //setting state obj for tracking column checked states
            const obj = [];
            for (let i = 0, colLength = columns.length; i < colLength; i++) {
                obj.push({ [columns[i].value]: false, column: columns[i] });
            }

            setColumnState(obj);
        }, [frameHeaderPixelReturn.status, frameHeaderPixelReturn.data]);

        // columns that are returned when using search input
        const filteredResults =
            frameHeaders.columns &&
            React.useMemo(() => {
                return frameHeaders?.columns.filter((val) =>
                    val.value.toLowerCase().includes(search.toLowerCase()),
                );
            }, [search, frameHeaders.columns]);

        const isSelected = (column: ColumnInfoTwo): boolean => {
            const found = selectedColumns.find((selCol) => {
                return selCol.value === column.value;
            });
            if (found) {
                return true;
            }

            return false;
        };

        const columns = useMemo(() => {
            return (
                <>
                    {filteredResults.map((col, idx) => {
                        return (
                            <FormControlLabel
                                key={idx}
                                control={
                                    <Checkbox
                                        checked={isSelected(col)}
                                        onChange={(e) => {
                                            let updated = selectedColumns;
                                            if (isSelected(col)) {
                                                updated = updated.filter(
                                                    (selCol) => {
                                                        return (
                                                            selCol.value !==
                                                            col.value
                                                        );
                                                    },
                                                );
                                            } else {
                                                updated.push(col);
                                            }

                                            onChange(updated);
                                        }}
                                        name={col.value}
                                        value={col}
                                    />
                                }
                                label={col.value}
                            />
                        );
                    })}
                </>
            );
        }, [selectedColumns.length, filteredResults.length]);

        return (
            <React.Fragment>
                <TextField
                    size="small"
                    disabled={disabled}
                    label="Search"
                    placeholder="Search for column name"
                    value={search}
                    fullWidth
                    onChange={(e) => {
                        setSearch(e.target.value);
                    }}
                />
                <StyledContainer>
                    {filteredResults && (
                        <FormControl
                            sx={{ ml: 3 }}
                            component="fieldset"
                            variant="standard"
                        >
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={
                                                selectedColumns.length ===
                                                frameHeaders.columns.length
                                            }
                                            disabled={!executedFrame}
                                            onChange={() => {
                                                if (
                                                    selectedColumns.length ===
                                                    frameHeaders.columns.length
                                                ) {
                                                    onChange([]);
                                                } else {
                                                    onChange(
                                                        frameHeaders.columns,
                                                    );
                                                }
                                            }}
                                            name={
                                                selectedColumns.length ===
                                                frameHeaders.columns.length
                                                    ? 'deselect all'
                                                    : 'select all'
                                            }
                                        />
                                    }
                                    label={
                                        selectAll
                                            ? 'deselect all'
                                            : 'select all'
                                    }
                                />
                                {!executedFrame
                                    ? selectedColumns.map((c, idx) => {
                                          return (
                                              <FormControlLabel
                                                  key={idx}
                                                  control={
                                                      <Checkbox
                                                          disabled={true}
                                                          checked={true}
                                                          name={c.value}
                                                      />
                                                  }
                                                  label={c.value}
                                              />
                                          );
                                      })
                                    : columns}
                            </FormGroup>
                        </FormControl>
                    )}
                </StyledContainer>
            </React.Fragment>
        );
    });
