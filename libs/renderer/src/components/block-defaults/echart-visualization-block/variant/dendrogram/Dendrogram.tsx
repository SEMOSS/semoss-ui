import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { styled } from "@mui/material";
import * as echarts from "echarts/core";
import EChartsReact from "echarts-for-react";

import { getValueByPath } from "../../../../../utility";
import { useBlockSettings, useFrame } from "../../../../../hooks";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { color, EChartsOption } from "echarts";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";

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
    const [contextMenu, setContextMenu] = useState<{
            mouseX: number; //x axis position for the click/brush event
            mouseY: number; //y axis position for the click/brush event
            value: unknown; //value can be of object or string or number type
        } | null>(null);
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

    const parsedJson = useMemo(() => {
        try {
            return JSON.parse(computedValue);
        } catch (e) {
            return null;
        }
    },[computedValue]);


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
    function getSelectorData(header){
        let headerDataList = data.columns.find((item)=>item.name == header)?.selector || '';
        return headerDataList;
    }
    function getColorData(currentIndex){
        let colorList = parsedJson?.color || [];
        return colorList[currentIndex%colorList.length] || '#b0c4de';

    }
    /*function getDataValuesUpdate(currentIndex, framesLength = 0, data, childrenIndexData = -1){
        let i=0;
        while(i < data.length){
            // console.log(i, data[i], 'data[i]');
            if(data[i].childrenIndex == currentIndex){
                for(let j=0;j<frame.data.values.length;j++){
                    if(frame.data.headers[currentIndex] !== undefined && frame.data.values[j][currentIndex] !== undefined){
                        if(currentIndex == 0 || (childrenIndexData > -1 && childrenIndexData == j && data.length == 1)){
                            if(currentIndex == 4){
                                console.log(data, childrenIndexData, 'childrenIndexData');
                            }
                            if(currentIndex == 0){
                                data[i].children[j] = {
                                    ...data[i].children[j],
                                    name: frame.data.headers[currentIndex],
                                    value: frame.data.values[j][currentIndex],
                                    category: frame.data.headers[currentIndex],
                                    selector: getSelectorData(frame.data.headers[currentIndex]),
                                    children: [],
                                    childrenIndex: currentIndex + 1,
                                    itemStyle:{
                                        color: getColorData(currentIndex+1),
                                    }
                                };
                            }
                            if((childrenIndexData > -1 && childrenIndexData == j) && data.length == 1){
                                if(!data[i].children.length){
                                    data[i].children.push({
                                        name: frame.data.headers[currentIndex],
                                        value: frame.data.values[j][currentIndex],
                                        category: frame.data.headers[currentIndex],
                                        selector: getSelectorData(frame.data.headers[currentIndex]),
                                        children: [],
                                        childrenIndex: currentIndex + 1,
                                        itemStyle:{
                                            color: getColorData(currentIndex+1),
                                        }
                                    });
                                }else{
                                    data[i].children[0] = {
                                        ...data[i].children[0],
                                        name: frame.data.headers[currentIndex],
                                        value: frame.data.values[j][currentIndex],
                                        category: frame.data.headers[currentIndex],
                                        selector: getSelectorData(frame.data.headers[currentIndex]),
                                        children: [],
                                        childrenIndex: currentIndex + 1,
                                        itemStyle:{
                                            color: getColorData(currentIndex+1),
                                        },
                                    };
                                }
                            }
                        }else{
                            // console.log(i, j, childrenIndexData, data, data[i].children, data[i].children[j], frame.data.values[j], currentIndex, frame.data.values[j][currentIndex], 'frameData');
                            if(i==j && data.length > 1){
                                    data[i].children = [{
                                        name: frame.data.headers[currentIndex],
                                        value: frame.data.values[j][currentIndex],
                                        category: frame.data.headers[currentIndex],
                                        selector: getSelectorData(frame.data.headers[currentIndex]),
                                        children: [],
                                        childrenIndex: currentIndex + 1,
                                        itemStyle:{
                                            color: getColorData(currentIndex+1),
                                        }
                                    }];
                                // break;
                            }
                        }
                    }
                }
                i++;
            }
            else{
                console.log(currentIndex, framesLength, data[i].children, 'data[i].children');
                data[i].children = getDataValuesUpdate(currentIndex, framesLength, data[i].children, i);
                // console.log(currentIndex, framesLength, data[i].children, 'data[i].children');
                if(data[i].children.length > 0){i++;}
            }
        }
        if((currentIndex+1) < framesLength){
            currentIndex++;
            // console.log(currentIndex, data, framesLength, 'getDataValuesUpdate');
            return getDataValuesUpdate(currentIndex, framesLength, data);
        }
        return data;
    }*/
    const dataOption = useMemo(()=>{
        let option = JSON.parse(computedValue);

        let seriesIndex = option['series'].findIndex((item)=>item.type === 'tree' && item.data.length);
        if(seriesIndex > -1){
            let data = option['series'][seriesIndex]['data'];
            // let updatedDataListres = getDataValuesUpdate(0,frame.data.headers.length, [{name: 'Root', children: [], childrenIndex: 0, itemStyle: {color: getColorData(0)}}], -1);
            let updatedDataListresLoop = [{
                name: 'Root',
                children: [],
                childrenIndex: 0,
                itemStyle: { color: getColorData(0) }
            }];
            for (let i = 0; i < frame.data.values.length; i++) {
                let currentParent = updatedDataListresLoop[0]; // Start from Root for each row
                for (let j = 0; j < frame.data.values[i].length; j++) {
                    const childNode = {
                        name: frame.data.headers[j],
                        value: frame.data.values[i][j],
                        category: frame.data.headers[j],
                        selector: getSelectorData(frame.data.headers[j]),
                        children: [],
                        childrenIndex: j + 1,
                        itemStyle: {
                            color: getColorData(j + 1),
                        }
                    };
                    currentParent.children.push(childNode);
                    currentParent = childNode; // Move deeper for the next child
                }
            }
            option['series'][seriesIndex]['data'] = updatedDataListresLoop;
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
    },[frame.data.values, computedValue]);

    useEffect(()=>{
        if(frame.isLoading === false && frame.data.values.length > 0){
            updateJson(dataOption, 'option');
        }
    },[frame.data.values]);

        //on events object for getting and processing events with chart
        const onClickChart = {
            //when contextmenu event is raised, default context menu made hidden, and custom component is shown
            contextmenu: (params) => {
                if (params.data) {
                    console.log(params, 'params');
                    const selector = params.data.selector;
                    const value = params.data.value;
                    setContextMenu(
                        contextMenu === null
                            ? {
                                  mouseX: params.event.event.clientX,
                                  mouseY: params.event.event.clientY,
                                  value: {
                                      label: selector,
                                      value: value,
                                  },
                              }
                            : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                              // Other native context menus might behave different.
                              // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                              null,
                    );
                    params.event.event.preventDefault();
                } else {
                    params.event.event.preventDefault();
                }
            },
    };

    return (
        <StyledMainContainer id={id}>
            <EChartsReact
                option={dataOption as EChartsOption}
                // onChartReady={echartsLoaded}
                onEvents={onClickChart}
                style={{
                    height: "inherit",
                    width: "inherit",
                }}
            />
            <VizBlockContextMenu id={id} frame={frame} contextMenu={contextMenu} onClose={() => {
                        setContextMenu(null);
                    }} />
        </StyledMainContainer>
    )

});