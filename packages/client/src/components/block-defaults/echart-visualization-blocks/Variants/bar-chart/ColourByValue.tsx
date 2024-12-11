import { useBlock, useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { EchartVisualizationBlockDef } from '../../EchartVisualizationBlock';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Select, Stack, styled, Table, TextField } from '@semoss/ui';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PathValue } from 'react-hook-form';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';
import { BAR_CHART_DATA } from '../../Echart.constants';
import { Delete, Edit } from '@mui/icons-material';
import { assign } from 'mobx/dist/internal';

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
    index: -1,
};

const StyledSpan = styled('span')(() => ({
    display: 'flex',
    justifyContent: 'space-around',
}));

const ColourByValue = observer<ColourByValueProps>(({ id, updateChart }) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

    const [newRules, setNewRules] = useState(INITIAL_NEW_RULES);

    const [valuesToColour, setValuesToColour] = useState([]);
    const [value, setValue] = useState({});
    const [appliedRules, setAppliedRules] = useState([]);
    let functionCallReference = useRef({
        valuesResetCheck: false,
        assignedRules: [],
    });
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
        if (functionCallReference.current.valuesResetCheck) {
            let optionToValidate =
                typeof computedValue === 'string'
                    ? JSON.parse(computedValue)
                    : computedValue;
            let seriesIndex = optionToValidate['series'].findIndex((opt) =>
                BAR_CHART_DATA.JSONVALUE.includes(opt.type),
            );
            let dataToValidate =
                optionToValidate['series'][seriesIndex]['data'] || [];
            let styleExists = dataToValidate.some(
                (data) =>
                    typeof data === 'object' &&
                    data.hasOwnProperty('itemStyle'),
            );
            if (!styleExists) {
                updateExistingRules(
                    functionCallReference.current.assignedRules,
                    computedValue,
                );
                functionCallReference.current.valuesResetCheck = false;
                functionCallReference.current.assignedRules = [];
            }
        }
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
                    if (item === itemAvailable) {
                        xAxisPosition.push(index);
                    }
                });
                //option['xAxis']['data'].findIndex((data)=>(data.hasOwnProperty('value') ? (data.value === item) : (data === item)));
                positions = [...xAxisPosition, ...positions];
            });
        }
        if (sourceObject.columnComparision === '!=') {
            let dataVerify = option['xAxis']['data'];
            sourceObject.valuesToColour.forEach((item) => {
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
        if (sourceObject.columnComparision === '<') {
            //less than comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (!isNaN(item) && item < sourceObject.filterValue) {
                    positions.push(index);
                }
            });
        }
        if (sourceObject.columnComparision === '>') {
            //greater than comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (!isNaN(item) && item > sourceObject.filterValue) {
                    positions.push(index);
                }
            });
        }
        if (sourceObject.columnComparision === '<=') {
            //less than or equal to comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (!isNaN(item) && item <= sourceObject.filterValue) {
                    positions.push(index);
                }
            });
        }
        if (sourceObject.columnComparision === '>=') {
            //greater than or equal to comparision
            let dataVerify = option['xAxis']['data'];
            dataVerify.forEach((item, index) => {
                if (!isNaN(item) && item >= sourceObject.filterValue) {
                    positions.push(index);
                }
            });
        }

        return positions;
    }
    function updatePositionsForAxis(option, positions, rules: any = {}) {
        let optionToUpdate = option;
        if (Object.keys(rules).length === 0) {
            rules = newRules;
        }
        positions.forEach((item) => {
            let currentValue = optionToUpdate[item];
            if (typeof optionToUpdate[item] === 'object') {
                optionToUpdate[item] = {
                    ...optionToUpdate[item],
                    ['itemStyle']: {
                        ...optionToUpdate[item]['itemStyle'],
                        ['color']: rules.columnColour,
                    },
                };
            } else {
                optionToUpdate[item] = {
                    ['value']: currentValue,
                    ['itemStyle']: {
                        ['color']: rules.columnColour,
                    },
                };
            }
        });
        return optionToUpdate;
    }
    function updateData() {
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let seriesIndex = option['series'].findIndex((opt) =>
            BAR_CHART_DATA.JSONVALUE.includes(opt.type),
        );
        if (newRules.index === -1) {
            let xAxisPosition = getXAxisPositions();
            let optionUpdated = option;
            if (xAxisPosition.length) {
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
                            appliedRulesUpdated.push({
                                ...newRules,
                                ['index']: appliedRulesUpdated.length,
                            });
                            setAppliedRules(appliedRulesUpdated);
                            setNewRules(INITIAL_NEW_RULES);
                        } catch (e) {
                            console.log(e);
                        }
                    }, 300);
                }
            }
        } else {
            let index = newRules.index;
            let assignedRules = appliedRules;
            console.log(
                [
                    ...assignedRules.filter(
                        (item, itemIndex) => itemIndex < index,
                    ),
                    newRules,
                    ...assignedRules.filter(
                        (item, itemIndex) => itemIndex > index,
                    ),
                ],
                'updatedEdit',
            );
            let updatedRules = [
                ...assignedRules.filter((item, itemIndex) => itemIndex < index),
                newRules,
                ...assignedRules.filter((item, itemIndex) => itemIndex > index),
            ];
            updateExistingRules(updatedRules, computedValue);
            setNewRules(INITIAL_NEW_RULES);
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
                        {appliedRules.map((rule, index) => {
                            return (
                                <tr>
                                    <td>{rule.column}</td>
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
    function updateExistingRules(assignedRules, valueCompute) {
        setTimeout(() => {
            console.log(assignedRules, 'appliedRulesonUpdateExistingRules');
            let option =
                typeof valueCompute === 'string'
                    ? JSON.parse(valueCompute)
                    : valueCompute;
            assignedRules.forEach((item, index) => {
                let xAxisPositions = getXAxisPositions(item);
                let seriesIndex = option['series'].findIndex((item) =>
                    BAR_CHART_DATA.JSONVALUE.includes(item.type),
                );
                let optionUpdatedList = updatePositionsForAxis(
                    option['series'][seriesIndex]['data'],
                    xAxisPositions,
                    item,
                );
                option['series'][seriesIndex]['data'] = optionUpdatedList;
                option = {
                    ...option,
                    ['customSettings']: {
                        ...option['customSettings'],
                        ['optionStateChange']: true,
                    },
                };
                let chartOption = option;
                updateChart(chartOption);
            });
        }, 100);
    }
    function deleteAssignedRule(rule, index) {
        let assignedRules = appliedRules;
        assignedRules = assignedRules.filter(
            (item, itemindex) => index !== itemindex,
        );
        setAppliedRules(assignedRules);
        console.log(assignedRules, 'assignedRules');
        setTimeout(() => {
            try {
                let dataVal =
                    typeof value === 'string' ? JSON.parse(value) : value;
                let dataValUpdated = dataVal;
                let seriesIndex = dataVal['series'].findIndex((opt) =>
                    BAR_CHART_DATA.JSONVALUE.includes(opt.type),
                );
                let dataArrayToUpdate = dataVal['series'][seriesIndex]['data'];
                dataArrayToUpdate = dataArrayToUpdate.map((item) => {
                    return {
                        ['value']: item.value || item,
                    };
                });
                console.log(dataArrayToUpdate, 'dataArrayToupdate');
                dataVal['series'][seriesIndex]['data'] = dataArrayToUpdate;
                dataVal['customSettings'] = {
                    ...dataVal['customSettings'],
                    ['optionStateChange']: true,
                };
                dataValUpdated = dataVal;
                updateChart(dataValUpdated);
                functionCallReference.current.valuesResetCheck = true;
                functionCallReference.current.assignedRules = assignedRules;
                // updateExistingRules(assignedRules);
            } catch (e) {
                console.log('e', e);
            }
        }, 100);
    }
    function editAssignedRule(rule, index) {
        let assignedRules = rule;
        setNewRules(assignedRules);
    }

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
