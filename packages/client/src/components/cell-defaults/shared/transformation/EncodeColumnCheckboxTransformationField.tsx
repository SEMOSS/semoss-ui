import React from 'react';
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
import { TransformationTargetCell, ColumnInfo } from './transformation.types';
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
    columnTypes?: string[];
    disabled?: boolean;
    onChange: (newColumns: ColumnInfo[] | ColumnInfo) => void;
}) => JSX.Element;

export const EncodeColumnCheckboxTransformationField: ColumnCheckboxTransformationFieldComponent =
    observer((props) => {
        const { cell, disabled, onChange } = props;

        const [search, setSearch] = React.useState<string>('');
        const [columnState, setColumnState] = React.useState([]);
        const [selectAll, setSelectAll] = React.useState(false);

        //for individual checkboxes
        const handleChange = (
            event: React.ChangeEvent<HTMLInputElement>,
            index: number,
        ) => {
            if (selectAll) {
                setSelectAll(false);
            }
            columnState[index][event.target.name] = event.target.checked;
            setColumnState([...columnState]);
        };

        //for selecting or deselecting all columns
        const handleSelectAll = () => {
            setSelectAll(!selectAll);
            if (!selectAll) {
                for (const key of columnState) {
                    const firstKey = Object.keys(key)[0];
                    key[firstKey] = true;
                }
            } else {
                for (const key of columnState) {
                    const firstKey = Object.keys(key)[0];
                    key[firstKey] = false;
                }
            }
            setColumnState([...columnState]);
        };

        const frameVariableName = computed(() => {
            return (cell.parameters.targetCell as TransformationTargetCell)
                .frameVariableName;
        }).get();

        const targetCell: CellState = computed(() => {
            return cell.query.cells[
                (cell.parameters.targetCell as TransformationTargetCell).id
            ];
        }).get();

        const [frameHeaders, setFrameHeaders] = React.useState<{
            loading: boolean;
            columns: ColumnInfo[];
        }>({
            loading: true,
            columns: [],
        });

        const frameHeaderPixelReturn = useBlocksPixel<{
            headerInfo: FrameHeaderInfo;
        }>(`META | ${frameVariableName} | FrameHeaders ();`);

        React.useEffect(() => {
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

            //setting state obj for tracking column checked states
            const obj = [];
            for (let i = 0, colLength = columns.length; i < colLength; i++) {
                obj.push({ [columns[i].name]: false, column: columns[i] });
            }

            setColumnState(obj);
        }, [frameHeaderPixelReturn.status, frameHeaderPixelReturn.data]);

        React.useEffect(() => {
            if (targetCell && targetCell.output) {
                frameHeaderPixelReturn.refresh();
            }
        }, [targetCell ? targetCell.output : null]);

        React.useEffect(() => {
            if (targetCell && targetCell.output) {
                frameHeaderPixelReturn.refresh();
            }
        }, [targetCell ? targetCell.output : null]);

        //upon running pixel, ensure that selectAll is reset to it's default state
        React.useEffect(() => {
            const arr = [];
            if (columnState.length) {
                for (const key of columnState) {
                    const firstKey = Object.keys(key)[0];
                    if (key[firstKey] === false) {
                        arr.push(key);
                    }
                }
            }

            if (arr.length === columnState.length) {
                setSelectAll(false);
            }
        }, [columnState]);

        // columns that are returned when using search input
        const filteredResults =
            frameHeaders.columns &&
            React.useMemo(() => {
                return frameHeaders?.columns.filter((val) =>
                    val.name.toLowerCase().includes(search.toLowerCase()),
                );
            }, [search, frameHeaders.columns]);

        // function to update which items should be passed into the payload value array
        const assignColumns = () => {
            const arr = [];
            columnState.forEach((column: ColumnStateType<boolean>) => {
                if (Object.values(column)[0] === true) {
                    arr.push(column.column);
                }
            });
            onChange(arr);
        };

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
                                            checked={selectAll}
                                            onChange={() => {
                                                handleSelectAll();
                                                assignColumns();
                                            }}
                                            name={
                                                selectAll
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
                                {filteredResults.map((col, idx) => {
                                    return (
                                        <FormControlLabel
                                            key={idx}
                                            control={
                                                <Checkbox
                                                    checked={
                                                        columnState[idx][
                                                            col.name
                                                        ]
                                                    }
                                                    onChange={(e) => {
                                                        handleChange(e, idx);
                                                        assignColumns();
                                                    }}
                                                    name={col.name}
                                                />
                                            }
                                            label={col.name}
                                        />
                                    );
                                })}
                            </FormGroup>
                        </FormControl>
                    )}
                </StyledContainer>
            </React.Fragment>
        );
    });
