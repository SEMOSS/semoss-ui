import { useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Select, Stack, styled, Table, TextField } from '@semoss/ui';
import { PathValue } from 'react-hook-form';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';
import { BAR_CHART_DATA } from '../../Visualization.constants';
import { Delete, Edit } from '@mui/icons-material';
import { ECHART_BAR_COLOUR } from '../../Visualization.constants';
// styled main section with custom styling
const StyledMainSection = styled('div')(() => ({
    display: 'inline-flex',
    width: '100%',
}));
//select field with custom styling design to show two select fields in a row
const StyledSelect = styled(Select)(() => ({
    width: '48%',
}));
//custom text field with reduced width
const StyledTextField = styled(TextField)<{
    width?: string;
}>(({ width }) => ({
    width: width ?? '48%',
}));
//styled span section
const StyledSpan = styled('span')(() => ({
    display: 'flex',
    justifyContent: 'space-around',
}));

//Color by value props
export interface ColourByValueProps {
    id: string;
    updateChart: (option: any) => void;
}
//initial new rules for managing the state and for restoring
const INITIAL_NEW_RULES = {
    column: '',
    columnColour: '#000000',
    columnToColour: '',
    columnComparision: '',
    valuesToColour: [],
    filterValue: 0,
    filterMinValue: 0,
    filterMaxValue: 0,
    index: -1,
};

