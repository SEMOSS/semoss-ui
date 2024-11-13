import { useBlock, useBlocks, useBlockSettings } from '@/hooks';
import { Button, Stack, styled, Switch } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Paths, PathValue } from '@/types';
import { ActionMessages } from '@/stores';
import { BAR_CHART_DATA, LINE_CHART_DATA } from './Echart.constants';
import { CustomizeValueLabels } from './CustomizeValueLabels';
import { ToggleTrendline } from './ToggleTrendline';
import { EChartStyles } from './EChartStyles';
import { ChartStyling } from './ChartStyling';
import { EditXAxis } from './Edit-X-Axis';
import { EditYAxis } from './Edit-Y-Axis';
import ChartAxis from './ChartAxis';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
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
        const { state } = useBlocks();

        // useEffect(()=>{
        //     let option = data.option;
        //     let featureSectionState : EChartVisualizationTools= showFeatureSection;
        //     if(option['dataZoom']){
        //         let xAxisPosition = option['dataZoom'].findIndex((opt) =>
        //             opt.hasOwnProperty('xAxisIndex'),
        //         );
        //         let yAxisPosition = option['dataZoom'].findIndex((opt)=>{
        //             return opt.hasOwnProperty('yAxisIndex');
        //         });
        //         let xyAxisDataZoom = {

        //         };
        //         if(xAxisPosition > -1){
        //             xyAxisDataZoom = {
        //                 ...xyAxisDataZoom,
        //                 xAxisDataZoomShow: option['dataZoom'][xAxisPosition].show ?? false
        //             };
        //         }
        //         if(yAxisPosition > -1){
        //             xyAxisDataZoom = {
        //                 ...xyAxisDataZoom,
        //                 yAxisDataZoomShow: option['dataZoom'][yAxisPosition].show ?? false
        //             }
        //         }
        //         // featureSectionState.xAxisDataZoomShow = option['dataZoom'][xAxisPosition].show;
        //         // featureSectionState.yAxisDataZoomShow = option['dataZoom'][yAxisPosition].show;
        //         setShowFeatureSection((prevShowFeatureSection)=>{
        //             return {
        //                 ...prevShowFeatureSection,
        //                 ...xyAxisDataZoom,
        //             }
        //         });
        //     }
        //     else{
        //         // featureDisabled.xAxisDataZoomDisabled = true;
        //         // featureDisabled.yAxisDataZoomDisabled = true;
        //         setFeatureDisabled((prevFeatureDisabled)=>{
        //             return {
        //                 ...prevFeatureDisabled,
        //                 xAxisDataZoomDisabled: true,
        //                 yAxisDataZoomDisabled: true,
        //             }
        //         });
        //     }
        //     if(option['tooltip']){
        //         // featureSectionState.showTooltip = option['tooltip'].show;
        //         setShowFeatureSection((prevShowFeatureSection)=>{
        //             return {
        //                 ...prevShowFeatureSection,
        //                 showTooltip: option['tooltip'].show
        //             }
        //         });
        //     }
        //     else{
        //         setFeatureDisabled((prevFeatureDisabled)=>{
        //             return {
        //                 ...prevFeatureDisabled,
        //                 showTooltipDisabled: true,
        //             };
        //         })
        //     }
        //     if(option['series']){
        //         let labelShowIndex = option['series'].findIndex((opt)=>opt.hasOwnProperty('label'));
        //         if(labelShowIndex>=0){
        //             setShowFeatureSection((prevShowFeatureSection)=>{
        //                 return {
        //                     ...prevShowFeatureSection,
        //                     ['displayValueLabels']: option['series'][labelShowIndex]['label']['show']
        //                 }
        //             });
        //         }
        //     }
        //     if(option['legend']){
        //         setShowLegend(()=>{
        //             return option['legend']['show'] ?? false;
        //         });
        //     }
        // },[, data.option]);
        useEffect(() => {
            updateToolsSection();
        }, [showToolsSection]);
        function runStateUpdate(updatedOption: any) {
            try {
                setData('option', updatedOption as PathValue<any, any>);
            } catch (e) {
                console.log(e);
            }
        }
        // function isXAxisShow(){
        //     let option = data.option;
        //     let xAxisPosition = option['dataZoom'].findIndex((opt) =>
        //         opt.hasOwnProperty('xAxisIndex'),
        //     );
        //     if(xAxisPosition > -1){
        //         return option['dataZoom'][xAxisPosition].show;
        //     }
        //     return false;
        // }
        // function isYAxisShow(){
        //     let option = data.option;
        //     let yAxisPosition = option['dataZoom'].findIndex((opt) =>
        //         opt.hasOwnProperty('yAxisIndex'),
        //     );
        //     if(yAxisPosition > -1){
        //         return option['dataZoom'][yAxisPosition].show;
        //     }
        //     return false;
        // }
        // function isTooltipShown(){
        //     let option = data.option;
        //     if(option['tooltip']){
        //         if(option['tooltip']['show']) return option['tooltip']['show'];
        //         else return false;
        //     }
        //     return false;
        // }
        // function isDisplayValuesShown(){
        //     let option  = data.option;
        //     const displayPositionIndex = option['series'].findIndex((opt)=> BAR_CHART_DATA.JSONVALUE.includes(opt.type) );
        //     if(option['series'][displayPositionIndex] && option['series'][displayPositionIndex].hasOwnProperty('label') && option['series'][displayPositionIndex]['label'].hasOwnProperty('show')){
        //             return (option['series'][displayPositionIndex]['label']['show']);
        //     }
        //     return false;
        // }

        function showToolHandleChange(event) {
            setShowToolsSection((prevShowToolsSection) => {
                return !prevShowToolsSection;
            });
        }
        function updateToolsSection() {
            let option = data.option;
            option = {
                ...option,
                ['toolbox']: {
                    ...option['toolbox'],
                    ['show']: showToolsSection,
                },
            };
            runStateUpdate(option);
        }
        function updateChartZoom(event) {
            if (event.hasOwnProperty('xAxisZoomShow')) {
                zoomChartButton(event);
            }
            if (event.hasOwnProperty('yAxisZoomShow')) {
                yAxisZoomChartButton(event);
            }
            if (event.hasOwnProperty('showTooltip')) {
                toggleTooltip(event);
            }
            if (event.hasOwnProperty('showDisplayValues')) {
                toggleDisplayValues(event);
            }
        }
        function zoomChartButton(event) {
            // event.preventDefault();
            let option = data.option;
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
                        show: true,
                    });
                }
            } else {
                option = {
                    ...option,
                    ['dataZoom']: {
                        show: true,
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
            runStateUpdate(option);
        }
        function yAxisZoomChartButton(event) {
            let option = data.option;
            if (option['dataZoom']) {
                let yAxisPosition = option['dataZoom'].findIndex((opt) =>
                    opt.hasOwnProperty('yAxisIndex'),
                );
                if (yAxisPosition > -1) {
                    option['dataZoom'][yAxisPosition].show =
                        event.yAxisZoomShow;
                } else {
                    option['dataZoom'].push({
                        show: true,
                        type: 'slider',
                        yAxisIndex: [0],
                    });
                }
            } else {
                option = {
                    ...option,
                    ['dataZoom']: {
                        show: true,
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
            runStateUpdate(option);
        }
        function toggleTooltip(event) {
            let option = data.option;
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
            setShowFeatureSection((prevShowFeatureSection) => {
                return {
                    ...prevShowFeatureSection,
                    currentFeatureChange: 'showTooltip',
                    showTooltip: !prevShowFeatureSection.showTooltip,
                };
            });
            runStateUpdate(option);
        }
        function toggleDisplayValues(event) {
            let option = data.option;
            let seriesData = option['series'];
            let showValue = event.showDisplayValues;
            const displayPositionIndex = option['series'].findIndex((opt) =>
                BAR_CHART_DATA.JSONVALUE.includes(opt.type),
            );
            // if(option['series'][displayPositionIndex] && option['series'][displayPositionIndex].hasOwnProperty('label') && option['series'][displayPositionIndex]['label'].hasOwnProperty('show')){
            //  showValue = (option['series'][displayPositionIndex]['label']['show'] ? true : false);
            // }

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
            runStateUpdate(option);
        }

        function updateCustomizeValueLabels(values: any) {
            let option = data.option;
            let customizeLabelOptionsData = {};

            Object.keys(values).forEach((val) => {
                customizeLabelOptionsData = {
                    ...customizeLabelOptionsData,
                    [val]: values[val],
                };
            });
            console.log('customizeLabelOptions', showFeatureSection);
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
            runStateUpdate(option);
        }
        function updateTrendLines(trendLinesSelected) {
            let option = data.option;
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
                    // option['series'] = option['series'].filter((opt,index)=> index!=displayPositionIndex);
                    //[...option['series'].slice(0,(displayPositionIndex)), ...option['series'].slice((displayPositionIndex+1))];
                }
            }
            runStateUpdate(option);
        }
        function toggleLegend() {
            let option = data.option;
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
            runStateUpdate(option);
        }
        function updateChartStyle(barChartData) {
            const barWidth = barChartData['barwidth'];
            const barColour = barChartData['barColour'];
            let option = data.option;
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
            runStateUpdate(option);
        }
        function updateChartStyling(e, chartStylingData) {
            let option = data.option;
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
            runStateUpdate(option);
        }
        function updateAxis(xAxisData, axis = 'xAxis') {
            let option = data.option;
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
                runStateUpdate(option);
            }
        }
        return (
            <Stack height={'100%'}>
                <StyledChartContainer>
                    <div style={{ display: 'inline-block' }}>
                        <label htmlFor="showToolList">Show Tools Menu</label>
                        <Switch
                            checked={showToolsSection ?? undefined}
                            onChange={showToolHandleChange}
                            title="Show Tool"
                        />
                    </div>
                </StyledChartContainer>
                {showToolsSection && (
                    <StyledChartContainer style={{ width: '100%' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'inline-block' }}>
                                <label htmlFor="showToolList">
                                    Show Legend
                                </label>
                                <Switch
                                    checked={showLegend ?? undefined}
                                    onChange={toggleLegend}
                                    title="Show Legend"
                                />
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            {/* <button type="button" onClick={zoomChartButton} disabled={featureDisabled.xAxisDataZoomDisabled}>
                                { showFeatureSection.xAxisDataZoomShow ? 'Hide' : 'Show' }  X-Axis Zoom
                            </button> */}
                            {/* <Button type="button" onClick={yAxisZoomChartButton} disabled={featureDisabled.yAxisDataZoomDisabled}>
                            { isYAxisShow() ? 'Hide' : 'Show' } Y-Axis Zoom
                            </Button> */}
                            {/* <Button type='button' color='primary' onClick={zoomChartButton} disabled={featureDisabled.xAxisDataZoomDisabled}>
                                { isXAxisShow() ? 'Hide' : 'Show' }  X-Axis Zoom
                            </Button> */}
                            <ChartAxis
                                option={data.option}
                                updateChart={updateChartZoom}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            {/* <Button type='button' onClick={toggleTooltip} disabled={featureDisabled.showTooltipDisabled}>
                                { isTooltipShown() ?'Hide':'Show'} Tooltip 
                            </Button>
                            <Button type="button" onClick={toggleDisplayValues} disabled={featureDisabled.displayValueLabelDisabled}>
                            { isDisplayValuesShown() ? 'Hide' : 'Show' } Display Values
                            </Button> */}
                        </div>
                        <div
                            style={{
                                width: '100%',
                            }}
                        >
                            <CustomizeValueLabels
                                updateChart={updateCustomizeValueLabels}
                                option={data.option}
                                chartType={chartType}
                            />
                        </div>
                        <div
                            style={{
                                width: '100%',
                            }}
                        >
                            <ToggleTrendline
                                options={data.option}
                                updateChart={updateTrendLines}
                                chartType={chartType}
                            />
                        </div>
                        <div
                            style={{
                                width: '100%',
                            }}
                        >
                            <EChartStyles
                                updateChart={updateChartStyle}
                                chartType={chartType}
                                option={data.option}
                            />
                        </div>
                        <div
                            style={{
                                width: '100%',
                            }}
                        >
                            <ChartStyling
                                updateChart={updateChartStyling}
                                chartType={chartType}
                                option={data.option}
                            />
                        </div>
                        <div
                            style={{
                                width: '100%',
                            }}
                        >
                            <ChartStyling
                                updateChart={updateChartStyling}
                                chartType={chartType}
                                option={data.option}
                            />
                        </div>
                        <div
                            style={{
                                width: '100%',
                            }}
                        >
                            <EditXAxis
                                updateChart={updateAxis}
                                chartType={chartType}
                                option={data.option}
                            />
                        </div>
                        <div
                            style={{
                                width: '100%',
                            }}
                        >
                            <EditYAxis
                                updateChart={updateAxis}
                                chartType={chartType}
                                option={data.option}
                            />
                        </div>
                    </StyledChartContainer>
                )}
                {/* {!showToolsSection && <p>Tools for EChart</p>}
                <StyledChartContainer>
                    <p>Current Status:</p>
                    <p>
                        XAxis Zoom Button Enabled:{' '}
                        {showFeatureSection.xAxisDataZoomShow
                            ? 'enabled'
                            : 'disabled'}
                        <br />
                        YAxis Zoom Button Enabled:{' '}
                        {showFeatureSection.yAxisDataZoomShow
                            ? 'enabled'
                            : 'disabled'}
                        <br />
                        Showtooltip Enabled:{' '}
                        {showFeatureSection.showTooltip
                            ? 'enabled'
                            : 'disabled'}
                    </p>
                </StyledChartContainer> */}
            </Stack>
        );
    },
);

export default EChartVisualizationTool;
