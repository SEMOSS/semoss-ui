import { useBlock, useBlocks, useBlockSettings, usePixel } from '@/hooks';
import { Button, Stack, styled, Switch } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Paths, PathValue } from '@/types';
import { ActionMessages } from '@/stores';
import { BAR_CHART_DATA, LINE_CHART_DATA } from '../../Echart.constants';
import { CustomizeValueLabels } from './CustomizeValueLabels';
import { ToggleTrendline } from './ToggleTrendline';
import { EChartStyles } from './EChartStyles';
import { ChartStyling } from './ChartStyling';
import { EditXAxis } from './Edit-X-Axis';
import { EditYAxis } from './Edit-Y-Axis';
import ChartAxis from './ChartAxis';
import { BlocksContext } from '@/contexts';
import { FrameOperationsEchart } from './FrameOperationsEchart';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';
import ColourByValue from './ColourByValue';

const StyledChartContainer = styled('div')<{ width?: string }>(
    ({ theme, width }) => ({
        width: width ?? 'fit-content',
        minWidth: '50px',
        minHeight: '50px',
    }),
);

const StyledSectionContainer = styled('div')<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    width: '100%',
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
}));

export interface EChartVisualizationToolDef {
    showTool: boolean;
    id: any;
}

export interface EChartVisualizationTools {
    xAxisDataZoomShow: boolean;
    yAxisDataZoomShow: boolean;
    showTooltip: boolean;
    displayValueLabels: boolean;
    customizeLabelOptions: any;
    currentFeatureChange: string;
    toggleTrendline: string;
}
export interface EChartDisabledVisualizationTools {
    xAxisDataZoomDisabled: boolean;
    yAxisDataZoomDisabled: boolean;
    showTooltipDisabled: boolean;
    displayValueLabelDisabled: boolean;
}
//This file acts as a tool for Bar graph, for executing various functionalities in single place
const EChartVisualizationTool = observer<EChartVisualizationToolDef>(
    ({ showTool, id }) => {
        const [showToolsSection, setShowToolsSection] = useState(showTool);
        const [showLegend, setShowLegend] = useState(false);
        const [chartType, setChartType] = useState(BAR_CHART_DATA.JSONVALUE[0]);
        const [showFeatureSection, setShowFeatureSection] =
            useState<EChartVisualizationTools>({
                xAxisDataZoomShow: true,
                yAxisDataZoomShow: true,
                showTooltip: true,
                displayValueLabels: false,
                customizeLabelOptions: {},
                currentFeatureChange: '',
                toggleTrendline: '',
            });
        const [featureDisabled, setFeatureDisabled] =
            useState<EChartDisabledVisualizationTools>({
                xAxisDataZoomDisabled: false,
                yAxisDataZoomDisabled: false,
                showTooltipDisabled: false,
                displayValueLabelDisabled: false,
            });
        const { data, setData } = useBlockSettings<any>(id);
        const path = 'option';
        const [value, setValue] = useState(data.option);
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const { state } = useBlocks();
        const context = useContext(BlocksContext);
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

        const parsedOption = useMemo(
            () => JSON.parse(computedValue),
            [computedValue],
        );

        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        useEffect(() => {
            updateToolsSection();
        }, [showToolsSection]);
        //updating the state of Block with a debounce time
        function runStateUpdate(updatedOption: PathValue<any, typeof path>) {
            setTimeout(() => {
                try {
                    setData(
                        'option',
                        updatedOption as PathValue<any, typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        //returns the current state of the legend whether it is shown(true) or not (false)
        function isToggleShown() {
            let option = parsedOption;
            if (option.hasOwnProperty('legend') && option['legend']) {
                return option['legend'].hasOwnProperty('show')
                    ? option['legend']['show']
                    : false;
            }
            return false;
        }

        function showToolHandleChange(event) {
            setShowToolsSection((prevShowToolsSection) => {
                return !prevShowToolsSection;
            });
        }
        //toggle the tools option in visualization
        function updateToolsSection() {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            option = {
                ...option,
                ['toolbox']: {
                    ...option['toolbox'],
                    ['show']: showToolsSection,
                },
            };
            let optionUpdated = option;
            runStateUpdate(optionUpdated);
        }
        //update the chart's x and y axis zoom option and tooltip
        function updateChartZoom(event) {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let optionUpdated = option;
            if (event.hasOwnProperty('xAxisZoomShow')) {
                optionUpdated = zoomChartButton(event, option);
            }
            if (event.hasOwnProperty('yAxisZoomShow')) {
                optionUpdated = yAxisZoomChartButton(event, option);
            }
            if (event.hasOwnProperty('showTooltip')) {
                optionUpdated = toggleTooltip(event, option);
            }
            if (event.hasOwnProperty('showDisplayValues')) {
                optionUpdated = toggleDisplayValues(event, option);
            }
            runStateUpdate(optionUpdated);
        }

        function zoomChartButton(event, optionSrc) {
            // event.preventDefault();
            let option = optionSrc;
            if (option['dataZoom']) {
                let xAxisPosition = option['dataZoom'].findIndex((opt) =>
                    opt.hasOwnProperty('xAxisIndex'),
                );
                if (xAxisPosition > -1) {
                    option['dataZoom'][xAxisPosition].show =
                        event.xAxisZoomShow;
                } else {
                    option['dataZoom'].push({
                        type: 'slider',
                        xAxisIndex: [0],
                        show: event.hasOwnProperty('xAxisZoomShow')
                            ? event.xAxisZoomShow
                            : false,
                    });
                }
            } else {
                option = {
                    ...option,
                    ['dataZoom']: {
                        show: event.hasOwnProperty('xAxisZoomShow')
                            ? event.xAxisZoomShow
                            : false,
                        type: 'slider',
                        xAxisIndex: [0],
                    },
                };
            }
            setShowFeatureSection((prevshowFeatureSection) => {
                return {
                    ...prevshowFeatureSection,
                    currentFeatureChange: 'xAxisDataZoomShow',
                    xAxisDataZoomShow:
                        !prevshowFeatureSection.xAxisDataZoomShow,
                };
            });
            // runStateUpdate(option);
            return option;
        }
        function yAxisZoomChartButton(event, optionSrc) {
            let option = optionSrc;
            if (option['dataZoom']) {
                let yAxisPosition = option['dataZoom'].findIndex((opt) =>
                    opt.hasOwnProperty('yAxisIndex'),
                );
                if (yAxisPosition > -1) {
                    option['dataZoom'][yAxisPosition].show =
                        event.yAxisZoomShow;
                } else {
                    option['dataZoom'].push({
                        show: event.hasOwnProperty('yAxisDataZoomShow')
                            ? event.yAxisDataZoomShow
                            : false,
                        type: 'slider',
                        yAxisIndex: [0],
                    });
                }
            } else {
                option = {
                    ...option,
                    ['dataZoom']: {
                        show: event.hasOwnProperty('yAxisDataZoomShow')
                            ? event.yAxisDataZoomShow
                            : false,
                        type: 'slider',
                        yAxisIndex: [0],
                    },
                };
            }
            setShowFeatureSection((prevshowFeatureSection) => {
                return {
                    ...prevshowFeatureSection,
                    currentFeatureChange: 'yAxisDataZoomShow',
                    yAxisDataZoomShow:
                        !prevshowFeatureSection.yAxisDataZoomShow,
                };
            });
            // runStateUpdate(option);
            return option;
        }
        function toggleTooltip(event, optionSrc) {
            let option = optionSrc;
            if (option['tooltip']) {
                option['tooltip'] = {
                    ...option['tooltip'],
                    ['show']: event.showTooltip,
                };
            } else {
                option = {
                    ...option,
                    ['tooltip']: {
                        show: true,
                    },
                };
            }
            if (
                option['tooltip'].hasOwnProperty('axisPointer') &&
                option['tooltip']['axisPointer'].hasOwnProperty('label')
            ) {
                option['tooltip'] = {
                    ...option['tooltip'],
                    ['axisPointer']: {
                        ...option['tooltip']['axisPointer'],
                        ['label']: {
                            ...option['tooltip']['axisPointer']['label'],
                            ['show']: event.showTooltip,
                        },
                    },
                };
            }
            setShowFeatureSection((prevShowFeatureSection) => {
                return {
                    ...prevShowFeatureSection,
                    currentFeatureChange: 'showTooltip',
                    showTooltip: !prevShowFeatureSection.showTooltip,
                };
            });
            // setValue(JSON.stringify(option));
            // console.log('option', value, JSON.stringify(option));
            // runStateUpdate(option);
            return option;
        }
        function toggleDisplayValues(event, optionSrc) {
            let option = optionSrc;
            let seriesData = option['series'];
            let showValue = event.showDisplayValues;
            const displayPositionIndex = option['series'].findIndex((opt) =>
                BAR_CHART_DATA.JSONVALUE.includes(opt.type),
            );

            if (option['series'][displayPositionIndex]['label']) {
                option['series'][displayPositionIndex] = {
                    ...option['series'][displayPositionIndex],
                    ['label']: {
                        ...option['series'][displayPositionIndex]['label'],
                        show: showValue,
                        position: 'top',
                    },
                };
            } else {
                option['series'][displayPositionIndex] = {
                    ...option['series'][displayPositionIndex],
                    ['label']: {
                        show: showValue,
                        position: 'top',
                    },
                };
            }
            setShowFeatureSection((prevShow) => {
                return {
                    ...prevShow,
                    currentFeatureChange: 'displayValueLabels',
                    displayValueLabels: !prevShow.displayValueLabels,
                };
            });
            // runStateUpdate(option);
            return option;
        }

        function updateCustomizeValueLabels(values: any) {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let optionUpdated = option;
            let customizeLabelOptionsData = {};

            Object.keys(values).forEach((val) => {
                customizeLabelOptionsData = {
                    ...customizeLabelOptionsData,
                    [val]: values[val],
                };
            });
            const customizeLabelOptionsValue = customizeLabelOptionsData;
            const displayPositionIndex = option['series'].findIndex((opt) =>
                BAR_CHART_DATA.JSONVALUE.includes(opt.type),
            );
            if (customizeLabelOptionsValue['position']) {
                if (option['series'][displayPositionIndex]) {
                    option['series'][displayPositionIndex] = {
                        ...option['series'][displayPositionIndex],
                        ['label']: {
                            ...option['series'][displayPositionIndex]['label'],
                            ['show']: true,
                            ['position']:
                                customizeLabelOptionsValue['position'],
                        },
                    };
                }
            }
            if (customizeLabelOptionsValue['rotate']) {
                if (option['series'][displayPositionIndex]) {
                    option['series'][displayPositionIndex] = {
                        ...option['series'][displayPositionIndex],
                        ['label']: {
                            ...option['series'][displayPositionIndex]['label'],
                            ['show']: true,
                            ['rotate']: customizeLabelOptionsValue['rotate'],
                        },
                    };
                }
            }
            if (customizeLabelOptionsValue['alignment']) {
                if (option['series'][displayPositionIndex]) {
                    option['series'][displayPositionIndex] = {
                        ...option['series'][displayPositionIndex],
                        ['label']: {
                            ...option['series'][displayPositionIndex]['label'],
                            ['show']: true,
                            ['align']: customizeLabelOptionsValue['alignment'],
                        },
                    };
                }
            }
            if (customizeLabelOptionsValue['font']) {
                if (option['series'][displayPositionIndex]) {
                    option['series'][displayPositionIndex] = {
                        ...option['series'][displayPositionIndex],
                        ['label']: {
                            ...option['series'][displayPositionIndex]['label'],
                            ['show']: true,
                            ['fontFamily']: customizeLabelOptionsValue['font'],
                        },
                    };
                }
            }
            if (customizeLabelOptionsValue['fontsize']) {
                if (option['series'][displayPositionIndex]) {
                    option['series'][displayPositionIndex] = {
                        ...option['series'][displayPositionIndex],
                        ['label']: {
                            ...option['series'][displayPositionIndex]['label'],
                            ['show']: true,
                            ['fontSize']:
                                customizeLabelOptionsValue['fontsize'],
                        },
                    };
                }
            }
            if (customizeLabelOptionsValue['fontweight']) {
                if (option['series'][displayPositionIndex]) {
                    option['series'][displayPositionIndex] = {
                        ...option['series'][displayPositionIndex],
                        ['label']: {
                            ...option['series'][displayPositionIndex]['label'],
                            ['show']: true,
                            ['fontWeight']:
                                customizeLabelOptionsValue['fontweight'],
                        },
                    };
                }
            }
            if (customizeLabelOptionsValue['fontcolour']) {
                if (option['series'][displayPositionIndex]) {
                    option['series'][displayPositionIndex] = {
                        ...option['series'][displayPositionIndex],
                        ['label']: {
                            ...option['series'][displayPositionIndex]['label'],
                            ['show']: true,
                            ['color']: customizeLabelOptionsValue['fontcolour'],
                        },
                    };
                }
            }

            setShowFeatureSection((prevShowFeatureSection) => {
                return {
                    ...prevShowFeatureSection,
                    ['customizeLabelOptions']: customizeLabelOptionsData,
                    currentFeatureChange: 'customizeLabelOptions',
                };
            });
            optionUpdated = option;
            runStateUpdate(optionUpdated);
        }
        function updateTrendLines(trendLinesSelected) {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let optionUpdated = option;
            if (trendLinesSelected != '') {
                const displayPositionIndex = option['series'].findIndex((opt) =>
                    BAR_CHART_DATA.JSONVALUE.includes(opt.type),
                );
                const lineAlreadyExists = option['series'].findIndex(
                    (opt) =>
                        opt.hasOwnProperty('toggleTrendLineObject') &&
                        LINE_CHART_DATA.JSONVALUE.includes(opt.type),
                );
                let trendLinesData = {};
                if (['smooth', 'exact'].includes(trendLinesSelected)) {
                    trendLinesData = {
                        ...trendLinesData,
                        ['smooth']:
                            trendLinesSelected === 'smooth' ? true : false,
                    };
                }
                if (trendLinesSelected.startsWith('step')) {
                    trendLinesData = {
                        ...trendLinesData,
                        ['step']: trendLinesSelected.split('_')[1] ?? false,
                    };
                }
                if (lineAlreadyExists >= 0 && displayPositionIndex >= 0) {
                    option['series'][lineAlreadyExists] = {
                        ...option['series'][lineAlreadyExists],
                        ...trendLinesData,
                        ['data']:
                            option['series'][displayPositionIndex]['data'],
                    };
                }

                if (displayPositionIndex > -1 && lineAlreadyExists == -1) {
                    let toggleLineData = {
                        ...trendLinesData,
                        data:
                            option['series'][displayPositionIndex]['data'] ||
                            [],
                        type: 'line',
                        toggleTrendLineObject: true,
                    };

                    option['series'] = [
                        ...option['series'].slice(0, displayPositionIndex + 1),
                        toggleLineData,
                        ...option['series'].slice(displayPositionIndex + 1),
                    ];
                    console.log(option['series']);
                }
            } else {
                const displayPositionIndex = option['series'].findIndex(
                    (opt) =>
                        opt.hasOwnProperty('toggleTrendLineObject') &&
                        LINE_CHART_DATA.JSONVALUE.includes(opt.type),
                );
                if (displayPositionIndex > -1) {
                    option['series'][displayPositionIndex] = {
                        ...option['series'][displayPositionIndex],
                        ['data']: [],
                        ['toggleTrendLineObject']: true,
                        ['type']: 'line',
                    };
                    setTimeout(() => {
                        option['series'] = option['series'].filter(
                            (opt, index) => index != displayPositionIndex,
                        );
                        runStateUpdate(option);
                    }, 300);
                }
            }
            optionUpdated = option;
            runStateUpdate(optionUpdated);
        }
        function toggleLegend() {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let optionUpdated = option;
            if (option['legend']) {
                option = {
                    ...option,
                    ['legend']: {
                        ...option['legend'],
                        ['show']: !option['legend']['show'],
                    },
                };
                setShowLegend(!option['legend']['show']);
            } else {
                option = {
                    ...option,
                    ['legend']: {
                        type: 'plain',
                        show: true,
                    },
                };
                setShowLegend(true);
            }
            optionUpdated = option;
            runStateUpdate(optionUpdated);
        }
        function updateChartStyle(barChartData) {
            const barWidth = barChartData['barwidth'];
            const barColour = barChartData['barColour'];
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let optionUpdated = option;
            if (option['series']) {
                const barChartDataIndex = option['series'].findIndex((opt) =>
                    BAR_CHART_DATA.JSONVALUE.includes(opt.type),
                );
                if (barChartDataIndex > -1) {
                    if (barWidth !== undefined && barWidth > 0) {
                        option['series'][barChartDataIndex] = {
                            ...option['series'][barChartDataIndex],
                            ['barWidth']: barWidth,
                        };
                    }
                    if (barColour !== undefined) {
                        if (option['series'][barChartDataIndex]['itemStyle']) {
                            option['series'][barChartDataIndex] = {
                                ...option['series'][barChartDataIndex],
                                ['itemStyle']: {
                                    ...option['series'][barChartDataIndex][
                                        'itemStyle'
                                    ],
                                    ['color']: barColour,
                                },
                            };
                        } else {
                            option['series'][barChartDataIndex] = {
                                ...option['series'][barChartDataIndex],
                                ['itemStyle']: {
                                    ['color']: barColour,
                                },
                            };
                        }
                    }
                }
            }
            optionUpdated = option;
            runStateUpdate(option);
        }
        function updateChartStyling(e, chartStylingData) {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let optionUpdated = option;
            if (option.hasOwnProperty('title')) {
                option['title'] = {
                    ...option['title'],
                    ['text']: chartStylingData.title,
                    ['show']: true,
                    ['left']: chartStylingData.alignment,
                };
                if (option['title'].hasOwnProperty('textStyle')) {
                    option['title']['textStyle'] = {
                        ...option['title']['textStyle'],
                        ['color']: chartStylingData.fontColour,
                        ['fontWeight']: chartStylingData.fontWeight,
                        ['fontFamily']: chartStylingData.fontFamily,
                        ['fontSize']: chartStylingData.textSize,
                    };
                }
            } else {
                option = {
                    ...option,
                    ['title']: {
                        ['text']: chartStylingData.title,
                        ['show']: true,
                        ['left']: chartStylingData.alignment,
                        ['textStyle']: {
                            ['color']: chartStylingData.fontColour,
                            ['fontWeight']: chartStylingData.fontWeight,
                            ['fontFamily']: chartStylingData.fontFamily,
                            ['fontSize']: chartStylingData.textSize,
                        },
                    },
                };
            }
            optionUpdated = option;
            runStateUpdate(optionUpdated);
        }
        function updateAxis(xAxisData, axis = 'xAxis') {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let optionUpdated = option;
            if (option.hasOwnProperty(axis) && option[axis]) {
                if (xAxisData.hasOwnProperty('xaxistitle')) {
                    option[axis] = {
                        ...option[axis],
                        ['name']: xAxisData.xaxistitle,
                    };
                }
                if (xAxisData.hasOwnProperty('yaxistitle')) {
                    option[axis] = {
                        ...option[axis],
                        ['name']: xAxisData.yaxistitle,
                    };
                }
                if (xAxisData.hasOwnProperty('centerAlignText')) {
                    option[axis] = {
                        ...option[axis],
                        ['nameLocation']: xAxisData['centerAlignText']
                            ? 'middle'
                            : 'end',
                    };
                }
                if (xAxisData.hasOwnProperty('titleGapValue')) {
                    option[axis] = {
                        ...option[axis],
                        ['nameGap']: xAxisData['titleGapValue'],
                    };
                }
                if (xAxisData.hasOwnProperty('showXAxisLine')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisLine']: {
                            ...option[axis]['axisLine'],
                            ['show']: xAxisData.showXAxisLine,
                        },
                    };
                }
                if (xAxisData.hasOwnProperty('showXAxisLineTicks')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisTick']: {
                            ...option[axis]['axisTick'],
                            ['show']: xAxisData.showXAxisLineTicks,
                            ['alignWithLabel']: xAxisData.showXAxisLineTicks,
                        },
                    };
                }
                console.log(xAxisData.hasOwnProperty('showXAxisValues'));
                if (xAxisData.hasOwnProperty('showXAxisValues')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisLabel']: {
                            ...option[axis]['axisLabel'],
                            ['show']: xAxisData.showXAxisValues,
                        },
                    };
                }
                if (xAxisData.hasOwnProperty('showYAxisLine')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisLine']: {
                            ...option[axis]['axisLine'],
                            ['show']: xAxisData.showYAxisLine,
                        },
                    };
                }
                if (xAxisData.hasOwnProperty('showYAxisLineTicks')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisTick']: {
                            ...option[axis]['axisTick'],
                            ['show']: xAxisData.showYAxisLineTicks,
                            ['alignWithLabel']: xAxisData.showYAxisLineTicks,
                        },
                    };
                }
                console.log(xAxisData.hasOwnProperty('showYAxisValues'));
                if (xAxisData.hasOwnProperty('showYAxisValues')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisLabel']: {
                            ...option[axis]['axisLabel'],
                            ['show']: xAxisData.showYAxisValues,
                        },
                    };
                }
                if (xAxisData.hasOwnProperty('showAllLabels')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisLabel']: {
                            ...option[axis]['axisLabel'],
                            ['show']: true,
                            ['interval']: xAxisData.showAllLabels ? 0 : 'auto',
                        },
                    };
                }
                if (xAxisData.hasOwnProperty('labelFontSize')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisLabel']: {
                            ...option[axis]['axisLabel'],
                            ['show']: true,
                            ['fontSize']: xAxisData.labelFontSize,
                        },
                    };
                }
                if (xAxisData.hasOwnProperty('rotate')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisLabel']: {
                            ...option[axis]['axisLabel'],
                            ['show']: true,
                            ['rotate']: xAxisData.rotate,
                        },
                    };
                }
                if (xAxisData.hasOwnProperty('prependLabelValue')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisLabel']: {
                            ...option[axis]['axisLabel'],
                            ['prependValue']: xAxisData.prependLabelValue,
                            ['formatter']:
                                xAxisData.prependLabelValue +
                                '{value}' +
                                (xAxisData.hasOwnProperty('appendLabelValue')
                                    ? xAxisData.appendLabelValue
                                    : ''),
                        },
                    };
                }
                if (xAxisData.hasOwnProperty('appendLabelValue')) {
                    option[axis] = {
                        ...option[axis],
                        ['axisLabel']: {
                            ...option[axis]['axisLabel'],
                            ['appendValue']: xAxisData.appendLabelValue,
                            ['formatter']:
                                (xAxisData.hasOwnProperty('prependLabelValue')
                                    ? xAxisData.prependLabelValue
                                    : '') +
                                '{value}' +
                                (xAxisData.hasOwnProperty('appendLabelValue')
                                    ? xAxisData.appendLabelValue
                                    : ''),
                        },
                    };
                }
                optionUpdated = option;
                runStateUpdate(optionUpdated);
            }
        }
        function updateColourByValue(option) {
            let existingOption =
                typeof value === 'string' ? JSON.parse(value) : value;
            existingOption = {
                ...existingOption,
                ['series']: [...option['series']],
            };
            existingOption = {
                ...existingOption,
                ['customSettings']: {
                    ...option['customSettings'],
                    ['optionStateChange']: true,
                },
            };
            let optionUpdated = existingOption;
            console.log(optionUpdated, 'option');
            runStateUpdate(optionUpdated);
        }
        function updateFrameOperations(option) {
            let existingOption =
                typeof value === 'string' ? JSON.parse(value) : value;
            runStateUpdate(existingOption);
        }
        return (
            <Stack height={'100%'}>
                <StyledChartContainer>
                    <StyledSectionContainer display="inline-block">
                        <label htmlFor="showToolList">Show Tools Menu</label>
                        <Switch
                            checked={showToolsSection ?? undefined}
                            onChange={showToolHandleChange}
                            title="Show Tool"
                        />
                    </StyledSectionContainer>
                </StyledChartContainer>
                {showToolsSection && (
                    <StyledChartContainer width="100%">
                        <StyledSectionContainer
                            display="flex"
                            justifyContent="space-around"
                        >
                            <StyledSectionContainer display="inline-block">
                                <label htmlFor="showToolList">
                                    Show Legend
                                </label>
                                <Switch
                                    checked={isToggleShown() ?? undefined}
                                    onChange={toggleLegend}
                                    title="Show Legend"
                                />
                            </StyledSectionContainer>
                        </StyledSectionContainer>
                        {/* <StyledSectionContainer
                            display="flex"
                            justifyContent="space-around"
                        >
                            <div style={{ display: 'inline-block' }}>
                                <Button onClick={updateChartDataOnClick}>
                                    Update Chart Data
                                </Button>
                            </div>
                        </StyledSectionContainer> */}
                        <StyledSectionContainer>
                            <FrameOperationsEchart
                                id={id}
                                updateFrame={updateFrameOperations}
                            />
                        </StyledSectionContainer>
                        <StyledSectionContainer>
                            <ChartAxis
                                option={parsedOption}
                                updateChart={updateChartZoom}
                            />
                        </StyledSectionContainer>
                        <StyledSectionContainer>
                            <CustomizeValueLabels
                                updateChart={updateCustomizeValueLabels}
                                option={parsedOption}
                                chartType={chartType}
                            />
                        </StyledSectionContainer>
                        <StyledSectionContainer>
                            <ToggleTrendline
                                options={parsedOption}
                                updateChart={updateTrendLines}
                                chartType={chartType}
                            />
                        </StyledSectionContainer>
                        <StyledSectionContainer>
                            <EChartStyles
                                updateChart={updateChartStyle}
                                chartType={chartType}
                                option={parsedOption}
                            />
                        </StyledSectionContainer>
                        <StyledSectionContainer>
                            <ChartStyling
                                updateChart={updateChartStyling}
                                chartType={chartType}
                                option={parsedOption}
                            />
                        </StyledSectionContainer>
                        <StyledSectionContainer>
                            <EditXAxis
                                updateChart={updateAxis}
                                chartType={chartType}
                                option={parsedOption}
                            />
                        </StyledSectionContainer>
                        <StyledSectionContainer>
                            <EditYAxis
                                updateChart={updateAxis}
                                chartType={chartType}
                                option={parsedOption}
                            />
                        </StyledSectionContainer>
                        <StyledSectionContainer>
                            <ColourByValue
                                id={id}
                                updateChart={updateColourByValue}
                            />
                        </StyledSectionContainer>
                    </StyledChartContainer>
                )}
            </Stack>
        );
    },
);

export default EChartVisualizationTool;
