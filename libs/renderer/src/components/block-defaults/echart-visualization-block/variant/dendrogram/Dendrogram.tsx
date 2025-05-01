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
import { DendrogramChartField } from "./DendrogramChartField";

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
//sub styled container to manage facet field with chart
const StyledContainer = styled("div")(() => ({
    display: "flex",
    justifyContent: "flex-start",
    width: "100%",
    height: "12%",
    maxHeight: "12%",
    overflow: "auto",
}));
//bar component properties
interface DendrogramProps {
    id: string;
    updateJson: (data: any, path: any) => void;
}

export const Dendrogram = observer(({ id, updateJson }: DendrogramProps) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
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
        const facetcomputedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, "facet.facetList");
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, "facet.facetList"]).get();

    const parsedJson = useMemo(() => {
        try {
            return JSON.parse(computedValue);
        } catch (e) {
            return null;
        }
    },[computedValue]);
//Select (bp_1d) | Sort(columns=["bp_1d"], sort=["asc"]) | Collect(-1)
    const facetSelector = useMemo(() => {
        return `Select (${data.facet?.facetSelected?.map((c, index) => {
            return c.selector;
        })}).as([${data.facet?.facetSelected?.map((c, index) => {return c.name;})}]) | Sort(columns=["${data.facet?.facetSelected?.map((c)=>c.name)}"], sort=["asc"]) `;
    },[data.facet.facetSelected]);

    const facetFrame = useFrame(data.frame.name,{
        selector: facetSelector
    });
    const facetAndDimensionSelector = useMemo(()=>{
        let valueToCheck = (data.facet?.facetSelected?.[0]?.value == 0 ? facetFrame.data.values[0]?.[0] : data.facet?.facetSelected?.[0]?.value);
        valueToCheck = isNaN(parseInt(valueToCheck?.toString())) ? `"${valueToCheck}"` : valueToCheck;
        return `Select(${data.columns
                ?.map((c, index) => {
                    //Converting Y axis columns to Average by default
                    return c.selector;
                })
                .join(", ")}).as([${data.columns
                ?.map((c, index) => {
                    return c.name;
                })
                .join(", ")}]) | Filter(${data.facet?.facetSelected?.[0]?.name} == ${valueToCheck})`;
    },[data.facet.facetSelected, facetFrame.data.values]);

    const selector = useMemo(() => {
        if(data.facet?.facetSelected?.length && data.facet?.facetSelected?.[0]?.selector != ''){
            return facetAndDimensionSelector;
        }
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
    }, [data.columns, data.facet.facetSelected, facetFrame.data.values]);

    useEffect(()=>{
        if(facetFrame.isLoading === false && facetFrame.data.values.length > 0){
            setData('facet.facetList', facetFrame.data.values.map((item : string[]|number[])=>item[0].toString()));
            setData('facet.facetSelected',[{name: data.facet.facetSelected[0].name, selector: data.facet.facetSelected[0].selector, value: facetFrame.data.values?.[0]?.[0]?.toString() }]);
        }
    },[facetFrame.data.values]);

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
    const dataOption = useMemo(()=>{
        let option = JSON.parse(computedValue);

        let seriesIndex = option['series'].findIndex((item)=>item.type === 'tree' && item.data.length);
        let dataColumns = data.columns?.find((item)=>item.hasOwnProperty('isFacet')) || {};
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
                    if(dataColumns.hasOwnProperty('name') && (j+1 == frame.data.values[i].length)) continue;
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
            option['series'][seriesIndex] = {
                ...option['series'][seriesIndex],
                label: {
                    ...option['series'][seriesIndex].label,
                    formatter: (params) => {
                        if(params.data.name === 'Root' && params.seriesIndex === 0){
                            return "";
                        }
                        return params.data.value;
                    },
                }
            }
        }
        let legendData = ['Root', ...frame.data.headers];
        if(option['legend']?.['show']){
        let legendSeries = legendData.map((item, index)=>{
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
                ['orient']: 'horizontal',
                ['left']: 'center',
                ['data']: ['Root', ...frame.data.headers].map((item, index)=>{
                    return {
                        name: item,
                        icon: option['series'][seriesIndex].hasOwnProperty('symbol') ? option['series'][seriesIndex]['symbol'] : 'circle',
                        itemStyle: {
                            color: getColorData(index),
                        },
                    }
                }),
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
    const showDendrogramChartField = data.facet.facetSelected.length ? true : false;
    console.log(dataOption, 'dendrogram option');
    return (
        <StyledMainContainer id={id}>
            <EChartsReact
                option={dataOption as EChartsOption}
                // onChartReady={echartsLoaded}
                onEvents={onClickChart}
                showLoading={frame.isLoading || facetFrame.isLoading}
                style={{
                    height: showDendrogramChartField ? '87%' : '100%',
                    width: '100%',
                }}
            />
            <StyledContainer>
                {showDendrogramChartField && <DendrogramChartField id={id} facetListData={facetFrame.data.values} />}
            </StyledContainer>
            <VizBlockContextMenu id={id} frame={frame} contextMenu={contextMenu} onClose={() => {
                        setContextMenu(null);
                    }} />
        </StyledMainContainer>
    )

});