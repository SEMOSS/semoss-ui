import { observer } from 'mobx-react-lite';

import { useBlock, useFrame } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { VisualizationSpec, createClassFromSpec } from 'react-vega';
import { styled } from '@mui/material';
import { GridBlockColumn } from '../grid-block';
import { useState, useEffect } from 'react';
import { PieChartContextMenu } from './PieChartContextMenu';

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
        };
    };
    listeners: never;
    slots: never;
}

export const VegaVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [page, setPage] = useState(0);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        column: GridBlockColumn;
        value: unknown;
    } | null>(null);
    console.log(data, '<<<<2>>>>>');
    let selector = '';
    if (data.hasOwnProperty('columns')) {
        selector = `Select(${data?.columns
            .map((c) => {
                return c.selector;
            })
            .join(', ')}).as([${data?.columns
            .map((c) => {
                return c.name;
            })
            .join(', ')}])`;
    }
    const frame = useFrame(data?.frame?.name, {
        selector: selector,
    });
    useEffect(() => {
        if (
            data.frame?.name &&
            frame.hasOwnProperty('data') &&
            frame['data'].hasOwnProperty('headers') &&
            frame['data'].hasOwnProperty('values')
        ) {
            let tempFrameData = frame;
            console.log(tempFrameData['data']);
            let dataArray = {
                headerData: tempFrameData['data']['headers'],
                values: {},
            };
            tempFrameData['data']['headers']?.forEach((item, index) => {
                dataArray['values'][item] = [];
            });
            console.log(dataArray, 'dataArray');
            tempFrameData['data']['values'].forEach((item, index) => {
                item.forEach((subItem, subIndex) => {
                    dataArray['values'] = {
                        ...dataArray['values'],
                        [tempFrameData['data']['headers'][subIndex]]: [
                            item[subIndex],
                            ...dataArray['values'][
                                tempFrameData['data']['headers'][subIndex]
                            ],
                        ],
                    };
                });
            });
            let option = data;
            console.log(option, 'option');
        }
    }, [selector, data.frame]);

    const handleTableCellOnContextMenu = (
        event: React.MouseEvent,
        column: GridBlockColumn,
        value: unknown,
    ) => {
        // prevent the default interaction
        event.preventDefault();

        // open the menu and save the data
        setContextMenu(
            contextMenu === null
                ? {
                      mouseX: event.clientX + 2,
                      mouseY: event.clientY - 6,
                      column: column,
                      value: value,
                  }
                : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                  // Other native context menus might behave different.
                  // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                  null,
        );
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
            const specJson = JSON.parse(data.specJson);

            const Chart = createClassFromSpec({ spec: specJson });

            return (
                <StyledChartContainer
                    {...attrs}
                    onContextMenu={(e) => {
                        console.log('Right clicked', e);
                        // if (!headerExists) {
                        //     return;
                        // }

                        handleTableCellOnContextMenu(
                            e,
                            data.columns[0], // hardcoded the first array for testing
                            '1', //hardcoded as 1 for testing
                        );
                    }}
                >
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
        const Chart = createClassFromSpec({ spec: data.specJson });

        return (
            <StyledChartContainer
                {...attrs}
                onContextMenu={(e) => {
                    // don't open context menu
                    console.log('Right clicked', e);
                    // if (!headerExists) {
                    //     return;
                    // }

                    handleTableCellOnContextMenu(
                        e,
                        data.columns[2], // hardcoded the first array for testing
                        'Amridge_University', //hardcoded as 1 for testing
                    );
                }}
            >
                <Chart actions={false} />
                {contextMenu != null ? (
                    <PieChartContextMenu
                        id={id}
                        frame={frame}
                        contextMenu={contextMenu}
                        onClose={() => setContextMenu(null)}
                    />
                ) : (
                    ''
                )}
            </StyledChartContainer>
        );
    }
});