const ColourByValue = observer<ColourByValueProps>(({ id, updateChart }) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

    const [newRules, setNewRules] = useState(INITIAL_NEW_RULES);

    const [valuesToColour, setValuesToColour] = useState([]);
    const [value, setValue] = useState({});
    const [appliedRules, setAppliedRules] = useState([]);
    const [valuesColourMapping, setValuesColourMapping] = useState({});
    //custom reference variable to handle color value applying
    let functionCallReference = useRef({
        valuesResetCheck: false,
        assignedRules: [],
        applyRulesToChart: false,
    });
    //update the state in the following json path
    const path = 'option';
    const columnData = data.columns || [];
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
    //initial setting of state data based on the json value
    useEffect(() => {
        functionCallReference.current.applyRulesToChart = false;
        let option =
            typeof computedValue === 'string'
                ? JSON.parse(computedValue)
                : computedValue;
        if (
            option.hasOwnProperty('customSettings') &&
            option['customSettings'].hasOwnProperty('appliedColourByValue')
        ) {
            let appliedRules = option['customSettings']['appliedColourByValue'];
            setAppliedRules(appliedRules);
        }
    }, []);
    //whenever a computed value is changed, then respective change for colour by value component is
    useEffect(() => {
        setValue(computedValue);
    }, [computedValue]);
    useEffect(() => {
        if (functionCallReference.current.applyRulesToChart) {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let colourObj = {};
            let optionUpdated = option;
            appliedRules.forEach((appliedItem, index) => {
                let xAxisPosition = getXAxisPositions(appliedItem);
                //take all the series indexes to update the data
                let filteredSeriesIndex = getFilteredSeriesIndex();
                if (xAxisPosition.length) {
                    filteredSeriesIndex.forEach((item, index) => {
                        let seriesIndexData = item;
                        if (seriesIndexData > -1) {
                            let data =
                                option['series'][seriesIndexData]['data'];
                            data.forEach((item, dataindex) => {
                                colourObj = {
                                    ...colourObj,
                                    [dataindex]: xAxisPosition.includes(
                                        dataindex,
                                    )
                                        ? appliedItem.columnColour
                                        : colourObj.hasOwnProperty(dataindex)
                                        ? colourObj[dataindex]
                                        : ECHART_BAR_COLOUR,
                                };
                            });
                            setValuesColourMapping((prevColour) => {
                                return {
                                    ...prevColour,
                                    ...colourObj,
                                };
                            });
                            if (
                                option['series'][
                                    seriesIndexData
                                ].hasOwnProperty('itemStyle')
                            ) {
                                option['series'][seriesIndexData]['itemStyle'] =
                                    {
                                        ...option['series'][seriesIndexData][
                                            'itemStyle'
                                        ],
                                        ['color']: (seriesData) =>
                                            updateColorData(
                                                seriesData,
                                                colourObj,
                                            ),
                                    };
                            } else {
                                option['series'][seriesIndexData] = {
                                    ...option['series'][seriesIndexData],
                                    ['itemStyle']: {
                                        ...option['series'][seriesIndexData][
                                            'itemStyle'
                                        ],
                                        ['color']: (seriesData) =>
                                            updateColorData(
                                                seriesData,
                                                colourObj,
                                            ),
                                    },
                                };
                            }
                        }
                    });
                }
            });

            option['customSettings'] = {
                ...option['customSettings'],
                ['appliedColourByValue']: appliedRules,
            };
            optionUpdated = option;
            runStateUpdateCustom(optionUpdated);
            functionCallReference.current.applyRulesToChart = false;
        }
    }, [appliedRules]);

    //function to check and retrieve the indexes for bar chart type
    function getFilteredSeriesIndex() {
        let index = [];
        let seriesAvailable: any[] = data.option['series'].filter((item) =>
            BAR_CHART_DATA.JSONVALUE.includes(item.type),
        );
        seriesAvailable.forEach((item, seriesIndex) => {
            index.push(seriesIndex);
        });
        return index;
    }

    function runStateUpdateCustom(updatedOption: PathValue<any, typeof path>) {
        setTimeout(() => {
            try {
                setData('option', updatedOption as PathValue<any, typeof path>);
            } catch (e) {
                console.log(e);
            }
        }, 300);
    }
    //when fields are updated, new rules are updated
    function updateFields(column, event) {
        setNewRules((prevRules) => {
            return {
                ...prevRules,
                [column]: event.target.value,
            };
        });
        //if column updated is columnToColour then values to be selected if fetched from series and added to valuestocolor state
        if (column === 'columnToColour') {
            let option = data.option;
            let jsonPropName = data.columns.find(
                (item) => item.selector === event.target.value,
            );
            if (jsonPropName.hasOwnProperty('name')) {
                setNewRules((prevValues) => {
                    return {
                        ...prevValues,
                        ['columnName']: jsonPropName['name'],
                        ['columnNameToColour']: jsonPropName['name'],
                    };
                });
                if (option['xAxis']['pixelname'] === jsonPropName['name']) {
                    setValuesToColour(
                        option['xAxis']['data'].map((item) => {
                            return item.hasOwnProperty('value')
                                ? item.value
                                : item;
                        }),
                    );
                    console.log(
                        'valuestocolour',
                        option['xAxis']['data'].map((item) => {
                            return item.hasOwnProperty('value')
                                ? item.value
                                : item;
                        }),
                    );
                    let dataArray = option['xAxis']['data'].filter(
                        (item) => !isNaN(item),
                    );
                    setNewRules((prevValues) => {
                        return {
                            ...prevValues,
                            ['filterMinValue']: Math.min(...dataArray),
                            ['filterMaxValue']: Math.max(...dataArray),
                        };
                    });
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
                        console.log(
                            'valuestocolour',
                            option['series'][seriesIndex]['data'],
                        );
                        let dataArray = option['series'][seriesIndex][
                            'data'
                        ].filter((item) => !isNaN(item));
                        setNewRules((prevValues) => {
                            return {
                                ...prevValues,
                                ['filterMinValue']: Math.min(...dataArray),
                                ['filterMaxValue']: Math.max(...dataArray),
                            };
                        });
                    }
                }
            }
        }
    }
    //get the xaxis positons to be updated with the colour selected
    function getXAxisPositions(sourceObject: any = {}) {
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let positions = [];
        if (Object.keys(sourceObject).length === 0) {
            sourceObject = newRules;
        }
        if (sourceObject.columnComparision === '==') {
            sourceObject.valuesToColour.forEach((item) => {
                let xAxisPosition = [];
                option['xAxis']['data'].forEach((itemAvailable, index) => {
                    if (
                        item === itemAvailable ||
                        (itemAvailable.hasOwnProperty('value') &&
                            itemAvailable.value === item)
                    ) {
                        xAxisPosition.push(index);
                    }
                });
                positions = [...xAxisPosition, ...positions];
            });
        }
        if (sourceObject.columnComparision === '!=') {
            let dataVerify = option['xAxis']['data'];
            sourceObject.valuesToColour.forEach((item) => {
                let xAxisPosition = [];
                option['xAxis']['data'].forEach((itemAvailable, index) => {
                    if (
                        item === itemAvailable ||
                        (itemAvailable.hasOwnProperty('value') &&
                            itemAvailable.value === item)
                    ) {
                        xAxisPosition.push(index);
                    }
                });
                positions = [...xAxisPosition, ...positions];
            });
            let xAxisReversedPositions = [];
            option['xAxis']['data'].forEach((itemAvailable, index) => {
                if (!positions.includes(index)) {
                    xAxisReversedPositions.push(index);
                }
            });
            positions = xAxisReversedPositions;
        }
        if (sourceObject.columnComparision === '<') {
            //less than comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (
                    !isNaN(item) &&
                    (item < sourceObject.filterValue ||
                        (item.hasOwnProperty('value') &&
                            item.value < sourceObject.filterValue))
                ) {
                    positions.push(index);
                }
            });
        }
        if (sourceObject.columnComparision === '>') {
            //greater than comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (
                    !isNaN(item) &&
                    (item > sourceObject.filterValue ||
                        (item.hasOwnProperty('value') &&
                            item.value > sourceObject.filterValue))
                ) {
                    positions.push(index);
                }
            });
        }
        if (sourceObject.columnComparision === '<=') {
            //less than or equal to comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (
                    !isNaN(item) &&
                    (item <= sourceObject.filterValue ||
                        (item.hasOwnProperty('value') &&
                            item.value <= sourceObject.filterValue))
                ) {
                    positions.push(index);
                }
            });
        }
        if (sourceObject.columnComparision === '>=') {
            //greater than or equal to comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (
                    !isNaN(item) &&
                    (item >= sourceObject.filterValue ||
                        (item.hasOwnProperty('value') &&
                            item.value >= sourceObject.filterValue))
                ) {
                    positions.push(index);
                }
            });
        }

        return positions;
    }
    //THE COLOR data function return the colour data for the rules
    function updateColorData(seriesData, colourObj) {
        if (colourObj.hasOwnProperty(seriesData.dataIndex)) {
            return colourObj[seriesData.dataIndex];
        }
        return ECHART_BAR_COLOUR;
    }
    //when the condition is met, values from newRules will be added to applied rules, then it will applied to chart
    function updateData() {
        if (
            newRules.column !== '' &&
            newRules.columnComparision !== '' &&
            newRules.columnComparision !== ''
        ) {
            if (newRules.index === -1) {
                let appliedRulesLength = appliedRules.length;
                let appliedRulesUpdated = [
                    ...appliedRules,
                    { ...newRules, ['index']: appliedRulesLength },
                ];
                functionCallReference.current.applyRulesToChart = true;
                setAppliedRules(appliedRulesUpdated);
            } else {
                let index = newRules.index;
                let assignedRules = appliedRules;
                let updatedRules = [
                    ...assignedRules.filter(
                        (item, itemIndex) => itemIndex < index,
                    ),
                    newRules,
                    ...assignedRules.filter(
                        (item, itemIndex) => itemIndex > index,
                    ),
                ];
                functionCallReference.current.applyRulesToChart = true;
                setAppliedRules(updatedRules);
            }
        }
        setNewRules(INITIAL_NEW_RULES);
    }
    //column comparision object
    const columnComparision = [
        {
            name: 'is Equal To',
            value: '==',
        },
        {
            name: 'is Not Equal To',
            value: '!=',
        },
        {
            name: 'is Less than',
            value: '<',
        },
        {
            name: 'is greater than',
            value: '>',
        },
        {
            name: 'is Lesser than or Equal to',
            value: '<=',
        },
        {
            name: 'is greater than or Equal to',
            value: '>=',
        },
    ];
    //condition to show a text field, when the comparision is not '=='
    const conditionForShowingField =
        newRules.columnComparision == '<' ||
        newRules.columnComparision == '>' ||
        newRules.columnComparision == '<=' ||
        newRules.columnComparision == '>=';

    const accordionDetails = (
        <Stack width={'100%'} style={{ padding: '0.95rem' }}>
            <StyledMainSection>
                <h3>Applied Rules</h3>
            </StyledMainSection>
            <StyledMainSection>
                <table>
                    <thead>
                        <tr>
                            <td>Column</td>
                            <td>Applied Rule</td>
                            <td>Action</td>
                        </tr>
                    </thead>
                    <tbody>
                        {appliedRules.length === 0 && (
                            <tr>
                                <td colSpan={3}>No Records Found</td>
                            </tr>
                        )}
                        {appliedRules.length > 0 &&
                            appliedRules.map((rule, index) => {
                                return (
                                    <tr>
                                        <td>
                                            {rule.column} {rule.columnToColour}
                                        </td>
                                        <td>{`${rule.column} ${
                                            rule.columnComparision
                                        } ${
                                            rule.columnComparision === '==' ||
                                            rule.columnComparision === '!='
                                                ? rule.valuesToColour.join(',')
                                                : rule.filterValue
                                        }`}</td>
                                        <td>
                                            <StyledSpan>
                                                <span
                                                    onClick={() =>
                                                        deleteAssignedRule(
                                                            rule,
                                                            index,
                                                        )
                                                    }
                                                >
                                                    <Delete />
                                                </span>
                                                <span
                                                    onClick={() =>
                                                        editAssignedRule(
                                                            rule,
                                                            index,
                                                        )
                                                    }
                                                >
                                                    <Edit />
                                                </span>
                                            </StyledSpan>
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </StyledMainSection>
            <StyledMainSection>
                <h3>New Rule</h3>
            </StyledMainSection>
            <StyledMainSection>
                <StyledSelect
                    label="Select Column"
                    name="column"
                    value={newRules.column}
                    onChange={(e) => updateFields('column', e)}
                >
                    {data.columns?.map((cols, index) => {
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
                    type="color"
                    value={newRules.columnColour}
                    onChange={(e) => updateFields('columnColour', e)}
                ></StyledTextField>
            </StyledMainSection>
            <StyledMainSection>
                <StyledSelect
                    label="Select Column"
                    name="columnToColour"
                    value={newRules.columnToColour}
                    onChange={(e) => updateFields('columnToColour', e)}
                >
                    {data.columns?.map((cols, index) => {
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
                    value={newRules.columnComparision}
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
            {(newRules.columnComparision == '==' ||
                newRules.columnComparision == '!=') && (
                <StyledMainSection>
                    <StyledSelect
                        label="Select Values"
                        name="valuesToColour"
                        SelectProps={{
                            multiple: true,
                        }}
                        value={newRules?.valuesToColour || []}
                        onChange={(e) => updateFields('valuesToColour', e)}
                    >
                        {(valuesToColour === undefined ||
                            valuesToColour.length === 0) && (
                            <Select.Item value="">
                                No Values to display
                            </Select.Item>
                        )}
                        {valuesToColour !== undefined &&
                            valuesToColour?.length > 0 && (
                                <Select.Item value="">
                                    Select Values
                                </Select.Item>
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
            )}
            {
                <StyledMainSection>
                    {conditionForShowingField && (
                        <StyledMainSection>
                            <label>Min: {newRules.filterMinValue}</label>
                            <br />
                            <label>Max: {newRules.filterMaxValue}</label>
                            <br />
                        </StyledMainSection>
                    )}
                    {conditionForShowingField && (
                        <StyledTextField
                            label="Select Value"
                            name="filterValue"
                            value={newRules.filterValue}
                            onChange={(e) => updateFields('filterValue', e)}
                        ></StyledTextField>
                    )}
                </StyledMainSection>
            }
            <StyledMainSection>
                <Button onClick={updateData}>Execute</Button>
            </StyledMainSection>
        </Stack>
    );

    function deleteAssignedRule(rule, index) {
        let assignedRules = appliedRules;
        assignedRules = assignedRules.filter(
            (item, itemindex) => index !== itemindex,
        );
        functionCallReference.current.applyRulesToChart = true;
        assignedRules = assignedRules.map((item, index) => {
            return {
                ...item,
                ['index']: index,
            };
        });
        setAppliedRules(assignedRules);
    }
    function editAssignedRule(rule, index) {
        let assignedRules = rule;
        setNewRules(assignedRules);
    }

    return <>{accordionDetails}</>;
});
export default ColourByValue;
