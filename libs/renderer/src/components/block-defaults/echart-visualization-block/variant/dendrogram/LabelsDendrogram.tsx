import { useState, useEffect, useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { Button, Select, styled, Typography, MenuItem, Switch, TextField } from '@semoss/ui';
import { ChangeEvent } from 'react';
import { BlockDef } from '../../../../../store';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import { useBlockSettings } from '../../../../../hooks';
import { getValueByPath } from '@/utility';
import { ColorPickerSettings } from '../../../../block-settings/shared/ColorPickerSettings';
import { PathValue } from '@/types';
const StyledMainContainer = styled("div")<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "0.5rem",
}));

const StyledSubSection = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "0.5rem",
    marginLeft: "2px",
}));

const StyledSubColumnSection = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "0.5rem",
    marginLeft: "2px",
}));

interface LabelsDendrogramProps {
    id: string;
    path: any;
}

export const LabelsDendrogram = observer(
    <D extends BlockDef = BlockDef>({ id, path }) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [seriesIndexData, setSeriesIndexData] = useState('option.series.0.label.color');
        const [labelsData, setLabelsData] = useState({
            showLabels: false,
            labelFontColor: "#000000",
            labelFontSize: 12,
        });
        const [labelsUpdated, setLabelsUpdated] = useState(false);
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
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
        // useEffect(() => {
        //     let option = typeof computedValue === 'string' ? JSON.parse(computedValue) : computedValue;
        //         let seriesIndex = option['series'].findIndex((item)=>item.type==='tree' && item.data.length>0);
        //         setSeriesIndexData(`option.series.${seriesIndex}.label.color`);
        // },[computedValue]);

        function updateFields(fieldsName, fieldsValue) {
            setLabelsUpdated(true);
            setLabelsData({
                ...labelsData,
                [fieldsName]: fieldsValue, 
            });
        }
        useEffect(()=>{
            if(!labelsUpdated) return;
            let option :PathValue<D["data"], typeof path> = typeof computedValue === 'string' ? JSON.parse(computedValue) : computedValue;
            let seriesIndex = option['series'].findIndex((item)=>item.type==='tree' && item.data.length>0);
            option['series'][seriesIndex] = {
                ...option['series'][seriesIndex],
                label:{
                    ...option['series'][seriesIndex]['label'],
                    fontSize: labelsData.labelFontSize,
                    show: labelsData.showLabels,
                }
            };
            runStateUpdateCustom(option);
        },[labelsData]);

        useEffect(()=>{
            let option :PathValue<D["data"], typeof path> = typeof computedValue === 'string' ? JSON.parse(computedValue) : computedValue;
            let seriesIndex = option['series'].findIndex((item)=>item.type==='tree' && item.data.length>0);
            let labelsDataList = labelsData;
            labelsDataList.showLabels = option['series'][seriesIndex]['label']['show'];
            labelsDataList.labelFontColor = option['series'][seriesIndex]['label']['color'];
            labelsDataList.labelFontSize = Number(option['series'][seriesIndex]['label']['fontSize']);
            setLabelsUpdated(false);
            setLabelsData((prevLabels)=>{
                return {...labelsDataList};
            });
            setSeriesIndexData(`option.series.${seriesIndex}.label.color`);
        },[]);

        function runStateUpdateCustom(option){
            if(timeoutRef.current){
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(()=>{
                try{
                    setData(path, option);
                }
                catch(e){
                    console.log(e);
                }
            },300);
        }
        function resetToInitialState(){
            setLabelsData((prevLabels)=>({
               showLabels: false,
               labelFontColor: "#000000",
               labelFontSize: 18
            }));
        }
        console.log(labelsData, 'labelsData', JSON.parse(computedValue));
        const showLabelsEnabled = labelsData.showLabels;
        return (
            <StyledMainContainer>
                <StyledSubSection display="flex" justifyContent="start">
                    <Switch
                        checked={showLabelsEnabled}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>(updateFields('showLabels', e.target.checked))}
                        title="Show Labels"
                    />
                    <label style={{paddingLeft: "0.5rem"}}>Show Labels</label>
                </StyledSubSection>
                {
                    showLabelsEnabled && (
                        <StyledSubColumnSection display="flex" justifyContent="space-between">
                            <ColorPickerSettings 
                                id={id}
                                path={seriesIndexData}
                                colorValue={labelsData.labelFontColor}
                                onChange={(e: string)=>{}}
                            />
                        </StyledSubColumnSection>
                    )
                }
                {
                    showLabelsEnabled && (
                        <StyledSubColumnSection display="flex" justifyContent="space-between">
                            <label htmlFor="label-font-size">Label Font Size:</label>
                            <TextField
                                id="label-font-size"
                                type="number"
                                value={labelsData.labelFontSize}
                                onChange={(e) => updateFields('labelFontSize', e.target.value)}
                            />
                        </StyledSubColumnSection>
                    )
                }
                <StyledSubSection display="flex" justifyContent="flex-end">
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={resetToInitialState}
                    >
                        Reset
                    </Button>
                </StyledSubSection>
            </StyledMainContainer>
        );
    });