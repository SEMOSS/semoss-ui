import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { styled } from "@mui/material";
import * as echarts from "echarts/core";
import EChartsReact from "echarts-for-react";

import { getValueByPath } from "../../../../../utility";
import { useBlockSettings, useFrame } from "../../../../../hooks";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { EChartsOption } from "echarts";

//Main Container for displaying Bar chart
const StyledMainContainer = styled("div")(({ theme }) => ({
    height: "100%",
    width: "100%",
}));
//container for displaying invalid or no data
const StyledNoDataContainer = styled("div", {
    shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: "inherit",
    width: "inherit",
    maxHeight: "30vh",
    maxWidth: "80vh",
    display: "flex",
    flexWrap: "wrap",
    alignContent: "flex-start",
    color: error ? theme.palette.error.main : "unset",
}));

//bar component properties
interface DendrogramProps {
    id: string;
    updateJson: (data: any, path: any) => void;
}

export const Dendrogram = observer(({ id, updateJson }: DendrogramProps) => {
    const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, "option");
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, "option"]).get();


    const selector = useMemo(() => {
        return `Select(${data.columns
                ?.map((c, index) => {
                    //Converting Y axis columns to Average by default
                    return c.selector;
                })
                .join(", ")}).as([${data.columns
                ?.map((c, index) => {
                    return c.name;
                })
                .join(", ")}])`;
    }, [data.columns]);

    const frame = useFrame(data.frame.name, {
        selector: selector,
    });
    function getDataValuesUpdate(currentIndex, framesLength = 0, data){
        let i=0;
        while(i < data.length){
            if(data[i].childrenIndex == currentIndex){
                for(let j=0;j<frame.data.values.length;j++){
                    if(frame.data.headers[currentIndex] !== undefined && frame.data.values[j][currentIndex] !== undefined){
                        if(currentIndex == 0){
                            data[i].children[j] = {
                                ...data[i].children[j],
                                name: frame.data.headers[currentIndex],
                                value: frame.data.values[j][currentIndex],
                                category: frame.data.headers[currentIndex],
                                children: [],
                                childrenIndex: currentIndex + 1
                            };   
                        }else{
                            if(i==j){
                                data[i].children.push({
                                    ...data[i].children[j],
                                    name: frame.data.headers[currentIndex],
                                    value: frame.data.values[j][currentIndex],
                                    category: frame.data.headers[currentIndex],
                                    children: [],
                                    childrenIndex: currentIndex + 1
                                });  
                            }
                        }
                    }
                }
                i++;
            }
            else{
                data[i].children = getDataValuesUpdate(currentIndex, framesLength, data[i].children);
                return data;
            }
        }
        if(currentIndex < framesLength){
            currentIndex++;
            console.log(currentIndex, data, framesLength, 'getDataValuesUpdate');
            return getDataValuesUpdate(currentIndex, framesLength, data);
        }
        return data;
    }
    function getDataValues(currentIndex=0, framesLength = 0, data){
        if(currentIndex == 0){
            data = {
                name: 'Root',
                children: [],
                childrenIndex: 0
            };
        }
        let dataToUpdate = data;
        while(currentIndex < framesLength){
            if(currentIndex == 0){
                for(let i=0; i<frame.data.values.length; i++){
                        dataToUpdate.children[i] = {
                            ...data.children[i],
                            name: frame.data.headers[currentIndex],
                            value: frame.data.values[i][currentIndex],
                            children: [],
                            childrenIndex: currentIndex + 1,
                            category: frame.data.headers[currentIndex],
                        };
                }
            }
            else{
                let childrenToUpdate = [];
                while(dataToUpdate?.childrenIndex != currentIndex || dataToUpdate?.children?.length > 0){
                    if(Array.isArray(dataToUpdate)){
                        console.log('currentIndex', currentIndex, dataToUpdate);
                        if(dataToUpdate.some((item)=>item.childrenIndex == currentIndex)){
                            break;
                        }
                    }
                    if(dataToUpdate?.children === undefined) break;
                    dataToUpdate = dataToUpdate?.children || [];
                }
                // console.log(dataToUpdate, 'dataToUpdate');
                for(let i=0; i<frame.data.values.length; i++){
                    dataToUpdate[i] = {
                        ...dataToUpdate[i],
                        children:[
                            ...dataToUpdate[i].children,
                            {
                                name: frame.data.headers[currentIndex],
                                value: frame.data.values[i][currentIndex],
                                children: [],
                                childrenIndex: currentIndex + 1,
                                category: frame.data.headers[currentIndex],
                            }
                        ]
                    };
                }
            }
            console.log(currentIndex, dataToUpdate, 'data');
            currentIndex++;
            // data.children = getDataValues(currentIndex+1, framesLength, data.children);
        }
        return data;
        
    }
    const dataOption = useMemo(()=>{
        let option = JSON.parse(computedValue);

        let seriesIndex = option['series'].findIndex((item)=>item.type === 'tree' && item.data.length);
        if(seriesIndex > -1){
            let data = option['series'][seriesIndex]['data'];
            let updatedData = getDataValues(0,frame.data.headers.length,[data]);
            let updatedDataListres = getDataValuesUpdate(0,frame.data.headers.length, [{name: 'Root', children: [], childrenIndex: 0}]);
            console.log(updatedDataListres, 'updatedres');
            option['series'][seriesIndex]['data'] = updatedDataListres;
        }
        let legendData = ['Root', ...frame.data.headers];
        if(option['legend']?.['show']){
        let legendSeries = legendData.map((item)=>{
                return {
                    name: item,
                    type: 'tree',
                    data: [],
                };
            });
            option['series'] = [
                ...option['series'],
                ...legendSeries
            ];
        }
        option = {
            ...option,
            ['legend']:{
                ...option['legend'],
                ['orient']: 'vertical',
                ['left']: 'right',
                ['data']: ['Root', ...frame.data.headers],
            }
        };
        return option;
    },[frame.data.headers, computedValue]);

    useEffect(()=>{
        if(frame.isLoading === false && frame.data.values.length > 0){
            updateJson(dataOption, 'option');
        }
    },[frame.data.values]);

    console.log(frame, 'frame', dataOption);

    return (
        <StyledMainContainer id={id}>
            <EChartsReact
                option={dataOption as EChartsOption}
                // onChartReady={echartsLoaded}
                // onEvents={onClickChart}
                style={{
                    height: "inherit",
                    width: "inherit",
                }}
            />
        </StyledMainContainer>
    )

});