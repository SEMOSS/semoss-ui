import { useState, useEffect } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import { Button, Checkbox, Slider, TextField } from '@semoss/ui';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
export const EditXAxis = ({ updateChart, chartType, option }) => {
    const [xaxisState, setXaxisState] = useState({
        xaxistitle: '',
        centerAlignText: false,
        titleGapValue: 15,
        titleGapMinValue: 1,
        titleGapMaxValue: 100,
        showXAxisLine: true,
        showXAxisLineTicks: false,
        showXAxisValues: true,
        showXAxisAllLabels: false,
        showAllLabels: false,
        labelFontSize: 12,
        rotate: 0,
        rotateLabelMinValue: 0,
        rotateLabelMaxValue: 360,
        prependLabelValue: '',
        appendLabelValue: '',
        format: '',
        numberDelimiter: '',
    });

    useEffect(() => {
        let axis = 'xAxis';
        let xAxisStateData = {
            xaxistitle: '',
            centerAlignText: false,
            titleGapValue: 15,
            titleGapMinValue: 1,
            titleGapMaxValue: 100,
            showXAxisLine: true,
            showXAxisLineTicks: false,
            showXAxisValues: true,
            showXAxisAllLabels: false,
            showAllLabels: false,
            labelFontSize: 12,
            rotate: 0,
            rotateLabelMinValue: 0,
            rotateLabelMaxValue: 360,
            prependLabelValue: '',
            appendLabelValue: '',
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
                    ? option[axis]['axisLine'].show
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
                xAxisStateData.prependLabelValue = option[axis][
                    'axisLabel'
                ].hasOwnProperty('prependValue')
                    ? option[axis]['axisLabel']['prependValue']
                    : '';
                xAxisStateData.appendLabelValue = option[axis][
                    'axisLabel'
                ].hasOwnProperty('appendValue')
                    ? option[axis]['axisLabel']['appendValue']
                    : '';
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

    const accordionDetails = (
        <div>
            <div>
                <label htmlFor="xaxis-title">Show X-Axis Title</label>
                <TextField
                    id="xaxis-title"
                    value={xaxisState.xaxistitle}
                    style={{ width: '100%' }}
                    onChange={(e) => handleInputChange(e, 'xaxistitle')}
                />
            </div>
            <div>
                <Checkbox
                    id="xaxis-center-align-text"
                    checked={xaxisState.centerAlignText}
                    onChange={(e) => handleInputChange(e, 'centerAlignText')}
                />
                <label htmlFor="xaxis-center-align-text">
                    Center Align Text
                </label>
            </div>
            <div>
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
                <span
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                    }}
                >
                    <span>{xaxisState.titleGapMinValue}</span>
                    <span>{xaxisState.titleGapMaxValue}</span>
                </span>
            </div>

            <div>
                <Checkbox
                    id="show-xaxis-line"
                    checked={xaxisState.showXAxisLine}
                    onChange={(e) =>
                        handleInputChange(
                            e,
                            'showXAxisLine',
                            !xaxisState.showXAxisLine,
                        )
                    }
                />
                <label htmlFor="show-xaxis-line">Show XAxis Line</label>
            </div>
            <div>
                <Checkbox
                    id="show-xaxis-line-ticks"
                    checked={xaxisState.showXAxisLineTicks}
                    onChange={(e) =>
                        handleInputChange(
                            e,
                            'showXAxisLineTicks',
                            !xaxisState.showXAxisLineTicks,
                        )
                    }
                />
                <label htmlFor="show-xaxis-line">Show XAxis Line Ticks</label>
            </div>
            <div>
                <Checkbox
                    id="show-xaxis-values"
                    checked={xaxisState.showXAxisValues}
                    onChange={(e) =>
                        handleInputChange(
                            e,
                            'showXAxisValues',
                            !xaxisState.showXAxisValues,
                        )
                    }
                />
                <label htmlFor="show-xaxis-values">Show XAxis Values</label>
            </div>
            {xaxisState.showXAxisValues && (
                <div>
                    <div>
                        <Checkbox
                            id="show-all-labels"
                            checked={xaxisState.showAllLabels}
                            onChange={(e) =>
                                handleInputChange(
                                    e,
                                    'showAllLabels',
                                    !xaxisState.showAllLabels,
                                )
                            }
                        />
                        <label htmlFor="show-all-labels">
                            Show All Labels for XAxis Values
                        </label>
                    </div>
                    <div>
                        <label htmlFor="set-font-size">
                            Edit Label Font Size:
                        </label>
                        <TextField
                            id="set-font-size"
                            value={xaxisState.labelFontSize}
                            style={{ width: '100%' }}
                            type="number"
                            onChange={(e) =>
                                handleInputChange(e, 'labelFontSize')
                            }
                        />
                    </div>
                    <div>
                        <label htmlFor="rotate-label">
                            Rotate X-Axis Values:
                        </label>
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
                        <span
                            style={{
                                display: 'flex',
                                width: '100%',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span>{xaxisState.rotateLabelMinValue}</span>
                            <span>{xaxisState.rotateLabelMaxValue}</span>
                        </span>
                    </div>
                    <div>
                        <label htmlFor="prepend-label-value">
                            Prepend Label Value :
                        </label>
                        <TextField
                            id="prepend-label-value"
                            value={xaxisState.prependLabelValue}
                            style={{ width: '100%' }}
                            onChange={(e) =>
                                handleInputChange(e, 'prependLabelValue')
                            }
                        />
                    </div>
                    <div>
                        <label htmlFor="append-label-value">
                            Append Label Value :
                        </label>
                        <TextField
                            id="append-label-value"
                            value={xaxisState.appendLabelValue}
                            style={{ width: '100%' }}
                            onChange={(e) =>
                                handleInputChange(e, 'appendLabelValue')
                            }
                        />
                    </div>
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <Button
                    type="button"
                    onClick={(e) => updateChart(xaxisState, 'xAxis')}
                >
                    Execute
                </Button>
            </div>
        </div>
    );
    return (
        <CustomAccordianBlock
            accordianExpanded={false}
            accordianSummaryProps={<ExpandMoreIcon />}
            accordianSummary={'Edit X Axis'}
            accordianDetails={accordionDetails}
        />
    );
};
