import { useBlock, useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { EChartVisualizationBlockDef } from './EChartVisualizationBlock';
import { useEffect, useMemo, useState } from 'react';
import { Button, Select, Stack, styled, TextField } from '@semoss/ui';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PathValue } from 'react-hook-form';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';

const StyledMainSection = styled('div')(() => ({
    display: 'inline-flex',
    width: '100%',
}));

const StyledSelect = styled(Select)(() => ({
    width: '48%',
}));

const StyledTextField = styled(TextField)(() => ({
    width: '48%',
}));

export interface ColourByValueProps {
    id: string;
}

const ColourByValue = observer<ColourByValueProps>(({ id }) => {
    const { data, setData } = useBlockSettings<EChartVisualizationBlockDef>(id);

    const [newRules, setNewRules] = useState({
        column: '',
        columnColour: '',
        columnToColour: '',
        columnComparision: '',
        valuesToColour: '',
    });

    const [valuesToColour, setValuesToColour] = useState([]);
    const [value, setValue] = useState({});
    const path = 'option';
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

    function updateFields(column, event) {
        setNewRules((prevRules) => {
            return {
                ...prevRules,
                [column]: event.target.value,
            };
        });
        console.log(newRules, 'newRules');
        if (column === 'columnToColour') {
            let option = data.option;
            let jsonPropName = data.columns.find(
                (item) => item.selector === event.target.value,
            );
            console.log('colum to colour', event, jsonPropName.name);
            if (jsonPropName.hasOwnProperty('name')) {
                setNewRules((prevValues) => {
                    return {
                        ...prevValues,
                        ['columnName']: jsonPropName['name'],
                        ['columnNameToColour']: jsonPropName['name'],
                    };
                });
                if (option['xAxis']['pixelname'] === jsonPropName['name']) {
                    setValuesToColour(option['xAxis']['data']);
                }
                if (option['yAxis']['pixelname'] === jsonPropName['name']) {
                    let seriesIndex = option['series'].findIndex(
                        (series) => series.name === jsonPropName['name'],
                    );
                    if (
                        seriesIndex > -1 &&
                        option['series'][seriesIndex].hasOwnProperty('data')
                    ) {
                        setValuesToColour(
                            option['series'][seriesIndex]['data'],
                        );
                    }
                }
            }
        }
    }
    function updateData() {
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let xAxisPosition = option['xAxis']['data'].findIndex((data) =>
            data.hasOwnProperty('value')
                ? data.value === newRules.valuesToColour
                : data === newRules.valuesToColour,
        );
        let optionUpdated = option;
        if (xAxisPosition > -1) {
            option = {
                ...option,
                ['xAxis']: {
                    ...option['xAxis'],
                    ['data']: {
                        ...option['xAxis']['data'],
                        [xAxisPosition]: {
                            ...option['xAxis']['data'][xAxisPosition],
                            value: newRules.valuesToColour,
                            itemStyle: {
                                color: newRules.columnColour,
                            },
                        },
                    },
                },
            };
            try {
                setData('option', option as PathValue<any, any>);
            } catch (e) {
                console.log(e);
            }
        }
    }
    const columnComparision = [
        {
            name: 'is Equal To',
            value: '==',
        },
    ];

    const accordionDetails = (
        <Stack width={'100%'}>
            <StyledMainSection>
                <StyledSelect
                    label="Select Column"
                    name="column"
                    onChange={(e) => updateFields('column', e)}
                >
                    {data.columns.map((cols, index) => {
                        return (
                            <Select.Item value={cols.selector} key={index}>
                                {cols.name}
                            </Select.Item>
                        );
                    })}
                </StyledSelect>
                <StyledTextField
                    label="Enter Colour"
                    name="columnColour"
                    onChange={(e) => updateFields('columnColour', e)}
                ></StyledTextField>
            </StyledMainSection>
            <StyledMainSection>
                <StyledSelect
                    label="Select Column"
                    name="columnToColour"
                    onChange={(e) => updateFields('columnToColour', e)}
                >
                    {data.columns.map((cols, index) => {
                        return (
                            <Select.Item value={cols.selector} key={index}>
                                {cols.name}
                            </Select.Item>
                        );
                    })}
                </StyledSelect>
                <StyledSelect
                    label="Select Comparision"
                    name="columnComparision"
                    onChange={(e) => updateFields('columnComparision', e)}
                >
                    {columnComparision.map((cols, index) => {
                        return (
                            <Select.Item value={cols.value} key={index}>
                                {cols.name}
                            </Select.Item>
                        );
                    })}
                </StyledSelect>
            </StyledMainSection>
            <StyledMainSection>
                <StyledSelect
                    label="Select Values"
                    name="valuesToColour"
                    defaultValue={newRules?.valuesToColour || ''}
                    onChange={(e) => updateFields('valuesToColour', e)}
                >
                    {(valuesToColour === undefined ||
                        valuesToColour.length === 0) && (
                        <Select.Item value="">No Values to display</Select.Item>
                    )}
                    {valuesToColour !== undefined &&
                        valuesToColour?.length > 0 && (
                            <Select.Item value="">Select Values</Select.Item>
                        )}
                    {valuesToColour !== undefined &&
                        valuesToColour?.length > 0 &&
                        valuesToColour?.map((cols, index) => {
                            return (
                                <Select.Item value={cols} key={index}>
                                    {cols}
                                </Select.Item>
                            );
                        })}
                </StyledSelect>
            </StyledMainSection>
            <StyledMainSection>
                <Button onClick={updateData}>Execute</Button>
            </StyledMainSection>
        </Stack>
    );

    return (
        <CustomAccordianBlock
            accordianDetails={accordionDetails}
            accordianSummary={'Colour By Value'}
            accordianSummaryProps={<ExpandMoreIcon />}
            accordianExpanded={false}
        />
    );
});
export default ColourByValue;
