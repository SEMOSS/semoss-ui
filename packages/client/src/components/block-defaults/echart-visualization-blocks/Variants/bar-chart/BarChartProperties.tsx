import { useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, styled, TextField } from '@semoss/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import CustomAccordianBlock from './CustomAccordianBlock';

interface BarChartPropertiesProps {
    id: string;
    mountedStatus: boolean;
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
export const BarChartProperties = observer<BarChartPropertiesProps>(
    ({ id, mountedStatus }) => {
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

        useEffect(() => {
            if (mountedStatus) {
                updateChartInstance();
            }
        }, [mountedStatus]);

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
        function updateChartInstance(): any {
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
        }

        function updateChart() {
            // let workingPageElement = document.getElementById(workingPage);
            // let canvasElement: any =
            //     workingPageElement.getElementsByTagName('CANVAS')[0] || null;
            // if (canvasElement === null) return;
            // let instance = null;
            // while (instance == null) {
            //     let instanceReceived = echarts.getInstanceByDom(canvasElement);
            //     if (instanceReceived) {
            //         instance = instanceReceived;
            //         if (canvasElement.id === id) {
            //             instance = null;
            //         }
            //         break;
            //     }
            //     canvasElement = canvasElement.parentElement;
            // }
            // echartInstance.current = instance;
            let dataBlockElement: any = document.querySelector(
                `div#${workingPage} div[data-block="${id}"]`,
            );
            let dataBlockIdElement: any = dataBlockElement.children[0];
            let dataBlockInstanceElement: any = dataBlockIdElement.children[0];
            echartInstance.current.resize({
                width: dataElementWidth,
                height: dataElementHeight,
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
                dataBlockInstanceElement.style.width = dataElementWidth + 'px';
                dataBlockInstanceElement.style.height =
                    dataElementHeight + 'px';
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
            // <CustomAccordianBlock
            //     accordianExpanded={false}
            //     accordianSummaryProps={<ExpandMoreIcon />}
            //     accordianSummary={'Chart Properties'}
            //     accordianDetails={accordionDetails}
            // />
            <>{accordionDetails}</>
        );
    },
);
