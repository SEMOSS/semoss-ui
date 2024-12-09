import { useBlockSettings } from '@/hooks';
import { useState } from 'react';

export const dataZoomRestore = (
    params,
    id,
    data,
    chartInstance,
    echartState,
) => {
    chartInstance.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 1,
        startValue: 0,
        endValue: 100,
    });
    chartInstance.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 0,
        startValue: 0,
        end: 100,
    });
};

const processChartEvents = (
    params,
    id,
    data,
    type,
    chartInstance,
    echartState,
) => {
    if (type === 'click') {
        // if(reference.hasOwnProperty('dataZoom') && reference['dataZoom'] === true){
        // dataZoomRestore(params,id,data,chartInstance, echartState);
        console.log('click');
        // }
    }
    if (type === 'dblclick') {
        console.log('dbl click');
    }
};

export default processChartEvents;
