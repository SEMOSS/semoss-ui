import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import {
    Button,
    Checkbox,
    Slider,
    styled,
    Switch,
    TextField,
} from '@semoss/ui';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useBlockSettings } from '@/hooks';
import { PathValue } from '@/types';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';

const StyledAxisDiv = styled('div')<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: 'row',
    padding: '0.5rem',
}));

const StyledAxisColDiv = styled('div')<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: 'column',
    padding: '0.5rem',
}));

const StyledAxisSpan = styled('span')<{
    display?: string;
    justifyContent?: string;
    width?: string;
}>(({ theme, display, justifyContent, width }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    width: width ?? undefined,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
}));
//Changing the X axis styling like title, rotate and changing the labels
export const EditXAxis = ({ updateChart, chartType, option, id }) => {
    const { data, setData } = useBlockSettings<any>(id);
    const [xaxisState, setXaxisState] = useState({
        showAxis: true,
        xaxistitle: '',
        xaxisTitleFontSize: 18,
        centerAlignText: false,
        titleGapValue: 15,
        titleGapMinValue: 1,
        titleGapMaxValue: 100,
        showXAxisLine: true,
        showXAxisLineTicks: false,
        showXAxisValues: true,
        showXAxisLabels: true,
        showXAxisAllLabels: false,
        showAllLabels: false,
        labelFontSize: 12,
        rotate: 0,
        rotateLabelMinValue: 0,
        rotateLabelMaxValue: 360,
        // prependLabelValue: '',
        // appendLabelValue: '',
        format: '',
        numberDelimiter: '',
    });
    const [value, setValue] = useState(data.option);
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
    useEffect(() => {
        let axis = 'xAxis';
        let xAxisStateData = {
            showAxis: true,
            xaxistitle: '',
            xaxisTitleFontSize: 18,
            centerAlignText: false,
            titleGapValue: 15,
            titleGapMinValue: 1,
            titleGapMaxValue: 100,
            showXAxisLine: true,
            showXAxisLineTicks: false,
            showXAxisValues: true,
            showXAxisLabels: true,
            showXAxisAllLabels: false,
            showAllLabels: false,
            labelFontSize: 12,
            rotate: 0,
            rotateLabelMinValue: 0,
            rotateLabelMaxValue: 360,
            // prependLabelValue: '',
            // appendLabelValue: '',
            format: '',
            numberDelimiter: '',
        };
        if (option.hasOwnProperty(axis) && option[axis]) {
            xAxisStateData.xaxistitle = option[axis].hasOwnProperty('name')
                ? option[axis]['name']
                : '';
            xAxisStateData.centerAlignText = option[axis].hasOwnProperty(
                'nameLocation',
            )
                ? true
                : false;
            xAxisStateData.titleGapValue = option[axis].hasOwnProperty(
                'nameGap',
            )
                ? option[axis]['nameGap']
                : 15;
            console.log(option[axis].hasOwnProperty('nameLocation'));

            if (option[axis].hasOwnProperty('axisLine')) {
                xAxisStateData.showXAxisLine = option[axis][
                    'axisLine'
                ].hasOwnProperty('show')
                    ? option[axis]['axisLine'].show
                    : true;
            }
            if (option[axis].hasOwnProperty('axisTick')) {
                xAxisStateData.showXAxisLineTicks = option[axis][
                    'axisTick'
                ].hasOwnProperty('show')
                    ? option[axis]['axisTick'].show
                    : false;
            }
            if (option[axis].hasOwnProperty('axisLabel')) {
                xAxisStateData.showXAxisValues = option[axis][
                    'axisLabel'
                ].hasOwnProperty('show')
                    ? option[axis]['axisLabel'].show
                    : true;
                xAxisStateData.showAllLabels =
                    option[axis]['axisLabel'].hasOwnProperty('interval') &&
                    option[axis]['axisLabel'].hasOwnProperty('show')
                        ? option[axis]['axisLabel'].hasOwnProperty('interval')
                        : false;
                xAxisStateData.labelFontSize = option[axis][
                    'axisLabel'
                ].hasOwnProperty('fontSize')
                    ? option[axis]['axisLabel']['fontSize']
                    : 12;
                xAxisStateData.rotate = option[axis][
                    'axisLabel'
                ].hasOwnProperty('rotate')
                    ? option[axis]['axisLabel']['rotate']
                    : 0;
                /*xAxisStateData.prependLabelValue = option[axis][
                    'axisLabel'
                ].hasOwnProperty('prependValue')
                    ? option[axis]['axisLabel']['prependValue']
                    : '';
                xAxisStateData.appendLabelValue = option[axis][
                    'axisLabel'
                ].hasOwnProperty('appendValue')
                    ? option[axis]['axisLabel']['appendValue']
                    : '';*/
            }
        }
        setXaxisState((prevState) => {
            return {
                ...prevState,
                ...xAxisStateData,
            };
        });
    }, []);

    function handleInputChange(e, title, directVal = undefined) {
        if (directVal != undefined) {
            setXaxisState((prevXaxisState) => {
                return {
                    ...prevXaxisState,
                    [title]: directVal,
                };
            });
        } else {
            setXaxisState((prevXaxisState) => {
                return {
                    ...prevXaxisState,
                    [title]: e.target.value,
                };
            });
        }
    }

    function updateChartData() {
        let axisData = {
            showAxis: xaxisState.showAxis,
            xaxistitle: xaxisState.xaxistitle,
            xaxisTitleFontSize: xaxisState.xaxisTitleFontSize,
            showXAxisLabels: xaxisState.showXAxisLabels,
            labelFontSize: xaxisState.labelFontSize,
            rotate: xaxisState.rotate,
            showXAxisLineTicks: xaxisState.showXAxisLineTicks,
        };
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let optionUpdated = option;
        if (option.hasOwnProperty('xAxis') && option['xAxis']) {
            if (axisData.hasOwnProperty('showAxis')) {
                option['xAxis'] = {
                    ...option['xAxis'],
                    ['show']: axisData.showAxis,
                };
            }
            if (axisData.hasOwnProperty('xaxistitle')) {
                option['xAxis'] = {
                    ...option['xAxis'],
                    ['name']: axisData.xaxistitle,
                };
            }
            if (axisData.hasOwnProperty('xaxisTitleFontSize')) {
                option['xAxis'] = {
                    ...option['xAxis'],
                    ['nameTextStyle']: {
                        ...option['xAxis']['nameTextStyle'],
                        ['fontSize']:
                            Number(axisData.xaxisTitleFontSize) || undefined,
                    },
                };
            }

            if (axisData.hasOwnProperty('showXAxisLineTicks')) {
                option['xAxis'] = {
                    ...option['xAxis'],
                    ['axisTick']: {
                        ...option['xAxis']['axisTick'],
                        ['show']: axisData.showXAxisLineTicks,
                        ['alignWithLabel']: axisData.showXAxisLineTicks,
                    },
                };
            }

            if (axisData.hasOwnProperty('showXAxisLabels')) {
                option['xAxis'] = {
                    ...option['xAxis'],
                    ['axisLabel']: {
                        ...option['xAxis']['axisLabel'],
                        ['show']: axisData.showXAxisLabels,
                    },
                };
            }

            if (axisData.hasOwnProperty('labelFontSize')) {
                option['xAxis'] = {
                    ...option['xAxis'],
                    ['axisLabel']: {
                        ...option['xAxis']['axisLabel'],
                        ['show']: option['xAxis']['axisLabel']['show'],
                        ['fontSize']:
                            Number(axisData.labelFontSize) || undefined,
                    },
                };
            }
            if (axisData.hasOwnProperty('rotate')) {
                option['xAxis'] = {
                    ...option['xAxis'],
                    ['axisLabel']: {
                        ...option['xAxis']['axisLabel'],
                        ['show']: option['xAxis']['axisLabel']['show'],
                        ['rotate']: axisData.rotate,
                    },
                };
            }
            optionUpdated = option;
            runStateUpdateCustom(optionUpdated);
        }
    }
    function runStateUpdateCustom(optionUpdated: any) {
        setTimeout(() => {
            try {
                setData('option', optionUpdated as PathValue<any, typeof path>);
            } catch (e) {
                console.log(e);
            }
        }, 300);
    }

    const accordionDetails = (
        <StyledAxisDiv>
            <StyledAxisDiv display="flex" justifyContent="space-around">
                <Switch
                    defaultChecked={xaxisState.showAxis ?? undefined}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(e, 'showAxis', e.target.checked)
                    }
                    title="Show Axis Title"
                />
                <label>Show Axis Title</label>
            </StyledAxisDiv>
            {xaxisState.showAxis && (
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <label htmlFor="xaxis-title">Set Axis Title</label>
                    <StyledTextField
                        id="xaxis-title"
                        value={xaxisState.xaxistitle}
                        onChange={(e) => handleInputChange(e, 'xaxistitle')}
                    />
                </StyledAxisColDiv>
            )}
            {xaxisState.showAxis && (
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <label htmlFor="xaxis-edit-title-font-size">
                        Edit Axis Title Font Size
                    </label>
                    <TextField
                        id="xaxis-edit-title-font-size"
                        type="number"
                        value={xaxisState.xaxisTitleFontSize}
                        onChange={(e) =>
                            handleInputChange(e, 'xaxisTitleFontSize')
                        }
                    />
                </StyledAxisColDiv>
            )}
            {/* <StyledAxisDiv>
                <label>X Axis Title Gap</label>
                <Slider
                    aria-label="Always visible"
                    value={xaxisState.titleGapValue}
                    min={xaxisState.titleGapMinValue}
                    max={xaxisState.titleGapMaxValue}
                    valueLabelDisplay="on"
                    onChange={(event, newValue) =>
                        handleInputChange(event, 'titleGapValue', newValue)
                    }
                />
                <StyledAxisSpan
                    display="flex"
                    justifyContent="space-between"
                    width="100%"
                >
                    <span>{xaxisState.titleGapMinValue}</span>
                    <span>{xaxisState.titleGapMaxValue}</span>
                </StyledAxisSpan>
            </StyledAxisDiv>

            <StyledAxisDiv>
                <Checkbox
                    id="show-xaxis-line"
                    // defaultChecked={xaxisState.showXAxisLine}
                    // onChange={(e) =>
                    //     handleInputChange(
                    //         e,
                    //         'showXAxisLine',
                    //         !xaxisState.showXAxisLine,
                    //     )
                    // }
                    checked={xaxisState.showXAxisLine}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(e, 'showXAxisLine', e.target.checked)
                    }
                />
                <label htmlFor="show-xaxis-line">Show XAxis Line</label>
            </StyledAxisDiv> */}
            <StyledAxisDiv display="flex" justifyContent="space-around">
                <Switch
                    defaultChecked={xaxisState.showXAxisLabels ?? undefined}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(
                            e,
                            'showXAxisLabels',
                            e.target.checked,
                        )
                    }
                    title="Show XAxis Labels"
                />
                <label htmlFor="show-xaxis-labels">Show XAxis Labels</label>
            </StyledAxisDiv>
            {xaxisState.showXAxisLabels && (
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <label htmlFor="set-font-size">Edit Label Font Size:</label>
                    <StyledTextField
                        id="set-font-size"
                        value={xaxisState.labelFontSize}
                        type="number"
                        onChange={(e) => handleInputChange(e, 'labelFontSize')}
                    />
                </StyledAxisColDiv>
            )}
            {xaxisState.showXAxisLabels && (
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <label htmlFor="rotate-label">Rotate X-Axis Values:</label>
                    <Slider
                        aria-label="Always visible"
                        value={xaxisState.rotate}
                        min={xaxisState.rotateLabelMinValue}
                        max={xaxisState.rotateLabelMaxValue}
                        valueLabelDisplay="on"
                        onChange={(event, newValue) =>
                            handleInputChange(event, 'rotate', newValue)
                        }
                    />
                    <StyledAxisSpan
                        display="flex"
                        width="100%"
                        justifyContent="space-between"
                    >
                        <span>{xaxisState.rotateLabelMinValue}</span>
                        <span>{xaxisState.rotateLabelMaxValue}</span>
                    </StyledAxisSpan>
                </StyledAxisColDiv>
            )}

            <StyledAxisDiv display="flex" justifyContent="space-around">
                <Switch
                    defaultChecked={xaxisState.showXAxisLineTicks ?? undefined}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(
                            e,
                            'showXAxisLineTicks',
                            e.target.checked,
                        )
                    }
                    title="Show XAxis Line Ticks"
                />
                <label htmlFor="show-xaxis-line">Show XAxis Line Ticks</label>
            </StyledAxisDiv>
            <StyledAxisDiv display="flex" justifyContent="center">
                <Button type="button" onClick={(e) => updateChartData()}>
                    Execute
                </Button>
            </StyledAxisDiv>
        </StyledAxisDiv>
    );
    return (
        // <CustomAccordianBlock
        //     accordianExpanded={false}
        //     accordianSummaryProps={<ExpandMoreIcon />}
        //     accordianSummary={'Edit X Axis'}
        //     accordianDetails={accordionDetails}
        // />
        <>{accordionDetails}</>
    );
};
