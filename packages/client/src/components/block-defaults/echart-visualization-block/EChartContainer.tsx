import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useBlock, useBlockSettings, useFrame, usePixel } from '@/hooks';
import { EChartVisualizationBlockDef } from './EChartVisualizationBlock';
import EChartsReact from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { ACTION } from 'mobx/dist/internal';
import { ActionMessages } from '@/stores';
import { BlocksContext } from '@/contexts';
import { styled } from '@semoss/ui';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import { BAR_CHART_DATA } from './Echart.constants';
import { Paths, PathValue } from '@/types';
import { EChartContextMenu } from './EChartContextMenu';

const StyledMainContainer = styled('div')(({ theme }) => ({}));
const StyledSubContainer = styled('div')(({ theme }) => ({}));

//Main Container for holding the EchartComponent
const EChartContainer = ({
    id,
    dataOption,
    listenersObj,
    currentFrame,
    updateChartData,
}) => {
    // const { data, attrs } = useBlock<EChartVisualizationBlockDef>(id);
    // const echartInstanceData = useRef({});
    // echarts.use([BarChart, CanvasRenderer, TooltipComponent]);

    const [selectedChart, setSelectedChart] = useState<any>({});
    const [echartState, setEchartState] = useState<any>({});
    const { data } = useBlockSettings<EChartVisualizationBlockDef>(id);
    let latestOption = useRef();
    let chartOperationData = useRef({ brushSelected: [], contextMenu: null });
    let selector = '';
    if (data.hasOwnProperty('columns')) {
        selector = `Select(${data.columns
            .map((c) => {
                return c.selector;
            })
            .join(', ')}).as([${data.columns
            .map((c) => {
                return c.name;
            })
            .join(', ')}])`;
    }
    const frameData = useFrame(dataOption.frame?.name, {
        selector: selector,
        // offset:0,
        // limit: 10,
        // enableCount: true
    });
    if (
        !frameData.isLoading &&
        frameData.data['values'].length > 0 &&
        currentFrame !== dataOption.frame?.name
    ) {
        let tempFrameData = frameData;
        console.log(tempFrameData['data']);
        let dataArray = {
            headerData: tempFrameData['data']['headers'],
            values: {},
        };
        tempFrameData['data']['headers']?.forEach((item, index) => {
            dataArray['values'][item] = [];
        });
        console.log(dataArray, 'dataArray');
        tempFrameData['data']['values'].forEach((item, index) => {
            item.forEach((subItem, subIndex) => {
                dataArray['values'] = {
                    ...dataArray['values'],
                    [tempFrameData['data']['headers'][subIndex]]: [
                        item[subIndex],
                        ...dataArray['values'][
                            tempFrameData['data']['headers'][subIndex]
                        ],
                    ],
                };
            });
        });
        let option = dataOption.option;
        let xAxisIndex = tempFrameData['data']['headers'][0] ?? 'data 1',
            yAxisIndex = tempFrameData['data']['headers'][1] ?? 'data 2';

        if (option.hasOwnProperty('xAxis') && option['xAxis']) {
            option['xAxis'] = {
                ...option['xAxis'],
                ['data']: dataArray['values'][xAxisIndex],
                ['name']: xAxisIndex,
            };
        }
        if (option.hasOwnProperty('yAxis') && option['yAxis']) {
            option['yAxis'] = {
                ...option['yAxis'],
                ['name']: yAxisIndex,
            };
        }
        if (option.hasOwnProperty('series') && option['series']) {
            let seriesDataIndex = option['series'].findIndex(
                (item) => item.type === BAR_CHART_DATA.JSONVALUE[0],
            );
            option['series'][seriesDataIndex] = {
                ...option['series'][seriesDataIndex],
                ['data']: dataArray['values'][yAxisIndex],
            };
        }
        // option = {
        //     ...option,
        //     ['uiUpdateManual']: true,
        // };
        console.log(option, 'updated option');
        latestOption.current = option;
        updateChartData(dataOption.frame?.name, latestOption.current);
    }
    console.log(dataOption, data, frameData, 'dataoption, data, framedata');
    //Custom object to define and handle different events
    const handleChartEvents = {
        // 'click': (params)=>processChartEvents(params, id,data, 'click', selectedChart, echartState),
        // 'dblclick': (params)=>processChartEvents(params, id, data, 'dblclick', selectedChart, echartState),
    };

    //run perform operations when the echarts component is loaded
    useEffect(() => {
        let limit = 200,
            limitStart = 0;
        let echartElementId = document.getElementById(id);
        let canvasElement: any = echartElementId.getElementsByTagName('CANVAS');
        console.log(canvasElement, 'canvas Element');
        if (!canvasElement.length) {
            return;
        }
        canvasElement = canvasElement[0];
        let echartInstance = undefined;
        while (!echartInstance && limitStart < limit) {
            if (echarts.getInstanceByDom(canvasElement)) {
                echartInstance = echarts.getInstanceByDom(canvasElement);
            } else if (canvasElement.id === id) {
                break;
            } else {
                canvasElement = canvasElement.parentElement;
            }
            limitStart++;
        }
        console.log(echartInstance, 'instance got');
        if (echartInstance) {
            if (Object.keys(selectedChart).length == 0) {
                setSelectedChart(echartInstance);
            }
            echartInstance.getZr().on('contextmenu', function (params) {
                console.log('contextmenu from instance', params);
                chartOperationData.current.contextMenu = {
                    mouseX: params.event.clientX,
                    mouseY: params.event.clientY,
                };
            });
            echartInstance.on('dblclick', function (e) {
                console.log('dblclick', e);
                const paramsToFilter = e['data'];
                if (
                    paramsToFilter.hasOwnProperty('value') &&
                    paramsToFilter['value'] !== undefined
                ) {
                }
            });
            echartInstance.on('selectchanged', function (params) {
                console.log('selectchanged', params);
            });
            echartInstance.on('dataramgeselected', function (params) {
                console.log('datarange selected', params);
            });
            echartInstance.on('brush', function (params) {
                console.log('brush', params);
            });
            echartInstance.on('brushEnd', function (params) {
                console.log('brushEnd', params);
            });
            echartInstance.on('brushselected', function (params) {
                console.log('brushselected', params);
                let dataIndex = [];
                let seriesIndex = -1;
                let selectedData = [];
                if (
                    params.hasOwnProperty('batch') &&
                    params?.batch?.length > 0
                ) {
                    params.batch.forEach((item) => {
                        selectedData = item.selected;
                        if (Array.isArray(selectedData)) {
                            selectedData.forEach((selectedItem) => {
                                dataIndex = selectedItem.dataIndex;
                                seriesIndex = selectedItem.seriesIndex;
                            });
                        }
                    });
                }
                let option = dataOption.option;
                if (
                    seriesIndex > -1 &&
                    dataIndex.length > 0 &&
                    selectedData.length > 0
                ) {
                    const seriesData = option['series'][seriesIndex] || {};
                    let dataToFind = seriesData['data'];
                    let filteredData = dataToFind.filter((item, index) =>
                        dataIndex.includes(index),
                    );
                    console.log(filteredData, 'selectionFiltered');
                    chartOperationData.current.brushSelected = filteredData;
                }
            });
            echartInstance.on('click', function (param) {
                console.log(param);
            });
        }
    }, [echartState]);

    //this function is automatically called, when the chart is ready
    function echartsLoaded(echartInstance) {
        if (!echartState.hasOwnProperty('chartLoaded')) {
            setEchartState((prevState) => {
                return {
                    ...prevState,
                    ['chartLoaded']: true,
                };
            });
        }
        // if(dataOption.frame.name){

        // }
        // echartInstanceData.current = echartInstance;

        // echartInstance.dispatchAction({
        //     type: 'takeGlobalCursor',
        //     key: 'dataZoomSelect',
        //     // Activate or inactivate.
        //     dataZoomSelectActive: true,
        // });
        echartInstance.on('selectchanged', function () {
            console.log('select changed');
        });
        echartInstance.on('restore', function () {
            console.log('restore');
        });
        echartInstance.getZr().on('contextmenu', function (params) {
            console.log('onContextMenu', params);
        });
        // echartInstance.on('click', 'series', function (data) {
        //     echartInstance.dispatchAction({
        //         type: 'dataZoom',
        //         dataZoomIndex: 1,
        //         startValue: 0,
        //         endValue: 100,
        //     });
        //     echartInstance.dispatchAction({
        //         type: 'dataZoom',
        //         dataZoomIndex: 0,
        //         startValue: 0,
        //         endValue: 100,
        //     });
        //     return listenersObj.onClick;
        // });
        echartInstance.on('click', 'series', function (data) {
            console.log(data, 'click');
        });
        echartInstance.on('dblclick', 'series', function (data) {
            console.log(data, 'dblclick');
        });
        // echartInstance.on('dataZoom', 'series', function (data) {
        // console.log('datazoom');
        // console.log(data, echartInstance);
        // setEchartState((prevChartState)=>{
        //     return {
        //         ...prevChartState,
        //         ['dataZoom']: true,
        //     }
        // })
        // echartInstanceData.current = {
        //     ...echartInstanceData.current,
        //     ['dataZoom']: true,
        // };
        // });
    }
    return (
        <StyledMainContainer id={id}>
            <EChartsReact
                option={dataOption.option}
                onChartReady={echartsLoaded}
                // onEvents={handleChartEvents}
            />
            <EChartContextMenu
                id={id}
                frame={frameData}
                contextMenu={chartOperationData.current.contextMenu}
                onClose={() => {}}
            />
        </StyledMainContainer>
    );
};

export default EChartContainer;
