import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import { Bar } from './Variants/Bar';
import { ScatterPlotBlock } from './Variants/ScatterPlot';
import { useMemo, useRef } from 'react';

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '50vh',
    width: '80vh',
    color: error ? theme.palette.error.main : 'unset',
}));

export interface EChartColumns {
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
        };
        option: {};
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: EChartColumns[];
        contextMenu: {
            hideUnfilter: boolean;
            hideFilter: boolean;
            hideExclude: boolean;
        };
    };
    listeners: {};
    slots: never;
}

export const EchartVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);
    const elementRef = useRef<HTMLDivElement>(null);
    console.log(elementRef, 'elementRef');
    let parentElementHeight: number = 0;
    function getParentElementUnit(elementRef) {
        if (
            elementRef.current?.parentElement?.style?.height
                .toString()
                .endsWith('em')
        ) {
            return 'em';
        }
        if (
            elementRef.current?.parentElement?.style?.height
                .toString()
                .endsWith('px')
        ) {
            return 'px';
        }
        if (
            elementRef.current?.parentElement?.style?.height
                .toString()
                .endsWith('%')
        ) {
            return '%';
        }
    }
    let parentElementUnit: string = getParentElementUnit(elementRef);
    //let parentElementUnit: string = elementRef.current?.parentElement?.style?.height.toString().endsWith('em') ? 'em' : elementRef.current?.parentElement?.style?.height.toString().endsWith('px') ? 'px' : '%';
    if (parentElementUnit === 'em') {
        parentElementHeight = parseInt(
            elementRef.current?.parentElement?.style?.height
                .toString()
                .replace('em', ''),
        );
    }
    // else if(parentElementUnit === '%'){
    //     parentElementHeight = parseInt(elementRef.current?.parentElement?.clientHeight.toString().replace('%', ''));
    // }
    else {
        parentElementHeight = parseInt(
            elementRef.current?.parentElement?.style?.height,
        );
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
                : parentElementHeight;
        let calculatedWidth = data.style.width;
        if (data.style.height.toString().endsWith('%')) {
            let heightGivenInPercent = parseInt(
                data.style.height.toString().replace('%', ''),
            );
            let height = parseInt(
                data.style.height.toString().replace('%', ''),
            );
            console.log(
                calculatedHeight,
                'calculatedHeight',
                heightGivenInPercent,
                'heightGivenInPercent',
            );
            calculatedHeight = (calculatedHeight * heightGivenInPercent) / 100;
            console.log(calculatedHeight, 'calculatedHeight1');
            if (calculatedHeight > parentElementHeight) {
                calculatedHeight = parentElementHeight;
            }
            //return updated style
            return {
                ...data.style,
                height: calculatedHeight + parentElementUnit,
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
                    {data.variation === 'echart-bar-graph' && <Bar id={id} />}
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
    } else {
        return (
            <StyledNoDataContainer
                {...attrs}
                style={{ ...updatedDataStyle }}
                ref={elementRef}
            >
                {data.variation === 'echart-bar-graph' && <Bar id={id} />}
                {data.variation === 'echart-scatter-plots' && (
                    <ScatterPlotBlock id={id} />
                )}
            </StyledNoDataContainer>
        );
    }
});
