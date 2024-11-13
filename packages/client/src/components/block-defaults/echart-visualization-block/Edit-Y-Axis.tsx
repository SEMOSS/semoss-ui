import { useState, useEffect } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import { Button, Checkbox, Slider, TextField } from '@semoss/ui';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
export const EditYAxis = ({ updateChart, chartType, option }) => {
    const [yaxisState, setYaxisState] = useState({
        yaxistitle: '',
        centerAlignText: false,
        titleGapValue: 15,
        titleGapMinValue: 1,
        titleGapMaxValue: 100,
        showYAxisLine: true,
        showYAxisLineTicks: false,
        showYAxisValues: true,
        showYAxisAllLabels: false,
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
    let axisValue = 'yAxis';

    useEffect(() => {
        let axis = 'yAxis';
        let yAxisStateData = {
            yaxistitle: '',
            centerAlignText: false,
            titleGapValue: 15,
            titleGapMinValue: 1,
            titleGapMaxValue: 100,
            showYAxisLine: true,
            showYAxisLineTicks: false,
            showYAxisValues: true,
            showYAxisAllLabels: false,
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
                    ? option[axis]['axisLine'].show
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
                yAxisStateData.prependLabelValue = option[axis][
                    'axisLabel'
                ].hasOwnProperty('prependValue')
                    ? option[axis]['axisLabel']['prependValue']
                    : '';
                yAxisStateData.appendLabelValue = option[axis][
                    'axisLabel'
                ].hasOwnProperty('appendValue')
                    ? option[axis]['axisLabel']['appendValue']
                    : '';
            }
        }
        setYaxisState((prevState) => {
            return {
                ...prevState,
                ...yAxisStateData,
            };
        });
    }, []);

    function handleInputChange(e, title, directVal = undefined) {
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
        <div>
            <div>
                <label htmlFor="yaxis-title">Show X-Axis Title</label>
                <TextField
                    id="yaxis-title"
                    value={yaxisState.yaxistitle}
                    style={{ width: '100%' }}
                    onChange={(e) => handleInputChange(e, 'yaxistitle')}
                />
            </div>
            <div>
                <Checkbox
                    id="yaxis-center-align-text"
                    checked={yaxisState.centerAlignText}
                    onChange={(e) => handleInputChange(e, 'centerAlignText')}
                />
                <label htmlFor="yaxis-center-align-text">
                    Center Align Text
                </label>
            </div>
            <div>
                <label>Y Axis Title Gap</label>
                <Slider
                    aria-label="Always visible"
                    value={yaxisState.titleGapValue}
                    min={yaxisState.titleGapMinValue}
                    max={yaxisState.titleGapMaxValue}
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
                    <span>{yaxisState.titleGapMinValue}</span>
                    <span>{yaxisState.titleGapMaxValue}</span>
                </span>
            </div>

            <div>
                <Checkbox
                    id="show-yaxis-line"
                    checked={yaxisState.showYAxisLine}
                    onChange={(e) =>
                        handleInputChange(
                            e,
                            'showYAxisLine',
                            !yaxisState.showYAxisLine,
                        )
                    }
                />
                <label htmlFor="show-yaxis-line">Show YAxis Line</label>
            </div>
            <div>
                <Checkbox
                    id="show-yaxis-line-ticks"
                    checked={yaxisState.showYAxisLineTicks}
                    onChange={(e) =>
                        handleInputChange(
                            e,
                            'showYAxisLineTicks',
                            !yaxisState.showYAxisLineTicks,
                        )
                    }
                />
                <label htmlFor="show-yaxis-line">Show YAxis Line Ticks</label>
            </div>
            <div>
                <Checkbox
                    id="show-yaxis-values"
                    checked={yaxisState.showYAxisValues}
                    onChange={(e) =>
                        handleInputChange(
                            e,
                            'showYAxisValues',
                            !yaxisState.showYAxisValues,
                        )
                    }
                />
                <label htmlFor="show-yaxis-values">Show YAxis Values</label>
            </div>
            {yaxisState.showYAxisValues && (
                <div>
                    <div>
                        <label htmlFor="rotate-label">
                            Rotate Y-Axis Values:
                        </label>
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
                        <span
                            style={{
                                display: 'flex',
                                width: '100%',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span>{yaxisState.rotateLabelMinValue}</span>
                            <span>{yaxisState.rotateLabelMaxValue}</span>
                        </span>
                    </div>
                    <div>
                        <label htmlFor="prepend-label-value">
                            Prepend Label Value :
                        </label>
                        <TextField
                            id="prepend-label-value"
                            value={yaxisState.prependLabelValue}
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
                            value={yaxisState.appendLabelValue}
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
                    onClick={(e) => updateChart(yaxisState, 'yAxis')}
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
            accordianSummary={'Edit Y Axis'}
            accordianDetails={accordionDetails}
        />
    );
};
