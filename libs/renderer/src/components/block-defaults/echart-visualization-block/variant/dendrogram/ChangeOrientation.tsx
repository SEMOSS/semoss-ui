import { useState, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { Button, Select, styled, Typography, MenuItem } from '@semoss/ui';
import { ChangeEvent } from 'react';
import { BlockDef } from '../../../../../store';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import { useBlockSettings } from '../../../../../hooks';
import { getValueByPath } from '@/utility';

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
    flexDirection: "column",
    padding: "0.5rem",
    marginLeft: "2px",
}));

interface ChangeOrientationProps {
    id: string;
}

export const ChangeOrientation = observer(({ id }: ChangeOrientationProps) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [orientationData, setOrientationData] = useState('LR');
    const [changeOrientationUpdated, setChangeOrientationUpdated] = useState(false); 

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

    useEffect(() => {
        const option = typeof computedValue === "string" ? JSON.parse(computedValue) : computedValue;
        let seriesIndex = option['series'].findIndex((item)=>item.type === 'tree');
        
        let orientation =option['series'][seriesIndex]['orient'] || orientationData;
        setOrientationData(orientation);
    }, []);

    useEffect(() => {
        if (orientationData!='') {
            const option = typeof computedValue === "string" ? JSON.parse(computedValue) : computedValue;
            let seriesIndex = option['series'].findIndex((item)=>item.type === 'tree');
            option['series'][seriesIndex]['orient'] = orientationData;
            runStateUpdate(option);
            setChangeOrientationUpdated(false);
        }
    }, [orientationData]);

    function runStateUpdate(option){
        setTimeout(()=>{
            try{
                setData('option',option);
            }
            catch(e){
                console.log(e);
            }
        },300);
    }
    function resetToInitialState(){
        setChangeOrientationUpdated(false);
        setOrientationData('LR');   
    }

    return (
            <StyledMainContainer>
                <StyledSubSection display="flex" justifyContent="space-around">
                    <Typography variant="body2">Select Orientation</Typography>
                    <Select
                        name="Orientation"
                        value={orientationData}
                        onChange={(e: ChangeEvent<HTMLInputElement>)=>{
                            console.log(e, 'symbolshape');
                            setChangeOrientationUpdated(true);
                            setOrientationData(e.target.value);
                        }}
                        size="medium"
                    >
                        <MenuItem value="LR">Horizontal</MenuItem>
                        <MenuItem value="TB">Vertical</MenuItem>
                    </Select>
                </StyledSubSection>
                <StyledSubSection display="flex" justifyContent="end" style={{flexDirection: 'row'}}>
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