import { useBlock, useBlocks, useBlockSettings } from '@/hooks';
import { Stack, styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Paths, PathValue } from '@/types';
import { ActionMessages } from '@/stores';
import { Console } from 'console';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));

export interface EChartVisualizationToolDef {
    showTool: boolean;
    id: any;
}

const EChartVisualizationTool = observer<EChartVisualizationToolDef>(
    ({ showTool, id }) => {
        const [showToolsSection, setShowToolsSection] = useState(showTool);
        const [showFeatureSection, setShowFeatureSection] = useState({
            xAxisDataZoomShow: true,
            yAxisDataZoomShow: true,
            currentFeatureChange: '',
        });
        const { data, setData } = useBlockSettings<any>(id);
        const { state } = useBlocks();
        // const { data, attrs } = useBlock(id);
        useEffect(() => {
            let option = data.option;
            debugger;
            let xAxisPosition = option['dataZoom'].findIndex((opt) =>
                opt.hasOwnProperty('xAxisIndex'),
            );
            let yAxisPosition = option['dataZoom'].findIndex((opt) => {
                return opt.hasOwnProperty('yAxisIndex');
            });
            let featureSectionState = {
                xAxisDataZoomShow: true,
                yAxisDataZoomShow: true,
                currentFeatureChange: '',
            };
            if (!option['dataZoom'][xAxisPosition].show) {
                featureSectionState.xAxisDataZoomShow = false;
            }
            if (!option['dataZoom'][yAxisPosition].show) {
                featureSectionState.yAxisDataZoomShow = false;
            }
            setShowFeatureSection(featureSectionState);
        }, []);
        useEffect(() => {
            updateToolsSection();
        }, [showToolsSection]);
        useEffect(() => {
            let option = data.option;
            console.log('feature section loaded');
            if (
                showFeatureSection.currentFeatureChange === 'xAxisDataZoomShow'
            ) {
                let xAxisPosition = option['dataZoom'].findIndex((opt) =>
                    opt.hasOwnProperty('xAxisIndex'),
                );
                option['dataZoom'][xAxisPosition].show =
                    !option['dataZoom'][xAxisPosition].show;
            }

            if (
                showFeatureSection.currentFeatureChange === 'yAxisDataZoomShow'
            ) {
                let yAxisPosition = option['dataZoom'].findIndex((opt) =>
                    opt.hasOwnProperty('yAxisIndex'),
                );
                option['dataZoom'][yAxisPosition].show =
                    !option['dataZoom'][yAxisPosition].show;
            } // option = {
            //     ...option,
            //     ['']
            // };
        }, [showFeatureSection]);
        //     let option = data.option;
        //     option = {
        //         ...option,
        //         ['toolbox']:{
        //             ...option['toolbox'],
        //             ['feature']:{
        //                 ...option['toolbox']['feature'],
        //                 ['dataZoom']: {
        //                     ...option['toolbox']['feature']['dataZoom'],
        //                     ['show']: showFeatureSection.dataZoomShow
        //                 }
        //             }
        //         }
        //     };
        //     // if(showFeatureSection.dataZoomShow){
        //     //     option = {
        //     //         ...option,
        //     //         toolbox:{
        //     //             // show: option['toolbox']['show'],
        //     //             ...option['toolbox'],
        //     //             feature:{
        //     //                 ...option['toolbox']['feature'],
        //     //                 dataZoom:{
        //     //                     show:true
        //     //                 }
        //     //             }
        //     //         }
        //     //     };
        //     // }else{
        //     //     option = {
        //     //         ...option,
        //     //         toolbox:{
        //     //             // show: option['toolbox']['show'],
        //     //             ...option['toolbox'],
        //     //             feature:{
        //     //                 ...option['toolbox']['feature'],
        //     //                 dataZoom:{
        //     //                     show:false
        //     //                 }
        //     //             }
        //     //         }
        //     //     };
        //     // }

        //     try{
        //         setData('option',option as PathValue<any, any>);
        //     }
        //     catch(e){
        //         console.log(e);
        //     }
        // },[showFeatureSection]);
        function showToolHandleChange(event) {
            setShowToolsSection((prevShowToolsSection) => {
                return !prevShowToolsSection;
            });
        }
        function updateToolsSection() {
            let option = data.option;
            option = {
                ...option,
                ['toolbox']: {
                    ...option['toolbox'],
                    ['show']: showToolsSection,
                },
            };
            console.log('option', option);
            try {
                setData('option', option as PathValue<any, any>);
            } catch (e) {
                console.log(e);
            }
        }
        function zoomChartButton(event) {
            // event.preventDefault();
            let option = data.option;
            let ZoomButton = option['toolbox']['feature']['dataZoom']['show'];
            setShowFeatureSection((prevshowFeatureSection) => {
                return {
                    ...prevshowFeatureSection,
                    currentFeatureChange: 'xAxisDataZoomShow',
                    xAxisDataZoomShow:
                        !prevshowFeatureSection.xAxisDataZoomShow,
                };
            });
        }
        function yAxisZoomChartButton(event) {
            let option = data.option;
            let ZoomButton = option['toolbox']['feature']['dataZoom']['show'];
            setShowFeatureSection((prevshowFeatureSection) => {
                return {
                    ...prevshowFeatureSection,
                    currentFeatureChange: 'yAxisDataZoomShow',
                    yAxisDataZoomShow:
                        !prevshowFeatureSection.yAxisDataZoomShow,
                };
            });
        }
        function flipAxis(event) {
            let option = data.option;
            console.log(option);
        }
        return (
            <Stack height={'100%'}>
                <StyledChartContainer>
                    <label htmlFor="showToolList">Show Tools Menu</label>
                    <input
                        type="checkbox"
                        id="showToolList"
                        name="showTool"
                        checked={showToolsSection ?? undefined}
                        onChange={showToolHandleChange}
                    />
                </StyledChartContainer>
                {showToolsSection && (
                    <StyledChartContainer>
                        <div
                            style={{
                                display: 'inline',
                                padding: '0 1rem',
                            }}
                        >
                            <button type="button" onClick={zoomChartButton}>
                                {showFeatureSection.xAxisDataZoomShow
                                    ? 'Hide'
                                    : 'Show'}{' '}
                                X-Axis Zoom
                            </button>
                            <button
                                type="button"
                                onClick={yAxisZoomChartButton}
                            >
                                {showFeatureSection.yAxisDataZoomShow
                                    ? 'Hide'
                                    : 'Show'}{' '}
                                Y-Axis Zoom
                            </button>
                            <button type="button" onClick={flipAxis}>
                                {' '}
                                Flip Axis
                            </button>
                        </div>
                    </StyledChartContainer>
                )}
                {!showToolsSection && <p>Tools for EChart</p>}
                <StyledChartContainer>
                    <p>Current Status:</p>
                    <p>
                        XAxis Zoom Button Enabled:{' '}
                        {showFeatureSection.xAxisDataZoomShow
                            ? 'enabled'
                            : 'disabled'}
                        <br />
                        YAxis Zoom Button Enabled:{' '}
                        {showFeatureSection.yAxisDataZoomShow
                            ? 'enabled'
                            : 'disabled'}
                    </p>
                </StyledChartContainer>
            </Stack>
        );
    },
);

export default EChartVisualizationTool;
