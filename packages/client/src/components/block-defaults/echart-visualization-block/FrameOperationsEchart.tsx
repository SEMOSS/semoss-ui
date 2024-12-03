import {
    useBlockSettings,
    useBlocksPixel,
    useFrame,
    useFrameHeaders,
} from '@/hooks';
import { Autocomplete, Button, Select, styled, TextField } from '@semoss/ui';
import { EChartVisualizationBlockDef } from './EChartVisualizationBlock';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BAR_CHART_DATA } from './Echart.constants';
import { PathValue } from '@/types';
import { Sync } from '@mui/icons-material';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';

export interface FrameOperationsEChartProps {
    id: string;
}

const StyledSubSection = styled('div')(() => ({
    display: 'block',
    // border: '1px solid gray',
    padding: '0.5rem',
    width: '100%',
}));
const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));

export const FrameOperationsEchart = observer<FrameOperationsEChartProps>(
    ({ id }) => {
        const { data, setData } =
            useBlockSettings<EChartVisualizationBlockDef>(id);
        const [columnsData, setColumnsData] = useState([]);
        const [fieldsData, setFieldsData] = useState({
            xaxis: {
                name: '',
                selector: '',
            },
            yaxis: {
                name: '',
                selector: '',
            },
        });
        const [value, setValue] = useState({});
        const path = 'option';
        // get all of the frames
        const getFrames = useBlocksPixel<string[]>('GetFrames();', {
            data: [],
        });
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // options for the autocomplete
        const options = getFrames.status === 'SUCCESS' ? getFrames.data : [];

        const frameHeaders = useFrameHeaders(data.frame?.name);

        function syncHeaders() {
            const columns = frameHeaders.data.list.map((item) => {
                return {
                    name: item.alias,
                    selector: item.header,
                    width: undefined,
                };
            });
            setColumnsData(columns);
        }

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }
                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();

        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        console.log(data, 'data on FrameOperationsEchart');
        function updateFields(axis, event) {
            let value = event.target.value || '';
            let name = columnsData.find((col) => col.selector === value);
            let nameValue = name.hasOwnProperty('name') ? name['name'] : '';
            setFieldsData((prevField) => {
                return {
                    ...prevField,
                    [axis]: {
                        name: nameValue,
                        selector: value,
                        width: undefined,
                    },
                };
            });
            let columns = { ...fieldsData };
            columns = {
                ...columns,
                [axis]: {
                    name: nameValue,
                    selector: value,
                    width: undefined,
                },
            };
            console.log(columns, 'updatefields');
            if (columns['xaxis'] && columns['yaxis']) {
                let combinedColumns = [];
                combinedColumns.push(columns['xaxis']);
                combinedColumns.push(columns['yaxis']);
                console.log(computedValue, 'computedValue');
                let tempVal = JSON.parse(computedValue) || {};
                let seriesIndex =
                    tempVal['series'].findIndex((item) =>
                        BAR_CHART_DATA.JSONVALUE.includes(item.type),
                    ) || 0;
                tempVal['xAxis'] = {
                    ...tempVal['xAxis'],
                    ['name']: columns['xaxis'].name,
                };
                tempVal['yAxis'] = {
                    ...tempVal['yAxis'],
                    ['name']: columns['yaxis'].name,
                };
                tempVal['series'][seriesIndex] = {
                    ...tempVal['series'][seriesIndex],
                    ['name']: columns['yaxis'].name,
                };
                dispatchData(tempVal);
                setData('columns', combinedColumns);
            }
        }
        function dispatchData(option) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData('option', option as PathValue<any, typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        return (
            <>
                <StyledSubSection>
                    <Autocomplete
                        multiple={false}
                        disabled={getFrames.status !== 'SUCCESS'}
                        value={data.frame?.name}
                        options={options}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // update the frame
                            setData('frame.name', value);
                            // setFrameName(value);
                        }}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select frame"
                                size="small"
                                variant="outlined"
                            />
                        )}
                    />
                    <Button onClick={syncHeaders}>
                        <Sync />
                    </Button>
                </StyledSubSection>
                <StyledSubSection>
                    <label htmlFor="font-weight">X Axis Field</label>
                    <StyledSelect
                        id="font-weight"
                        label="Select X Axis Field"
                        onChange={(e) => updateFields('xaxis', e)}
                    >
                        <Select.Item key="-1" value="">
                            Select X Axis Field
                        </Select.Item>
                        {columnsData?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledSubSection>
                <StyledSubSection>
                    <label htmlFor="font-weight">Y Axis Field</label>
                    <StyledSelect
                        id="font-weight"
                        label="Select Y Axis Field"
                        onChange={(e) => updateFields('yaxis', e)}
                    >
                        <Select.Item key="-1" value="">
                            Select Y Axis Field
                        </Select.Item>
                        {columnsData?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledSubSection>
            </>
        );
    },
);
