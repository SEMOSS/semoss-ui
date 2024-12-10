import { useBlock, useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { EchartVisualizationBlockDef } from '../../EchartVisualizationBlock';
import { useEffect, useMemo, useState } from 'react';
import { Button, Select, Stack, styled, Table, TextField } from '@semoss/ui';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PathValue } from 'react-hook-form';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';
import { BAR_CHART_DATA } from '../../Echart.constants';

const StyledMainSection = styled('div')(() => ({
    display: 'inline-flex',
    width: '100%',
}));

const StyledSelect = styled(Select)(() => ({
    width: '48%',
}));

const StyledTextField = styled(TextField)<{
    width?: string;
}>(({ width }) => ({
    width: width ?? '48%',
}));

export interface ColourByValueProps {
    id: string;
    updateChart: (option: any) => void;
}

const INITIAL_NEW_RULES = {
    column: '',
    columnColour: '',
    columnToColour: '',
    columnComparision: '',
    valuesToColour: [],
    filterValue: 0,
    filterMinValue: 0,
    filterMaxValue: 0,
};

const ColourByValue = observer<ColourByValueProps>(({ id, updateChart }) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

    const [newRules, setNewRules] = useState(INITIAL_NEW_RULES);

    const [valuesToColour, setValuesToColour] = useState([]);
    const [value, setValue] = useState({});
    const [appliedRules, setAppliedRules] = useState([]);
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
        console.log(newRules, 'newRules', value);
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
                    let dataArray = option['xAxis']['data'].filter(
                        (item) => !isNaN(item),
                    );
                    console.log(
                        dataArray,
                        Math.min(...dataArray),
                        Math.max(...dataArray),
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
                        let dataArray = option['series'][seriesIndex][
                            'data'
                        ].filter((item) => !isNaN(item));
                        console.log(
                            dataArray,
                            Math.min(...dataArray),
                            Math.max(...dataArray),
                        );
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
    function findAllIndexes(array, item, indexPosition) {
        if (array.indexOf(item, indexPosition) > -1) {
            return array.indexOf(item, indexPosition);
        }
    }
    function getXAxisPositions() {
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let positions = [];
        if (newRules.columnComparision === '==') {
            newRules.valuesToColour.forEach((item) => {
                let xAxisPosition = [];
                option['xAxis']['data'].forEach((itemAvailable, index) => {
                    if (item === itemAvailable) {
                        xAxisPosition.push(index);
                    }
                });
                //option['xAxis']['data'].findIndex((data)=>(data.hasOwnProperty('value') ? (data.value === item) : (data === item)));
                positions = [...xAxisPosition, ...positions];
            });
        }
        if (newRules.columnComparision === '!=') {
            let dataVerify = option['xAxis']['data'];
            newRules.valuesToColour.forEach((item) => {
                let xAxisPosition = [];
                option['xAxis']['data'].forEach((itemAvailable, index) => {
                    if (item === itemAvailable) {
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
        if (newRules.columnComparision === '<') {
            //less than comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (!isNaN(item) && item < newRules.filterValue) {
                    positions.push(index);
                }
            });
        }
        if (newRules.columnComparision === '>') {
            //greater than comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (!isNaN(item) && item > newRules.filterValue) {
                    positions.push(index);
                }
            });
        }
        if (newRules.columnComparision === '<=') {
            //less than or equal to comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (!isNaN(item) && item <= newRules.filterValue) {
                    positions.push(index);
                }
            });
        }
        if (newRules.columnComparision === '>=') {
            //greater than or equal to comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (!isNaN(item) && item >= newRules.filterValue) {
                    positions.push(index);
                }
            });
        }

        return positions;
    }
    function updatePositionsForAxis(option, positions) {
        let optionToUpdate = option;
        positions.forEach((item) => {
            let currentValue = optionToUpdate[item];
            if (typeof optionToUpdate[item] === 'object') {
                optionToUpdate[item] = {
                    ...optionToUpdate[item],
                    ['itemStyle']: {
                        ...optionToUpdate[item]['itemStyle'],
                        ['color']: newRules.columnColour,
                    },
                };
            } else {
                optionToUpdate[item] = {
                    ['value']: currentValue,
                    ['itemStyle']: {
                        ['color']: newRules.columnColour,
                    },
                };
            }
        });
        return optionToUpdate;
    }
    function updateData() {
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let xAxisPosition = getXAxisPositions();
        let optionUpdated = option;
        if (xAxisPosition.length) {
            let seriesIndex = option['series'].findIndex((opt) =>
                BAR_CHART_DATA.JSONVALUE.includes(opt.type),
            );
            if (seriesIndex > -1) {
                let data = option['series'][seriesIndex]['data'];
                let updatedAxisValues = updatePositionsForAxis(
                    option['series'][seriesIndex]['data'],
                    xAxisPosition,
                );
                // let valueToUpdate  = option['series'][seriesIndex]['data'][xAxisPosition];
                // if(typeof valueToUpdate !== 'object'){
                //     option['series'][seriesIndex]['data'][xAxisPosition] = {
                //         value: valueToUpdate,
                //         ['itemStyle']:{
                //             ...option['series'][seriesIndex]['data'][xAxisPosition],
                //             ['color']: newRules.columnColour
                //         }
                //     };
                //     option['customSettings'] = {
                //         ...option['customSettings'],
                //         ['optionStateChange']: true,
                //     };
                // }
                option['series'][seriesIndex]['data'] = updatedAxisValues;
                option['customSettings'] = {
                    ...option['customSettings'],
                    ['optionStateChange']: true,
                };
                optionUpdated = option;
                setTimeout(() => {
                    try {
                        updateChart(optionUpdated);
                        let appliedRulesUpdated = appliedRules;
                        appliedRulesUpdated.push(newRules);
                        setAppliedRules(appliedRulesUpdated);
                        setNewRules(INITIAL_NEW_RULES);
                    } catch (e) {
                        console.log(e);
                    }
                }, 300);
            }
        }
    }
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

    const conditionForShowingField =
        newRules.columnComparision == '<' ||
        newRules.columnComparision == '>' ||
        newRules.columnComparision == '<=' ||
        newRules.columnComparision == '>=';

    const accordionDetails = (
        <Stack width={'100%'}>
            <StyledMainSection>
                <h3>Applied Rules</h3>
            </StyledMainSection>
            <StyledMainSection>
                <Table>
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
                        {appliedRules.length !== 0 &&
                            appliedRules.map((rule) => {
                                return (
                                    <tr>
                                        <td>{rule.column}</td>
                                        <td>{`${rule.column} ${
                                            rule.columnComparision
                                        } ${
                                            conditionForShowingField
                                                ? rule.filterValue
                                                : rule.valuesToColour.length ==
                                                  1
                                                ? rule.valuesToColour
                                                : [
                                                      rule.valuesToColour.join(
                                                          ',',
                                                      ),
                                                  ]
                                        }`}</td>
                                        <td></td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </Table>
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
