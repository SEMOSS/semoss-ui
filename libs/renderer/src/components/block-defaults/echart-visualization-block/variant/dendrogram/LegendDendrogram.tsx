import { useState, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { Button, Select, styled, Typography, MenuItem, Switch } from '@semoss/ui';
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
    flexDirection: "row",
    padding: "0.5rem",
    marginLeft: "2px",
}));

interface LegendDendrogramProps {
    id: string;
}

export const LegendDendrogram = observer(({ id }: LegendDendrogramProps) => {
    const { data, setData } = useBlockSettings(id);
    const [legend, setLegend] = useState(false);
    const [legendUpdated, setLegendUpdated] = useState(false);

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
            let option = typeof computedValue === "string" ? JSON.parse(computedValue) : computedValue;
            option = {
                ...option,
                ['legend']: {
                    ...option['legend'],
                    ['show']: legend,
                }
            };
            runStateUpdate(option);
        }, [legend]);
        useEffect(() => {
            let option = typeof computedValue === "string" ? JSON.parse(computedValue) : computedValue;
            let legendData = option['legend']?.['show'] || false;
            setLegend(legendData);
        }, []);
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

    return (
        <StyledMainContainer>
                            <StyledSubSection display="inline-flex" justifyContent="space-around" style={{width: '100%'}}>
                                <Switch
                                    checked={legend ?? undefined}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>(setLegend(e.target.checked))}
                                    title="Show Legend"
                                />
                                <Typography variant="body2" sx={{
                                    fontSize: '15px',
                                    paddingLeft: '20px',
                                    width: '100%'
                                }}>Show Legend</Typography>
                            </StyledSubSection>
        </StyledMainContainer>
    );
});