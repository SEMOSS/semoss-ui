import {
    useBlockSettings,
    useBlocksPixel,
    useFrame,
    useFrameHeaders,
} from '@/hooks';
import { Autocomplete, Button, Select, styled, TextField } from '@semoss/ui';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BAR_CHART_DATA } from '../../Visualization.constants';
import { PathValue } from '@/types';
import { Sync } from '@mui/icons-material';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';

export interface FrameOperationsProps {
    id: string;
    updateFrame: (option) => void;
}

const StyledSubSection = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'center',
    // border: '1px solid gray',
    padding: '0.5rem',
    width: '100%',
}));
const StyledDropDownSection = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'center',
    padding: '0.5rem',
}));
const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));

interface pixelColumn {
    name: string;
    selector: string;
    width: undefined;
}

export const FrameOperations = observer<FrameOperationsProps>(
    ({ id, updateFrame }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [columnsData, setColumnsData] = useState([]);
        const [fieldsData, setFieldsData] = useState({
            xaxis: [],
            yaxis: [],
        });
        const [value, setValue] = useState({});
        const path = 'option';
        const [selectedValues, setSelectedValues] = useState({
            xAxis: [],
            yAxis: [],
        });
        // get all of the frames
        const getFrames = useBlocksPixel<string[]>('GetFrames();', {
            data: [],
        });
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        let [frameOperationState, setFrameOperationState] = useState<
            'initial' | 'updated'
        >('initial');

        // options for the autocomplete
        const options = getFrames.status === 'SUCCESS' ? getFrames.data : [];

        const frameHeaders = useFrameHeaders(data.frame?.name);

        const columnsSelector = useMemo(() => {
            return frameHeaders.data.list.map((item) => {
                return {
                    name: item.alias,
                    selector: item.header,
                    width: undefined,
                };
            });
        }, [frameHeaders]);

        const initialUpdateOfData = () => {
            if (data.frame.name === '') return;
            const option =
                typeof value === 'string' ? JSON.parse(value) : value;
            // console.log(option, 'xAxis');
            // return;
            let xAxisData = option['xAxis']['pixelvalue'] || [];
            let yAxisData = option['yAxis']['pixelvalue'] || [];
            let recentValue = xAxisData.slice(-1) || [];
            let columnsToUpdate = [];
            let name = columnsSelector.find(
                (col) => col.selector === recentValue[0],
            );
            let initialColumns = { ...fieldsData };
            initialColumns['xaxis'] = [
                {
                    ['name']: name?.name || '',
                    ['selector']: recentValue,
                    ['width']: undefined,
                },
            ];
            columnsToUpdate = [
                {
                    name: name?.name,
                    selector: recentValue[0],
                },
            ];
            option['xAxis'] = {
                ...option['xAxis'],
                ['name']: name?.name || '',
                ['pixelname']: name?.name || '',
                ['pixelvalue']: recentValue || '',
            };
            let pixelName = [],
                pixelValue = [];
            yAxisData.forEach((item, index) => {
                let name = columnsSelector.find((col) => col.selector === item);
                initialColumns['yaxis'].push({
                    ['name']: name?.name || '',
                    ['selector']: item,
                    ['width']: undefined,
                });
                columnsToUpdate.push({
                    name: name?.name || '',
                    selector: item,
                });
                pixelName.push(name?.name);
                pixelValue.push(item);
            });
            option['yAxis'] = {
                ...option['yAxis'],
                ['name']: pixelName[0],
                ['pixelname']: pixelName,
                ['pixelvalue']: pixelValue,
            };
            for (let i = 0; i < pixelName.length; i++) {
                option['series'][i] = {
                    ...option['series'][i],
                    data: [],
                    name: pixelName[i],
                    type: 'bar',
                };
            }
            setFieldsData(initialColumns);
            let selectedValuesData = { ...selectedValues };
            selectedValuesData.xAxis = recentValue;
            selectedValuesData.yAxis = yAxisData;
            setSelectedValues(selectedValuesData);
            dispatchData(option);
        };

        function syncHeaders() {
            const columns = frameHeaders.data.list.map((item) => {
                return {
                    name: item.alias,
                    selector: item.header,
                    width: undefined,
                };
            });
            setColumnsData(columns);
            // initialUpdateOfData();
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

        useEffect(() => {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            if (
                frameOperationState === 'initial' &&
                data.frame.name !== '' &&
                option['xAxis'] != undefined &&
                option['xAxis'].hasOwnProperty('pixelvalue') &&
                option['yAxis'] != undefined &&
                option['yAxis'].hasOwnProperty('pixelvalue')
            ) {
                initialUpdateOfData();
                setFrameOperationState('updated');
            }
        }, [value]);

        function updateFields(axis, event) {
            let value = event.target.value || [];
            let columns = { ...fieldsData };
            if (axis === 'xaxis') {
                let recentValue = value.slice(-1) || [];
                let name = columnsSelector.find(
                    (col) => col.selector === recentValue[0],
                );
                columns['xaxis'] = [
                    {
                        ['name']: name?.name || '',
                        ['selector']: recentValue,
                        ['width']: undefined,
                    },
                ];
                setFieldsData((prevFields) => {
                    return {
                        ...prevFields,
                        ['xaxis']: columns['xaxis'],
                    };
                });
                setSelectedValues((prevValues) => {
                    return {
                        ...prevValues,
                        ['xAxis']: columns['xaxis'][0]['selector'],
                    };
                });
            }
            if (axis === 'yaxis') {
                columns['yaxis'] = [];
                value.forEach((item, index) => {
                    let name = columnsSelector.find(
                        (col) => col.selector === item,
                    );
                    columns['yaxis'].push({
                        ['name']: name?.name || '',
                        ['selector']: item,
                        ['width']: undefined,
                    });
                });
                setFieldsData((prevFields) => {
                    return {
                        ...prevFields,
                        ['yaxis']: columns['yaxis'],
                    };
                });
                let yAxisData = [];
                columns['yaxis'].forEach((yaxisItem, yAxisIndex) => {
                    yAxisData = [...yAxisData, yaxisItem.selector];
                });
                setSelectedValues((prevValues) => {
                    return {
                        ...prevValues,
                        ['yAxis']: yAxisData,
                    };
                });
            }
            if (columns['xaxis'] && columns['yaxis']) {
                let tempVal = JSON.parse(computedValue) || {};
                let seriesIndex =
                    tempVal['series'].findIndex((item) =>
                        BAR_CHART_DATA.JSONVALUE.includes(item.type),
                    ) || 0;
                let columnsmerged = [];
                if (columns['xaxis'].length) {
                    tempVal['xAxis'] = {
                        ...tempVal['xAxis'],
                        ['name']: columns['xaxis'][0].name || '',
                        ['pixelname']: columns['xaxis'][0].name || '',
                        ['pixelvalue']: columns['xaxis'][0].selector || '',
                    };
                }

                columnsmerged = [
                    {
                        name: columns['xaxis'][0].name || '',
                        selector: columns['xaxis'][0].selector[0] || '',
                    },
                ];
                let pixelName = [],
                    pixelValue = [];
                columns['yaxis'].forEach((columItem, columIndex) => {
                    pixelName.push(columItem.name);
                    pixelValue.push(columItem.selector);
                    columnsmerged.push({
                        name: columItem.name,
                        selector: columItem.selector,
                    });
                });
                if (columns['yaxis'].length) {
                    tempVal['yAxis'] = {
                        ...tempVal['yAxis'],
                        ['name']: columns['yaxis'][0]?.name,
                        ['pixelname']: pixelName,
                        ['pixelvalue']: pixelValue,
                    };
                }
                for (let i = 0; i < columns['yaxis'].length; i++) {
                    tempVal['series'][i] = {
                        ...tempVal['series'][i],
                        data: [],
                        name: columns['yaxis'][i].name,
                        // i === 0
                        //     ? columns['xaxis'][0].name
                        //     : columns['yaxis'][i].name,
                        type: 'bar',
                    };
                }
                console.log('state', tempVal);
                dispatchData(tempVal);
                setData('columns', columnsmerged);
                // console.log('yAxisData', yAxisData);
            }
            console.log(columns, 'columns');
            let name = columnsSelector.find((col) => col.selector === value);
            console.log(columnsSelector, axis, value, 'updateFields');
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
            }, 100);
        }
        return (
            <>
                <StyledSubSection>
                    <label htmlFor="Echart-Frame">Select a Frame</label>
                </StyledSubSection>
                <StyledSubSection>
                    <Autocomplete
                        fullWidth
                        id="Echart-Frame"
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
                <StyledDropDownSection>
                    <label htmlFor="font-weight">X Axis Field</label>
                    <StyledSelect
                        id="font-weight"
                        label="Select X Axis Field"
                        SelectProps={{
                            multiple: true,
                        }}
                        value={
                            columnsSelector.length > 0
                                ? selectedValues['xAxis'] ?? []
                                : []
                        }
                        onChange={(e) => updateFields('xaxis', e)}
                    >
                        <Select.Item key="-1" value="">
                            Select X Axis Field
                        </Select.Item>
                        {columnsSelector?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDropDownSection>
                <StyledDropDownSection>
                    <label htmlFor="font-weight">Y Axis Field</label>
                    <StyledSelect
                        id="font-weight"
                        label="Select Y Axis Field"
                        SelectProps={{
                            multiple: true,
                        }}
                        value={
                            columnsSelector.length > 0
                                ? selectedValues['yAxis'] ?? []
                                : []
                        }
                        onChange={(e) => updateFields('yaxis', e)}
                    >
                        <Select.Item key="-1" value="">
                            Select Y Axis Field
                        </Select.Item>
                        {columnsSelector?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDropDownSection>
            </>
        );
    },
);
