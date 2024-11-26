import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useFrame } from '@/hooks';
import { BlockComponent } from '@/stores';

import { VisualizationSpec, createClassFromSpec } from 'react-vega';
import { styled } from '@mui/material';
import { Stack } from '@semoss/ui';
import { VizBlockContextMenu } from './VizBlockContextMenu';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '200px',
    width: '200px',
    color: error ? theme.palette.error.main : 'unset',
}));

export interface VegaVisualizationBlockDef {
    widget: 'vega';
    data: {
        frame: {
            name: string;
        };
        axis: {
            x: string;
            y: string;
        };
        specJson: VisualizationSpec | string;
        variation?: undefined | string;
        /** Context Menu */
        contextMenu?: {
            /** Show the unfilter related options */
            hideUnfilter: boolean;

            /** Show the filter related options */
            hideFilter: boolean;
        };
    };
    listeners: {
        onBrush: true;
    };
    slots: never;
}

export const VegaVisualizationBlock: BlockComponent = observer(({ id }) => {
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);

    //create context for menu
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);

    // create the selector
    const selector = `Select(${data.specJson['layer'][0]['encoding']['x']['field']}, Average(${data.specJson['layer'][0]['encoding']['y']['field']})).as([${data.specJson['layer'][0]['encoding']['x']['field']}, ${data.specJson['layer'][0]['encoding']['y']['field']}])|Group(${data.specJson['layer'][0]['encoding']['x']['field']})|Sort(${data.specJson['layer'][0]['encoding']['x']['field']})`;

    // get the frame
    const frame = useFrame(data.frame.name, { selector: selector });

    const handleSelection = debounce((value: any) => {
        // update the frame
        frame.filter(
            `SetFrameFilter(${
                data.specJson['layer'][0]['encoding']['x']['field']
            }==[${
                value[data.specJson['layer'][0]['encoding']['x']['field']]
            }])`,
        );
    }, 1000);

    const formatDataPoints = (resultData: unknown) => {
        // format the data points to match the vega specification
        if (resultData['values']) {
            return resultData['values'].map((row) => ({
                [data.specJson['layer'][0]['encoding']['x']['field']]: row[0],
                [data.specJson['layer'][0]['encoding']['y']['field']]: row[1],
            }));
        }
    };

    const handleContextMenu = (event: React.MouseEvent) => {
        // prevent the default interaction
        event.preventDefault();

        // open the menu and save the data
        setContextMenu(
            contextMenu === null
                ? {
                      mouseX: event.clientX + 2,
                      mouseY: event.clientY - 6,
                      value: '',
                  }
                : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                  // Other native context menus might behave different.
                  // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                  null,
        );
    };

    // format data for vega-lite
    data.specJson['data']['values'] = formatDataPoints(frame.data);

    if (!data.specJson || !data.frame.name) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add JSON to render your visualization
            </StyledNoDataContainer>
        );
    }
    if (typeof data.specJson === 'string') {
        // if it's a string, it's either invalid json or a query output that needs to be parsed
        // try to parse, and show error otherwise
        try {
            const specJson = JSON.parse(data.specJson);

            const Chart = createClassFromSpec({ spec: specJson });

            return (
                <StyledChartContainer {...attrs}>
                    <Chart actions={false} />
                </StyledChartContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer error {...attrs}>
                    There was an issue parsing your JSON.
                </StyledNoDataContainer>
            );
        }
    } else {
        console.log('RESULT >> ', data.specJson, frame.data);
        // if it's an object, it's valid json
        const Chart = createClassFromSpec({ spec: data.specJson });

        return (
            <Stack direction="column">
                <StyledChartContainer
                    {...attrs}
                    onContextMenu={handleContextMenu}
                >
                    <Chart
                        actions={false}
                        onNewView={(view) =>
                            view.addSignalListener('brush', (name, value) =>
                                handleSelection(value),
                            )
                        }
                    />
                    <VizBlockContextMenu
                        id={id}
                        frame={frame}
                        contextMenu={contextMenu}
                        onClose={() => setContextMenu(null)}
                    />
                </StyledChartContainer>
            </Stack>
        );
    }
});
