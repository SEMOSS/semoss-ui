import { observer } from 'mobx-react-lite';

import { useBlock, useBlockSettings } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { styled } from '@mui/material';
import { Bar } from './Variants/bar-chart/Bar';
import { Pie } from './Variants/PieChart/Pie';
import { useMemo, useRef } from 'react';
import { BAR_CHART_DATA } from './Visualization.constants';
import { PathValue } from '@/types';
import { ScatterPlotBlock } from './Variants/ScatterPlot/ScatterPlot';

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    minHeight: '50%',
    minWidth: '50%',
    maxWidth: '80%',
    maxHeight: '80%',
    color: error ? theme.palette.error.main : 'unset',
}));

const StyledDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    minHeight: '50%',
    minWidth: '50%',
}));

export interface VisualizationColumns {
    name: string;
    selector: string;
    width: string;
}

export interface EchartVisualizationBlockDef {
    widget: 'e-chart';
    data: {
        style: {
            height: number;
            width: number;
            display: string | undefined;
            // flexDirection: string | undefined;
            padding: string | undefined;
            gap: string | undefined;
            // flexWrap: string | undefined;
        };
        option: {};
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: VisualizationColumns[];
        contextMenu: {
            hideUnfilter: boolean;
            hideFilter: boolean;
            hideExclude: boolean;
        };
    };
    listeners: {};
    slots: never;
}

export const VisualizationBlock: BlockComponent = observer(
    <D extends BlockDef = BlockDef>({ id }) => {
        const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);
        const { setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
        const elementRef = useRef<HTMLDivElement>(null);
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        //update chart json when data is changed
        function updateChartJson(data: any, path: any) {
            const parsedData =
                typeof data === 'string' ? JSON.parse(data) : data;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        'option',
                        parsedData as PathValue<D['data'], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        //get the updated data style when data.style is changed
        const updatedDataStyle = useMemo(() => {
            let isEm =
                data.style.height.toString().endsWith('em') &&
                data.style.width.toString().endsWith('em');
            let isPx =
                data.style.height.toString().endsWith('px') &&
                data.style.width.toString().endsWith('px');
            if (isEm || isPx) return { ...data.style }; //if values mentioned in em or px, then return same style
            //if any of style is different from % then, take that value and convert % value to px equivalent
            let calculatedHeight =
                data.style.height.toString().endsWith('em') ||
                data.style.height.toString().endsWith('px')
                    ? data.style.height
                    : BAR_CHART_DATA.HEIGHT;
            let calculatedWidth = data.style.width;
            if (data.style.height.toString().endsWith('%')) {
                let heightGivenInPercent = parseInt(
                    data.style.height.toString().replace('%', ''),
                );
                let height = parseInt(
                    data.style.height.toString().replace('%', ''),
                );
                calculatedHeight =
                    (calculatedHeight * heightGivenInPercent) / 100;
                //return updated style
                return {
                    ...data.style,
                    height: calculatedHeight + 'px',
                    width: calculatedWidth,
                };
            }
            //return updated style
            return {
                ...data.style,
                height: calculatedHeight,
                width: calculatedWidth,
            };
        }, [data.style]);

        if (!data.option) {
            return (
                <StyledNoDataContainer {...attrs}>
                    Add JSON to render your visualization
                </StyledNoDataContainer>
            );
        }
        if (typeof data.option === 'string') {
            try {
                return (
                    <StyledNoDataContainer
                        {...attrs}
                        style={{ ...updatedDataStyle }}
                        ref={elementRef}
                    >
                        {data.variation === 'echart-bar-graph' && (
                            <Bar id={id} updateJson={updateChartJson} />
                        )}
                        {data.variation === 'echart-pie-chart' && (
                            <Pie id={id}></Pie>
                        )}
                        {data.variation === 'echart-scatter-plots' && (
                            <ScatterPlotBlock id={id} />
                        )}
                    </StyledNoDataContainer>
                );
            } catch (e) {
                return (
                    <StyledNoDataContainer error {...attrs}>
                        There was an issue parsing your JSON.
                    </StyledNoDataContainer>
                );
            }
        }
        return (
            <StyledDataContainer {...attrs} style={{ ...updatedDataStyle }}>
                {data.variation === 'echart-bar-graph' && (
                    <Bar id={id} updateJson={updateChartJson} />
                )}
                {data.variation === 'echart-pie-chart' && <Pie id={id}></Pie>}
                {data.variation === 'echart-scatter-plots' && (
                    <ScatterPlotBlock id={id} />
                )}
            </StyledDataContainer>
        );
    },
);
