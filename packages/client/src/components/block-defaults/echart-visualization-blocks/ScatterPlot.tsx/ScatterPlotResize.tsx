import { useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, styled, TextField } from '@semoss/ui';
import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

import { EchartVisualizationBlockDef } from '../EchartVisualizationBlock';
import AccordianBlock from './AccordianBlock';

interface ScatterPlotPropertiesProps {
    id: string;
}

const StyledDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '30vh',
    width: '60vw',
    color: error ? theme.palette.error.main : 'unset',
}));

const StyledDataSection = styled('div')(({}) => ({
    display: 'flex',
    alignContent: 'center',
}));
const workingPage = 'page-1';
export const ScatterPlotResize = observer<ScatterPlotPropertiesProps>(
    ({ id }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const selectedChartWidth = document.querySelector(
            `div#${workingPage} div[data-block="${id}"]`,
        ).clientWidth;
        const selectedChartHeight = document.querySelector(
            `div#${workingPage} div[data-block="${id}"]`,
        ).clientHeight;
        const echartInstance = useRef(null);
        const [dataElementWidth, setDataElementWidth] =
            useState(selectedChartWidth);
        const [dataElementHeight, setDataElementHeight] =
            useState(selectedChartHeight);
        console.log(
            selectedChartHeight,
            selectedChartWidth,
            dataElementWidth,
            dataElementHeight,
            'testh&w',
        );

        useEffect(() => {
            let workingPageElement = document.getElementById(workingPage);
            let canvasElement: any =
                workingPageElement.getElementsByTagName('CANVAS')[0] || null;
            if (canvasElement === null) return;
            let instance = null;
            while (instance == null) {
                let instanceReceived = echarts.getInstanceByDom(canvasElement);
                if (instanceReceived) {
                    instance = instanceReceived;
                    if (canvasElement.id === id) {
                        instance = null;
                    }
                    break;
                }
                canvasElement = canvasElement.parentElement;
            }
            echartInstance.current = instance;
        }, []);

        function getAndUpdateWidth(e) {
            setDataElementWidth((prevDataElementWidth) => {
                return e.target.value ?? prevDataElementWidth;
            });
        }

        function getAndUpdateHeight(e) {
            setDataElementHeight((prevDataElementHeight) => {
                return e.target.value ?? prevDataElementHeight;
            });
        }

        function updateChart() {
            let dataBlockElement: any = document.querySelector(
                `div#${workingPage} div[data-block="${id}"]`,
            );
            let workingPageElement = document.getElementById(workingPage);
            let canvasElement: any =
                workingPageElement.getElementsByTagName('CANVAS')[0] || null;
            if (canvasElement === null) return;
            let instance = null;
            while (instance == null) {
                let instanceReceived = echarts.getInstanceByDom(canvasElement);
                if (instanceReceived) {
                    instance = instanceReceived;
                    if (canvasElement.id === id) {
                        instance = null;
                    }
                    break;
                }
                canvasElement = canvasElement.parentElement;
            }
            echartInstance.current = instance;
            let dataBlockIdElement: any = dataBlockElement.children[0];
            console.log(echartInstance.current, 'instance');
            echartInstance.current.resize({
                height: dataElementHeight,
                width: dataElementWidth,
                animation: {
                    duration: 100,
                    // easing: '',
                },
            });
            setTimeout(() => {
                dataBlockElement.style.width = dataElementWidth + 'px';
                dataBlockIdElement.style.width = dataElementWidth + 'px';
                dataBlockElement.style.height = dataElementHeight + 'px';
                dataBlockIdElement.style.height = dataElementHeight + 'px';
            }, 100);
        }

        const accordionDetails = (
            <StyledDataContainer>
                <StyledDataSection>
                    <TextField
                        id="width-field"
                        label="Enter Width"
                        type="number"
                        defaultValue={dataElementWidth}
                        onChange={getAndUpdateWidth}
                    />
                </StyledDataSection>
                <StyledDataSection>
                    <TextField
                        id="height-field"
                        label="Enter Height"
                        type="number"
                        defaultValue={dataElementHeight}
                        onChange={getAndUpdateHeight}
                    />
                </StyledDataSection>
                <StyledDataSection>
                    <Button onClick={updateChart}>Update Chart</Button>
                </StyledDataSection>
            </StyledDataContainer>
        );

        return (
            <AccordianBlock
                accordianExpanded={false}
                accordianSummaryProps={<ExpandMoreIcon />}
                accordianSummary={'Chart Properties'}
                accordianDetails={accordionDetails}
            />
        );
    },
);
