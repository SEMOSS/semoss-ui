import {
    useState,
    useEffect,
    SyntheticEvent,
    ChangeEvent,
    useMemo,
} from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import {
    Button,
    Checkbox,
    Slider,
    styled,
    TextField,
    Switch,
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
//Changing the Y axis styling like title, rotate and changing the labels
export const EditYAxis = ({ updateChart, chartType, option, id }) => {
    const { data, setData } = useBlockSettings<any>(id);
    const [yaxisState, setYaxisState] = useState({
        showAxis: true,
        yaxistitle: '',
        yaxisTitleFontSize: 18,
        centerAlignText: false,
        titleGapValue: 15,
        titleGapMinValue: 1,
        titleGapMaxValue: 100,
        showYAxisLine: true,
        showYAxisLineTicks: false,
        showYAxisValues: true,
        showYAxisLabels: true,
        showYAxisAllLabels: false,
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
    let axisValue = 'yAxis';
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
        let axis = 'yAxis';
        let yAxisStateData = {
            showAxis: true,
            yaxistitle: '',
            yaxisTitleFontSize: 18,
            centerAlignText: false,
            titleGapValue: 15,
            titleGapMinValue: 1,
            titleGapMaxValue: 100,
            showYAxisLine: true,
            showYAxisLineTicks: false,
            showYAxisValues: true,
            showYAxisLabels: true,
            showYAxisAllLabels: false,
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
            yAxisStateData.yaxistitle = option[axis].hasOwnProperty('name')
                ? option[axis]['name']
                : '';
            yAxisStateData.centerAlignText = option[axis].hasOwnProperty(
                'nameLocation',
            )
                ? true
                : false;
            yAxisStateData.titleGapValue = option[axis].hasOwnProperty(
                'nameGap',
            )
                ? option[axis]['nameGap']
                : 15;

            if (option[axis].hasOwnProperty('axisLine')) {
                yAxisStateData.showYAxisLine = option[axis][
                    'axisLine'
                ].hasOwnProperty('show')
                    ? option[axis]['axisLine'].show
                    : true;
            }
            if (option[axis].hasOwnProperty('axisTick')) {
                yAxisStateData.showYAxisLineTicks = option[axis][
                    'axisTick'
                ].hasOwnProperty('show')
                    ? option[axis]['axisTick'].show
                    : false;
            }
            if (option[axis].hasOwnProperty('axisLabel')) {
                yAxisStateData.showYAxisValues = option[axis][
                    'axisLabel'
                ].hasOwnProperty('show')
                    ? option[axis]['axisLabel'].show
                    : true;
                // yAxisStateData.showAllLabels = option[axis]['axisLabel'].hasOwnProperty('interval') && option[axis]['axisLabel'].hasOwnProperty('show') ? (option[axis]['axisLabel'].hasOwnProperty('interval')) : false;
                yAxisStateData.labelFontSize = option[axis][
                    'axisLabel'
                ].hasOwnProperty('fontSize')
                    ? option[axis]['axisLabel']['fontSize']
                    : 12;
                yAxisStateData.rotate = option[axis][
                    'axisLabel'
                ].hasOwnProperty('rotate')
                    ? option[axis]['axisLabel']['rotate']
                    : 0;
                /*yAxisStateData.prependLabelValue = option[axis][
                    'axisLabel'
                ].hasOwnProperty('prependValue')
                    ? option[axis]['axisLabel']['prependValue']
                    : '';
                yAxisStateData.appendLabelValue = option[axis][
                    'axisLabel'
                ].hasOwnProperty('appendValue')
                    ? option[axis]['axisLabel']['appendValue']
                    : '';*/
            }
        }
        setYaxisState((prevState) => {
            return {
                ...prevState,
                ...yAxisStateData,
            };
        });
    }, []);

    function updateChartData() {
        let axis = 'yAxis';
        let axisData = {
            showAxis: yaxisState.showAxis,
            yaxistitle: yaxisState.yaxistitle,
            yaxisTitleFontSize: yaxisState.yaxisTitleFontSize,
            showYAxisLabels: yaxisState.showYAxisLabels,
            labelFontSize: yaxisState.labelFontSize,
            rotate: yaxisState.rotate,
            showYAxisLineTicks: yaxisState.showYAxisLineTicks,
        };
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let optionUpdated = option;
        if (option.hasOwnProperty(axis) && option[axis]) {
            if (axisData.hasOwnProperty('showAxis')) {
                option[axis] = {
                    ...option[axis],
                    ['show']: axisData.showAxis,
                };
            }
            if (axisData.hasOwnProperty('yaxistitle')) {
                option[axis] = {
                    ...option[axis],
                    ['name']: axisData.yaxistitle,
                };
            }
            if (axisData.hasOwnProperty('yaxisTitleFontSize')) {
                option[axis] = {
                    ...option[axis],
                    ['nameTextStyle']: {
                        ...option[axis]['nameTextStyle'],
                        ['fontSize']:
                            Number(axisData.yaxisTitleFontSize) || undefined,
                    },
                };
            }

            if (axisData.hasOwnProperty('showYAxisLineTicks')) {
                option[axis] = {
                    ...option[axis],
                    ['axisTick']: {
                        ...option[axis]['axisTick'],
                        ['show']: axisData.showYAxisLineTicks,
                        ['alignWithLabel']: axisData.showYAxisLineTicks,
                    },
                };
            }

            if (axisData.hasOwnProperty('showYAxisLabels')) {
                option[axis] = {
                    ...option[axis],
                    ['axisLabel']: {
                        ...option[axis]['axisLabel'],
                        ['show']: axisData.showYAxisLabels,
                    },
                };
            }

            if (axisData.hasOwnProperty('labelFontSize')) {
                option[axis] = {
                    ...option[axis],
                    ['axisLabel']: {
                        ...option[axis]['axisLabel'],
                        ['show']: option[axis]['axisLabel']['show'],
                        ['fontSize']:
                            Number(axisData.labelFontSize) || undefined,
                    },
                };
            }
            if (axisData.hasOwnProperty('rotate')) {
                option[axis] = {
                    ...option[axis],
                    ['axisLabel']: {
                        ...option[axis]['axisLabel'],
                        ['show']: option[axis]['axisLabel']['show'],
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

    function handleInputChange(e, title, directVal = undefined) {
        console.log(e, 'event');
        if (directVal != undefined) {
            setYaxisState((prevXaxisState) => {
                return {
                    ...prevXaxisState,
                    [title]: directVal,
                };
            });
        } else {
            setYaxisState((prevXaxisState) => {
                return {
                    ...prevXaxisState,
                    [title]: e.target.value,
                };
            });
        }
    }

    const accordionDetails = (
        <StyledAxisDiv style={{ padding: '0.95rem' }}>
            <StyledAxisDiv display="flex" justifyContent="space-around">
                <Switch
                    defaultChecked={yaxisState.showAxis ?? undefined}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(e, 'showAxis', e.target.checked)
                    }
                    title="Show Axis Title"
                />
                <label>Show Axis Title</label>
            </StyledAxisDiv>
            {yaxisState.showAxis && (
                <StyledAxisDiv>
                    <label htmlFor="yaxis-title">Set Axis Title</label>
                    <StyledTextField
                        id="yaxis-title"
                        value={yaxisState.yaxistitle}
                        onChange={(e) => handleInputChange(e, 'yaxistitle')}
                    />
                </StyledAxisDiv>
            )}
            {yaxisState.showAxis && (
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <label htmlFor="xaxis-edit-title-font-size">
                        Edit Axis Title Font Size
                    </label>
                    <TextField
                        id="xaxis-edit-title-font-size"
                        type="number"
                        value={yaxisState.yaxisTitleFontSize}
                        onChange={(e) =>
                            handleInputChange(e, 'yaxisTitleFontSize')
                        }
                    />
                </StyledAxisColDiv>
            )}

            <StyledAxisDiv display="flex" justifyContent="space-around">
                <Switch
                    defaultChecked={yaxisState.showYAxisLabels ?? undefined}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(
                            e,
                            'showYAxisLabels',
                            e.target.checked,
                        )
                    }
                    title="Show XAxis Labels"
                />
                <label htmlFor="show-xaxis-labels">Show YAxis Labels</label>
            </StyledAxisDiv>
            {yaxisState.showYAxisLabels && (
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <label htmlFor="set-font-size">Edit Label Font Size:</label>
                    <StyledTextField
                        id="set-font-size"
                        value={yaxisState.labelFontSize}
                        type="number"
                        onChange={(e) => handleInputChange(e, 'labelFontSize')}
                    />
                </StyledAxisColDiv>
            )}
            {yaxisState.showYAxisLabels && (
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <label htmlFor="rotate-label">Rotate X-Axis Values:</label>
                    <Slider
                        aria-label="Always visible"
                        value={yaxisState.rotate}
                        min={yaxisState.rotateLabelMinValue}
                        max={yaxisState.rotateLabelMaxValue}
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
                        <span>{yaxisState.rotateLabelMinValue}</span>
                        <span>{yaxisState.rotateLabelMaxValue}</span>
                    </StyledAxisSpan>
                </StyledAxisColDiv>
            )}

            <StyledAxisDiv>
                <Switch
                    defaultChecked={yaxisState.showYAxisLineTicks}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(
                            e,
                            'showYAxisLineTicks',
                            e.target.checked,
                        )
                    }
                    title="Show YAxis Line Ticks"
                />
                <label htmlFor="show-yaxis-line">Show YAxis Line Ticks</label>
            </StyledAxisDiv>

            <StyledAxisDiv display="flex" justifyContent="center">
                <Button type="button" onClick={(e) => updateChartData()}>
                    Execute
                </Button>
            </StyledAxisDiv>
        </StyledAxisDiv>
    );
    return <>{accordionDetails}</>;
};
