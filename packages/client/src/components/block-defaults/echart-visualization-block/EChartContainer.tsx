import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useBlock, useBlockSettings, usePixel } from '@/hooks';
import { EChartVisualizationBlockDef } from './EChartVisualizationBlock';
import EChartsReact from 'echarts-for-react';
// import processChartEvents from "./ChartEvents";
import * as echarts from 'echarts/core';
import { ACTION } from 'mobx/dist/internal';
import { ActionMessages } from '@/stores';
import { BlocksContext } from '@/contexts';
import { styled } from '@semoss/ui';

const StyledMainContainer = styled('div')(({ theme }) => ({}));

//Main Container for holding the EchartComponent
const EChartContainer = ({ id, dataOption, listenersObj }) => {
    // const { data, attrs } = useBlock<EChartVisualizationBlockDef>(id);
    // const echartInstanceData = useRef({});
    const [selectedChart, setSelectedChart] = useState<any>({});
    const [echartState, setEchartState] = useState<any>({});
    const { data, setData, listeners, setListener } = useBlockSettings(id);
    //Custom object to define and handle different events
    const handleChartEvents = {
        // 'click': (params)=>processChartEvents(params, id,data, 'click', selectedChart, echartState),
    };
    //run perform operations when the echarts component is loaded
    useEffect(() => {
        // let echartInstance = echarts.getInstanceByDom(document.getElementById(id));
        let limit = 200,
            limitStart = 0;
        console.log(
            echarts,
            document.getElementById(id),
            'echartInstance',
            listenersObj,
            listeners,
        );
        let echartElementId = document.getElementById(id);
        let canvasElement: any = echartElementId.getElementsByTagName('CANVAS');
        console.log(canvasElement);
        if (!canvasElement.length) {
            return;
        }
        canvasElement = canvasElement[0];
        let echartInstance;
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
        if (echartInstance) {
            setSelectedChart(echartInstance);
        }
        setListener('onClick', []);
        // setListener('onClick',[]);
    }, []);
    //this function is automatically called, when the chart is ready
    function echartsLoaded(echartInstance) {
        // echartInstanceData.current = echartInstance;

        echartInstance.dispatchAction({
            type: 'takeGlobalCursor',
            key: 'dataZoomSelect',
            // Activate or inactivate.
            dataZoomSelectActive: true,
        });
        echartInstance.on('selectchanged', function () {
            console.log('select changed');
        });
        echartInstance.on('restore', function () {
            console.log('restore');
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
            // console.log(listeners);
        });
        echartInstance.on('dataZoom', 'series', function (data) {
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
        });
    }
    return (
        <StyledMainContainer id={id}>
            <EChartsReact
                option={dataOption.option}
                onChartReady={echartsLoaded}
                onEvents={handleChartEvents}
            />
        </StyledMainContainer>
    );
};

export default EChartContainer;
