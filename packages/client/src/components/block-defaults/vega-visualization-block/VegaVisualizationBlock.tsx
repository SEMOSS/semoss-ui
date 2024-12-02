import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks, useFrame } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { VisualizationSpec, createClassFromSpec } from 'react-vega';
import { styled } from '@mui/material';
import { GridBlockColumn } from '../grid-block';
import { useState, useEffect } from 'react';
import { PieChartContextMenu } from './PieChartContextMenu';
import vega from 'vega';

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

export interface VegaVisualizationBlockDef extends BlockDef<'vega'> {
    widget: 'vega';
    data: {
        frame: {
            name: string;
        };

        /** Column Definitions */
        columns: GridBlockColumn[];

        /** */
        style: Pick<React.CSSProperties, 'height' | 'width'>;
        specJson: VisualizationSpec | string;
        variation?: undefined | string;
        contextMenu?: {
            /** Show the unfilter related options */
            hideUnfilter: boolean;

            /** Show the filter related options */
            hideFilter: boolean;

            /** Show the exclude related options */
            hideExclude: boolean;
        };
    };
    listeners: never;
    slots: never;
}

export const VegaVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: any;
    } | null>(null);
    console.log(data, '<<<<2>>>>>');
    let selector = '';
    if (data.hasOwnProperty('columns')) {
        selector = `Select(${data.specJson['layer'][0]['encoding']['color']['field']},Count(${data.specJson['layer'][0]['encoding']['theta']['field']})).as([${data.specJson['layer'][0]['encoding']['color']['field']}, ${data.specJson['layer'][0]['encoding']['theta']['field']}])|Group(${data.specJson['layer'][0]['encoding']['color']['field']})`;
    }
    const frame = useFrame(data?.frame?.name, {
        selector: selector,
    });

    const formatDataPoints = (resultData: unknown) => {
        if (resultData['values']) {
            return resultData['values'].map((row) => ({
                [data.specJson['layer'][0]['encoding']['theta']['field']]:
                    row[1],
                [data.specJson['layer'][0]['encoding']['color']['field']]:
                    row[0],
            }));
        }
    };

    const handleView = (view) => {
        view.addEventListener('click', (event, item) => {
            if (item && item.datum) {
                console.log('clicked data:', item.datum);
            }
        });

        view.addEventListener('contextmenu', (event, item) => {
            // prevent the default interaction
            event.preventDefault();
            if (item && item.datum) {
                console.log('RightClicked', item.datum);
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: event.clientX + 2,
                              mouseY: event.clientY - 6,
                              value: {
                                  label: data.specJson['layer'][0]['encoding'][
                                      'color'
                                  ]['field'],
                                  value: item.datum,
                              },
                          }
                        : null,
                );
            }
        });
    };

    if (!data.specJson) {
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
            data.specJson['data']['values'] = formatDataPoints(frame.data);
            const specJson = JSON.parse(data.specJson);

            const Chart = createClassFromSpec({ spec: specJson });

            return (
                <StyledChartContainer {...attrs}>
                    <Chart actions={false} onNewView={handleView} />
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
        data.specJson['data']['values'] = formatDataPoints(frame.data);
        const Chart = createClassFromSpec({ spec: data.specJson });

        return (
            <StyledChartContainer {...attrs}>
                <Chart actions={false} onNewView={handleView} />
                <PieChartContextMenu
                    id={id}
                    frame={frame}
                    contextMenu={contextMenu}
                    onClose={() => setContextMenu(null)}
                />
            </StyledChartContainer>
        );
    }
});
